import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NatalChartService } from './natal-chart.service';
import { ChartType } from '../common/utils/coordinates.util';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/astrology')
@ApiTags('Astrology')
export class NatalChartController {
  constructor(private readonly natalChartService: NatalChartService) {}

  @Get('natal-chart')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get natal chart (birth chart) with Sun, Moon, Ascendant, and planet positions',
  })
  @ApiQuery({
    name: 'chartType',
    required: false,
    enum: ChartType,
    description: 'Chart type',
    example: ChartType.NorthIndian,
  })
  @ApiOkResponse({
    description: 'Natal chart retrieved successfully',
    schema: {
      example: {
        sunSign: 'Dhanu',
        moonSign: 'Kumbha',
        ascendant: null,
        planetSignList: [
          { planet: 'Sun', sign: 'Dhanu' },
          { planet: 'Moon', sign: 'Kumbha' },
        ],
        source: 'Prokerala API',
      },
    },
  })
  async getNatalChart(
    @CurrentUser() user: any,
    @Query('chartType') chartType?: ChartType,
  ) {
    const token = user.token;
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://localhost:8001';

    try {
      const userDetailsResponse = await fetch(
        `${authServiceUrl}/api/v1/user-details/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!userDetailsResponse.ok) {
        if (userDetailsResponse.status === 401) {
          throw new HttpException(
            'Invalid or expired token. Please login again.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        if (userDetailsResponse.status === 404) {
          throw new HttpException(
            'Birth details not found. Please complete your profile first.',
            HttpStatus.NOT_FOUND,
          );
        }
        throw new HttpException(
          'Failed to fetch user details.',
          userDetailsResponse.status,
        );
      }

      const userDetails = await userDetailsResponse.json();

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete. Please provide date of birth and birth place.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const dobString = dob.toISOString().split('T')[0];
      const birthTime = userDetails.birthTime || '12:00:00';
      const coordinates = getCoordinatesFromCity(userDetails.birthPlace);

      const kundliDto = {
        dob: dobString,
        birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        chartType: chartType || ChartType.NorthIndian,
      };

      return this.natalChartService.getNatalChart(kundliDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch natal chart. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

