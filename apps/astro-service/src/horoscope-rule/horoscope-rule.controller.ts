import {
  Controller,
  Get,
  Post,
  Query,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { HoroscopeRuleService } from './horoscope-rule.service';
import { ChartType, getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GuestKundliRequestDto } from '../kundli/dto/guest-kundli.dto';

@Controller('api/v1/astrology')
@ApiTags('Astrology')
export class HoroscopeRuleController {
  constructor(private readonly horoscopeRuleService: HoroscopeRuleService) {}

  @Post('horoscope/today/guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get daily horoscope from birth details – no login' })
  @ApiBody({ type: GuestKundliRequestDto })
  @ApiOkResponse({ description: 'Horoscope generated successfully' })
  async getTodayHoroscopeGuest(@Body() dto: GuestKundliRequestDto) {
    try {
      const birthTime = dto.birthTime.split(':').length === 2 ? `${dto.birthTime}:00` : dto.birthTime;
      const { lat, lng } = await getCoordinatesFromCity(dto.placeOfBirth.trim());
      const kundliDto = { dob: dto.dob, birthTime, latitude: lat, longitude: lng };
      return this.horoscopeRuleService.getTodayHoroscope(kundliDto);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException('Failed to fetch horoscope.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('horoscope/today')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get rule-based daily horoscope combining natal chart and transits',
  })
  @ApiQuery({
    name: 'chartType',
    required: false,
    enum: ChartType,
    description: 'Chart type',
    example: ChartType.NorthIndian,
  })
  @ApiOkResponse({
    description: 'Horoscope generated successfully',
    schema: {
      example: {
        dayType: 'Good',
        mainTheme: 'Focus on opportunities and growth',
        reason: "Today's planetary positions influence your Moon sign",
        date: '2024-01-15',
        source: 'Rule-Based Logic',
      },
    },
  })
  async getTodayHoroscope(
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
      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);

      const kundliDto = {
        dob: dobString,
        birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        chartType: chartType || ChartType.NorthIndian,
      };

      return this.horoscopeRuleService.getTodayHoroscope(kundliDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch horoscope. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

