import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NatalChartService } from '../natal-chart/natal-chart.service';
import { TransitsService } from '../transits/transits.service';
import { KundliDto } from '../kundli/dto/kundli.dto';
import { ChartType } from '../common/utils/coordinates.util';

@Injectable()
export class HoroscopeRuleService {
  private readonly logger = new Logger(HoroscopeRuleService.name);

  constructor(
    private readonly natalChartService: NatalChartService,
    private readonly transitsService: TransitsService,
    private readonly configService: ConfigService,
  ) {}

  async getTodayHoroscope(dto: KundliDto) {
    try {
      const [natalChart, transits] = await Promise.all([
        this.natalChartService.getNatalChart(dto),
        this.transitsService.getTodayTransits(),
      ]);

      const dayType = this.calculateDayType(natalChart, transits);
      const mainTheme = this.getMainTheme(dayType, natalChart, transits);
      const reason = this.getReason(natalChart, transits);

      return {
        dayType,
        mainTheme,
        reason,
        date: new Date().toISOString().split('T')[0],
        source: 'Rule-Based Logic',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error generating horoscope: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to generate horoscope. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculateDayType(
    natalChart: any,
    transits: any,
  ): 'Good' | 'Neutral' | 'Challenging' {
    const moonSign = natalChart.moonSign?.toLowerCase() || '';
    const sunSign = natalChart.sunSign?.toLowerCase() || '';
    const ascendant = natalChart.ascendant?.toLowerCase() || '';

    const majorTransits = transits.majorActiveTransits || [];
    const beneficialPlanets = ['jupiter', 'venus', 'mercury'];
    const challengingPlanets = ['saturn', 'mars', 'rahu', 'ketu'];

    let score = 0;

    majorTransits.forEach((transit: any) => {
      const planet = transit.planet?.toLowerCase() || '';
      if (beneficialPlanets.includes(planet)) {
        score += 1;
      } else if (challengingPlanets.includes(planet)) {
        score -= 1;
      }
    });

    if (score > 0) {
      return 'Good';
    } else if (score < 0) {
      return 'Challenging';
    }
    return 'Neutral';
  }

  private getMainTheme(
    dayType: string,
    natalChart: any,
    transits: any,
  ): string {
    if (dayType === 'Good') {
      return 'Focus on opportunities and growth';
    } else if (dayType === 'Challenging') {
      return 'Exercise caution and patience';
    }
    return 'Reflection and balance';
  }

  private getReason(natalChart: any, transits: any): string {
    const majorTransits = transits.majorActiveTransits || [];
    const transitPlanets = majorTransits
      .map((t: any) => t.planet)
      .join(', ');

    const ascendantText = natalChart.ascendant
      ? `${natalChart.ascendant} Ascendant`
      : 'your birth chart';

    return `Today's planetary positions (${transitPlanets || 'current transits'}) influence your ${natalChart.moonSign} Moon sign and ${ascendantText}`;
  }
}

