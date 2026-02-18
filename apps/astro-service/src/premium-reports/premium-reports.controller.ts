import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthClientService } from '../common/services/auth-client.service';
import { PremiumReportsService } from './premium-reports.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { PaymentService } from '../payment/payment.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { PurchaseOneTimeReportDto } from './dto/purchase-one-time-report.dto';
import { KundliService } from '../kundli/kundli.service';
import { CompatibilityService } from '../compatibility/compatibility.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { KundliDto } from '../kundli/dto/kundli.dto';
import { ChartType } from '../common/utils/coordinates.util';

const PREMIUM_REPORTS_FEATURE = 'premium_reports';
const ONE_TIME_REPORT_RUPEES = 99;
const ONE_TIME_REPORT_PAISE = ONE_TIME_REPORT_RUPEES * 100;

@Controller('api/v1/reports')
@ApiTags('Premium Reports')
export class PremiumReportsController {
  constructor(
    private readonly reportsService: PremiumReportsService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
    private readonly kundliService: KundliService,
    private readonly compatibilityService: CompatibilityService,
    private readonly authClient: AuthClientService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a premium PDF report (requires premium_reports feature)' })
  @ApiBody({ type: GenerateReportDto })
  @ApiOkResponse({ description: 'Report generated; returns id and downloadUrl' })
  async generate(
    @CurrentUser() user: { userId: string; token: string },
    @Body() dto: GenerateReportDto,
  ) {
    const canAccess = await this.subscriptionService.canAccessFeature(
      user.userId,
      PREMIUM_REPORTS_FEATURE,
    );
    if (!canAccess) {
      throw new HttpException(
        'Premium reports require an active subscription. Please upgrade.',
        HttpStatus.FORBIDDEN,
      );
    }
    if (dto.reportType === 'kundli_summary') {
      const userDetails = await this.authClient.getMe(user.token);
      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException('Birth details incomplete.', HttpStatus.BAD_REQUEST);
      }
      const dob = new Date(userDetails.dob);
      const dobString = dob.toISOString().split('T')[0];
      const birthTime = userDetails.birthTime || '12:00:00';
      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);
      const kundliDto: KundliDto = {
        dob: dobString,
        birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        chartType: ChartType.NorthIndian,
      };
      const kundli = await this.kundliService.getKundli(kundliDto);
      const content = {
        title: 'Kundli Summary Report',
        sections: [
          {
            heading: 'Lagna & Signs',
            text: `Lagna: ${kundli.lagna}. Moon Sign: ${kundli.moonSign}. Sun Sign: ${kundli.sunSign || 'N/A'}. Nakshatra: ${kundli.nakshatra}, Pada ${kundli.pada}.`,
          },
          {
            heading: 'Planetary Positions',
            text:
              kundli.planetaryPositions
                ?.map((p) => `${p.planet}: ${p.sign} (${p.degree?.toFixed(2) ?? ''}°)`)
                .join('. ') || 'No data.',
          },
          {
            heading: 'Houses',
            text:
              kundli.houses
                ?.map((h) => `House ${h.house}: ${h.sign}`)
                .join('. ') || 'No data.',
          },
        ],
      };
      const report = await this.reportsService.generateKundliSummaryPdf(
        user.userId,
        content,
      );
      return {
        id: report.id,
        reportType: report.reportType,
        downloadUrl: this.reportsService.getDownloadUrl(report.filename),
        createdAt: report.createdAt.toISOString(),
      };
    }
    throw new HttpException('Report type not implemented.', HttpStatus.BAD_REQUEST);
  }

  @Post('purchase-one-time')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase one-time PDF report for ₹99 (deducts from wallet)' })
  @ApiBody({ type: PurchaseOneTimeReportDto })
  @ApiOkResponse({ description: 'Report generated; returns id and downloadUrl' })
  async purchaseOneTime(
    @CurrentUser() user: { userId: string; token: string },
    @Body() dto: PurchaseOneTimeReportDto,
  ) {
    const debited = await this.paymentService.debitWallet(
      user.userId,
      ONE_TIME_REPORT_PAISE,
      `One-time report (₹${ONE_TIME_REPORT_RUPEES})`,
    );
    if (!debited) {
      throw new HttpException(
        `Insufficient balance. Add ₹${ONE_TIME_REPORT_RUPEES} to your wallet and try again.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (dto.reportType === 'compatibility_summary') {
      if (!dto.compatibilityPartners?.partner1 || !dto.compatibilityPartners?.partner2) {
        throw new HttpException(
          'For compatibility report, compatibilityPartners with partner1 and partner2 are required.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const p1 = dto.compatibilityPartners.partner1;
      const p2 = dto.compatibilityPartners.partner2;
      const chart1 = {
        year: p1.year,
        month: p1.month,
        day: p1.day,
        hour: p1.hour ?? 12,
        minute: p1.minute ?? 0,
        latitude: p1.latitude,
        longitude: p1.longitude,
      };
      const chart2 = {
        year: p2.year,
        month: p2.month,
        day: p2.day,
        hour: p2.hour ?? 12,
        minute: p2.minute ?? 0,
        latitude: p2.latitude,
        longitude: p2.longitude,
      };
      const result = await this.compatibilityService.calculateMarriageCompatibility(chart1, chart2);
      const g = result.gunaMilan;
      const sections: { heading: string; text: string }[] = [
        {
          heading: 'Guna Milan Score',
          text: `${g.totalScore} / ${g.maxScore} (${g.percentage}%) — ${g.verdict}.`,
        },
        {
          heading: 'Doshas',
          text: `Manglik: ${result.doshas.manglik}. Nadi: ${result.doshas.nadi}. Bhakoot: ${result.doshas.bhakoot}.`,
        },
        {
          heading: 'Guna-wise breakdown',
          text: g.gunas.map((x) => `${x.name}: ${x.score}/${x.maxScore} — ${x.description}`).join('. '),
        },
        {
          heading: 'Strengths',
          text: result.strengths.length ? result.strengths.join('. ') : 'None highlighted.',
        },
        {
          heading: 'Challenges',
          text: result.challenges.length ? result.challenges.join('. ') : 'None highlighted.',
        },
        {
          heading: 'Overall verdict',
          text: result.overallVerdict,
        },
      ];
      const report = await this.reportsService.generateCompatibilitySummaryPdf(user.userId, {
        title: 'Compatibility (Marriage) Report',
        sections,
      });
      return {
        id: report.id,
        reportType: report.reportType,
        downloadUrl: this.reportsService.getDownloadUrl(report.filename),
        createdAt: report.createdAt.toISOString(),
      };
    }

    if (dto.reportType === 'kundli_summary') {
      const userDetails = await this.authClient.getMe(user.token);
      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException('Birth details incomplete.', HttpStatus.BAD_REQUEST);
      }
      const dob = new Date(userDetails.dob);
      const dobString = dob.toISOString().split('T')[0];
      const birthTime = userDetails.birthTime || '12:00:00';
      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);
      const kundliDto: KundliDto = {
        dob: dobString,
        birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        chartType: ChartType.NorthIndian,
      };
      const kundli = await this.kundliService.getKundli(kundliDto);
      const content = {
        title: 'Kundli Summary Report',
        sections: [
          {
            heading: 'Lagna & Signs',
            text: `Lagna: ${kundli.lagna}. Moon Sign: ${kundli.moonSign}. Sun Sign: ${kundli.sunSign || 'N/A'}. Nakshatra: ${kundli.nakshatra}, Pada ${kundli.pada}.`,
          },
          {
            heading: 'Planetary Positions',
            text:
              kundli.planetaryPositions
                ?.map((p) => `${p.planet}: ${p.sign} (${p.degree?.toFixed(2) ?? ''}°)`)
                .join('. ') || 'No data.',
          },
          {
            heading: 'Houses',
            text:
              kundli.houses
                ?.map((h) => `House ${h.house}: ${h.sign}`)
                .join('. ') || 'No data.',
          },
        ],
      };
      const report = await this.reportsService.generateKundliSummaryPdf(user.userId, content);
      return {
        id: report.id,
        reportType: report.reportType,
        downloadUrl: this.reportsService.getDownloadUrl(report.filename),
        createdAt: report.createdAt.toISOString(),
      };
    }

    throw new HttpException('Invalid report type.', HttpStatus.BAD_REQUEST);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my generated reports' })
  @ApiOkResponse({ description: 'List of reports with download URLs' })
  async listMy(@CurrentUser() user: { userId: string }) {
    return this.reportsService.listMyReports(user.userId);
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Download report PDF by filename' })
  async getFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const safeName = (filename || '').replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!safeName || !safeName.endsWith('.pdf')) {
      throw new NotFoundException('File not found');
    }
    const buffer = this.reportsService.readFile(safeName);
    if (!buffer) {
      throw new NotFoundException('File not found');
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
