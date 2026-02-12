import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HoroscopeRuleService } from '../horoscope-rule/horoscope-rule.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';

@Injectable()
export class HoroscopeService {
  private readonly logger = new Logger(HoroscopeService.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly horoscopeRuleService: HoroscopeRuleService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:8001';
  }


  async getWeeklyHoroscope(token: string) {
    try {
      const userDetailsResponse = await fetch(
        `${this.authServiceUrl}/api/v1/user-details/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!userDetailsResponse.ok) {
        throw new HttpException(
          'Failed to fetch user details.',
          userDetailsResponse.status,
        );
      }

      const userDetails = await userDetailsResponse.json();

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const dobString = dob.toISOString().split('T')[0];
      const birthTime = userDetails.birthTime || '12:00:00';
      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);

      const weeklyPredictions = [];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        const horoscope = await this.horoscopeRuleService.getHoroscopeForDate(
          {
            dob: dobString,
            birthTime,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          },
          dateString,
        );

        weeklyPredictions.push({
          date: dateString,
          day: date.toLocaleDateString('en-US', { weekday: 'long' }),
          horoscope: {
            dayType: horoscope.dayType,
            mainTheme: horoscope.mainTheme,
            reason: horoscope.reason,
          },
        });
      }

      return {
        weekStart: today.toISOString().split('T')[0],
        predictions: weeklyPredictions,
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch weekly horoscope.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMonthlyHoroscope(token: string) {
    try {
      const userDetailsResponse = await fetch(
        `${this.authServiceUrl}/api/v1/user-details/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!userDetailsResponse.ok) {
        throw new HttpException(
          'Failed to fetch user details.',
          userDetailsResponse.status,
        );
      }

      const userDetails = await userDetailsResponse.json();

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const dobString = dob.toISOString().split('T')[0];
      const birthTime = userDetails.birthTime || '12:00:00';
      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);

      const monthlyPredictions = [];
      const today = new Date();

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        const horoscope = await this.horoscopeRuleService.getTodayHoroscope({
          dob: dobString,
          birthTime,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        });

        monthlyPredictions.push({
          date: dateString,
          horoscope: {
            dayType: horoscope.dayType,
            mainTheme: horoscope.mainTheme,
            reason: horoscope.reason,
          },
        });
      }

      return {
        monthStart: today.toISOString().split('T')[0],
        predictions: monthlyPredictions,
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch monthly horoscope.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
