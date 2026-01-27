import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CompatibilityService } from './compatibility.service';
import { CompatibilityDto } from './dto/compatibility.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/compatibility')
@ApiTags('Compatibility')
export class CompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @Post('guna-milan/guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate Guna Milan (no login). Send partner1 and partner2 with year, month, day, hour?, minute?, latitude, longitude.',
  })
  @ApiBody({ type: CompatibilityDto })
  @ApiOkResponse({ description: 'Guna Milan calculated successfully' })
  async calculateGunaMilanGuest(@Body() dto: CompatibilityDto) {
    try {
      if (!dto?.partner1 || !dto?.partner2) {
        throw new HttpException('Both partner1 and partner2 are required.', HttpStatus.BAD_REQUEST);
      }
      const chart1 = { year: dto.partner1.year, month: dto.partner1.month, day: dto.partner1.day, hour: dto.partner1.hour ?? 12, minute: dto.partner1.minute ?? 0, latitude: dto.partner1.latitude, longitude: dto.partner1.longitude };
      const chart2 = { year: dto.partner2.year, month: dto.partner2.month, day: dto.partner2.day, hour: dto.partner2.hour ?? 12, minute: dto.partner2.minute ?? 0, latitude: dto.partner2.latitude, longitude: dto.partner2.longitude };
      if (!chart1.year || !chart1.month || !chart1.day || chart1.latitude == null || chart1.longitude == null) {
        throw new HttpException('Partner1: year, month, day, latitude, longitude required.', HttpStatus.BAD_REQUEST);
      }
      if (!chart2.year || !chart2.month || !chart2.day || chart2.latitude == null || chart2.longitude == null) {
        throw new HttpException('Partner2: year, month, day, latitude, longitude required.', HttpStatus.BAD_REQUEST);
      }
      const result = await this.compatibilityService.calculateGunaMilan(chart1, chart2);
      return { ...result, source: 'Swiss Ephemeris' };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException(`Failed to calculate Guna Milan: ${(e as Error)?.message || 'Unknown error'}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('guna-milan')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate Guna Milan (Ashtakoota) matching score' })
  @ApiBody({ type: CompatibilityDto })
  @ApiOkResponse({ description: 'Guna Milan calculated successfully' })
  async calculateGunaMilan(@Body() dto: CompatibilityDto) {
    try {
      if (!dto || !dto.partner1 || !dto.partner2) {
        throw new HttpException(
          'Both partner1 and partner2 are required.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const chart1 = {
        year: dto.partner1.year,
        month: dto.partner1.month,
        day: dto.partner1.day,
        hour: dto.partner1.hour || 12,
        minute: dto.partner1.minute || 0,
        latitude: dto.partner1.latitude,
        longitude: dto.partner1.longitude,
      };
      const chart2 = {
        year: dto.partner2.year,
        month: dto.partner2.month,
        day: dto.partner2.day,
        hour: dto.partner2.hour || 12,
        minute: dto.partner2.minute || 0,
        latitude: dto.partner2.latitude,
        longitude: dto.partner2.longitude,
      };
      if (!chart1.year || !chart1.month || !chart1.day || !chart1.latitude || !chart1.longitude) {
        throw new HttpException(
          'Partner1 birth details incomplete. Year, month, day, latitude, and longitude are required.',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!chart2.year || !chart2.month || !chart2.day || !chart2.latitude || !chart2.longitude) {
        throw new HttpException(
          'Partner2 birth details incomplete. Year, month, day, latitude, and longitude are required.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const result = await this.compatibilityService.calculateGunaMilan(chart1, chart2);
      return { ...result, source: 'Swiss Ephemeris' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      throw new HttpException(`Failed to calculate Guna Milan: ${err?.message || 'Unknown error'}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('marriage/guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate marriage compatibility (no login). Same body as guna-milan/guest.',
  })
  @ApiBody({ type: CompatibilityDto })
  @ApiOkResponse({ description: 'Marriage compatibility calculated successfully' })
  async calculateMarriageCompatibilityGuest(@Body() dto: CompatibilityDto) {
    try {
      if (!dto?.partner1 || !dto?.partner2) {
        throw new HttpException('Both partner1 and partner2 are required.', HttpStatus.BAD_REQUEST);
      }
      const chart1 = { year: dto.partner1.year, month: dto.partner1.month, day: dto.partner1.day, hour: dto.partner1.hour ?? 12, minute: dto.partner1.minute ?? 0, latitude: dto.partner1.latitude, longitude: dto.partner1.longitude };
      const chart2 = { year: dto.partner2.year, month: dto.partner2.month, day: dto.partner2.day, hour: dto.partner2.hour ?? 12, minute: dto.partner2.minute ?? 0, latitude: dto.partner2.latitude, longitude: dto.partner2.longitude };
      if (!chart1.year || !chart1.month || !chart1.day || chart1.latitude == null || chart1.longitude == null) {
        throw new HttpException('Partner1: year, month, day, latitude, longitude required.', HttpStatus.BAD_REQUEST);
      }
      if (!chart2.year || !chart2.month || !chart2.day || chart2.latitude == null || chart2.longitude == null) {
        throw new HttpException('Partner2: year, month, day, latitude, longitude required.', HttpStatus.BAD_REQUEST);
      }
      const result = await this.compatibilityService.calculateMarriageCompatibility(chart1, chart2);
      return { ...result, source: 'Swiss Ephemeris' };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException(`Failed to calculate marriage compatibility: ${(e as Error)?.message || 'Unknown'}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('marriage')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Calculate full marriage compatibility (Guna Milan + Doshas)',
  })
  @ApiBody({ type: CompatibilityDto })
  @ApiOkResponse({
    description: 'Marriage compatibility calculated successfully',
  })
  async calculateMarriageCompatibility(@Body() dto: CompatibilityDto) {

    try {
      const chart1 = {
        year: dto.partner1.year,
        month: dto.partner1.month,
        day: dto.partner1.day,
        hour: dto.partner1.hour || 12,
        minute: dto.partner1.minute || 0,
        latitude: dto.partner1.latitude,
        longitude: dto.partner1.longitude,
      };

      const chart2 = {
        year: dto.partner2.year,
        month: dto.partner2.month,
        day: dto.partner2.day,
        hour: dto.partner2.hour || 12,
        minute: dto.partner2.minute || 0,
        latitude: dto.partner2.latitude,
        longitude: dto.partner2.longitude,
      };

      const result = await this.compatibilityService.calculateMarriageCompatibility(
        chart1,
        chart2,
      );

      return {
        ...result,
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to calculate marriage compatibility.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}

