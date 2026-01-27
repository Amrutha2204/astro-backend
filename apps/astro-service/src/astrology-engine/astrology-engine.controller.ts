import {
  Controller,
  Post,
  Body,
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
import { AstrologyEngineService } from './astrology-engine.service';
import { BirthChartDto } from './dto/birth-chart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/astrology-engine')
@ApiTags('Astrology Engine')
export class AstrologyEngineController {
  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
  ) {}

  @Post('vedic-chart')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
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
  async calculateVedicChart(@Body() dto: BirthChartDto) {
    try {
      return await this.astrologyEngineService.calculateVedicChart(
        this.astrologyEngineService.mapDtoToBirthDetails(dto),
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
  @UseGuards(JwtAuthGuard)
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
  async calculateWesternChart(@Body() dto: BirthChartDto) {
    try {
      return await this.astrologyEngineService.calculateWesternChart(
        this.astrologyEngineService.mapDtoToBirthDetails(dto),
      );
    } catch (error) {
      throw new HttpException(
        `Failed to calculate Western chart: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

