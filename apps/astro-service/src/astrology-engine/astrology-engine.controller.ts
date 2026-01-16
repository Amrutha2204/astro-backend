import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AstrologyEngineService } from './astrology-engine.service';
import { BirthChartDto } from './dto/birth-chart.dto';

@Controller('api/v1/astrology-engine')
@ApiTags('Astrology Engine')
export class AstrologyEngineController {
  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
  ) {}

  @Post('vedic-chart')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Calculate Vedic birth chart using Swiss Ephemeris',
    description:
      'Generates a complete Vedic (sidereal) birth chart with Lagna, planetary positions, houses, and Nakshatras',
  })
  @ApiBody({ type: BirthChartDto })
  @ApiOkResponse({
    description: 'Vedic birth chart calculated successfully',
    schema: {
      example: {
        lagna: {
          sign: 'Leo',
          degree: 15.5,
          longitude: 135.5,
        },
        sunSign: {
          sign: 'Gemini',
          degree: 20.3,
          longitude: 80.3,
        },
        moonSign: {
          sign: 'Scorpio',
          degree: 10.2,
          longitude: 220.2,
        },
        planets: [
          {
            planet: 'Sun',
            sign: 'Gemini',
            degree: 20.3,
            longitude: 80.3,
            nakshatra: 'Ardra',
            pada: 2,
          },
        ],
        houses: [
          {
            house: 1,
            sign: 'Leo',
            degree: 15.5,
          },
        ],
      },
    },
  })
  async calculateVedicChart(
    @Request() req: any,
    @Body() dto: BirthChartDto,
  ) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required. Please provide a valid JWT token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const birthDetails = {
        year: dto.year,
        month: dto.month,
        day: dto.day,
        hour: dto.hour || 12,
        minute: dto.minute || 0,
        latitude: dto.latitude,
        longitude: dto.longitude,
      };

      return await this.astrologyEngineService.calculateVedicChart(
        birthDetails,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to calculate Vedic chart: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('western-chart')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Calculate Western birth chart using Swiss Ephemeris',
    description:
      'Generates a complete Western (tropical) birth chart with Ascendant, planetary positions, and houses',
  })
  @ApiBody({ type: BirthChartDto })
  @ApiOkResponse({
    description: 'Western birth chart calculated successfully',
  })
  async calculateWesternChart(
    @Request() req: any,
    @Body() dto: BirthChartDto,
  ) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required. Please provide a valid JWT token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const birthDetails = {
        year: dto.year,
        month: dto.month,
        day: dto.day,
        hour: dto.hour || 12,
        minute: dto.minute || 0,
        latitude: dto.latitude,
        longitude: dto.longitude,
      };

      return await this.astrologyEngineService.calculateWesternChart(
        birthDetails,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to calculate Western chart: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

