import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/astrology')
@ApiTags('Astrology')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('calendar/today')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get astrology calendar for today - Moon phase and major planetary events',
  })
  @ApiOkResponse({
    description: 'Calendar retrieved successfully',
    schema: {
      example: {
        moonPhase: 'Waxing Crescent',
        tithi: 'Ekadashi',
        nakshatra: 'Magha',
        majorPlanetaryEvents: ['Auspicious periods available'],
        date: '2024-01-15',
        source: 'Prokerala API',
      },
    },
  })
  async getTodayCalendar(@CurrentUser() user: any) {
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

      if (!userDetails.birthPlace) {
        throw new HttpException(
          'Birth place not found. Please complete your profile first.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const coordinates = getCoordinatesFromCity(userDetails.birthPlace);

      return this.calendarService.getTodayCalendar(
        coordinates.lat,
        coordinates.lng,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch calendar. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

