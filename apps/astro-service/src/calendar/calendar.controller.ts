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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/astrology')
@ApiTags('Astrology')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('calendar/today/guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get today’s astrology calendar (moon, tithi, nakshatra) by city – no login',
  })
  @ApiQuery({
    name: 'placeOfBirth',
    required: false,
    description: 'City name for location; defaults to Delhi if omitted',
  })
  @ApiOkResponse({ description: 'Calendar retrieved successfully' })
  async getTodayCalendarGuest(
    @Query('placeOfBirth') placeOfBirth?: string,
  ) {
    const city = (placeOfBirth || 'Delhi').trim();
    const { lat, lng } = await getCoordinatesFromCity(city);
    return this.calendarService.getTodayCalendar(lat, lng);
  }

  @Get('calendar/festivals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List festivals for a date (YYYY-MM-DD) or month (YYYY-MM)',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date (YYYY-MM-DD) or month (YYYY-MM)',
    example: '2024-11-01',
  })
  @ApiOkResponse({ description: 'Festivals list' })
  async getFestivals(@Query('date') date: string) {
    const d = (date || '').trim();
    if (!d) {
      throw new HttpException(
        'Query "date" is required (e.g. YYYY-MM-DD or YYYY-MM).',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.calendarService.getFestivals(d);
  }

  @Get('calendar/muhurat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get muhurat (good times) for a given day at a location',
  })
  @ApiQuery({ name: 'date', required: true, description: 'Date YYYY-MM-DD', example: '2024-02-15' })
  @ApiQuery({ name: 'placeOfBirth', required: false, description: 'City for location; defaults to Delhi' })
  @ApiOkResponse({ description: 'Muhurat and sun times (UTC)' })
  async getMuhurat(
    @Query('date') date: string,
    @Query('placeOfBirth') placeOfBirth?: string,
  ) {
    const city = (placeOfBirth || 'Delhi').trim();
    const { lat, lng } = await getCoordinatesFromCity(city);
    return this.calendarService.getMuhurat(date, lat, lng);
  }

  @Get('calendar/auspicious-day')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if a date is auspicious for important work',
  })
  @ApiQuery({ name: 'date', required: true, description: 'Date YYYY-MM-DD', example: '2024-02-15' })
  @ApiQuery({ name: 'placeOfBirth', required: false, description: 'City for location; defaults to Delhi' })
  @ApiOkResponse({ description: 'Auspicious day check result' })
  async getAuspiciousDay(
    @Query('date') date: string,
    @Query('placeOfBirth') placeOfBirth?: string,
  ) {
    const city = (placeOfBirth || 'Delhi').trim();
    const { lat, lng } = await getCoordinatesFromCity(city);
    return this.calendarService.getAuspiciousDayCheck(date, lat, lng);
  }

  @Get('calendar/date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get astrology calendar for a specific date (moon, tithi, nakshatra, auspicious)',
  })
  @ApiQuery({ name: 'date', required: true, description: 'Date YYYY-MM-DD' })
  @ApiQuery({ name: 'placeOfBirth', required: false, description: 'City for location' })
  @ApiOkResponse({ description: 'Calendar for the given date' })
  async getCalendarForDate(
    @Query('date') date: string,
    @Query('placeOfBirth') placeOfBirth?: string,
  ) {
    const city = (placeOfBirth || 'Delhi').trim();
    const { lat, lng } = await getCoordinatesFromCity(city);
    return this.calendarService.getCalendarForDate(date, lat, lng);
  }

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
        source: 'Swiss Ephemeris',
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

      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);

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

