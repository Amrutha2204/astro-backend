import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DailyHoroscopeDto } from './dto/daily-horoscope.dto';
import { getZodiacSignFromDateOfBirth } from '../common/utils/zodiac.util';

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class HoroscopeService {
  private readonly logger = new Logger(HoroscopeService.name);
  private readonly apiBaseUrl = 'https://api.prokerala.com/v2';
  private readonly authServiceUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:8001';
    this.clientId = this.configService.get<string>('PROKERALA_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('PROKERALA_CLIENT_SECRET') || '';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn(
        'PROKERALA_CLIENT_ID or PROKERALA_CLIENT_SECRET not configured. API calls will fail.',
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const tokenUrl = 'https://api.prokerala.com/token';
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');

      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.errors?.[0]?.detail ||
          errorData.message ||
          'Failed to authenticate with Prokerala API';
        this.logger.error(
          `Failed to get access token: ${response.status} - ${JSON.stringify(errorData)}`,
        );
        throw new HttpException(
          `Prokerala API Authentication Error: ${errorMessage}. Please verify your PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET are correct and your account is activated.`,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const tokenData: AccessTokenResponse = await response.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error getting access token: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to authenticate with Prokerala API.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDailyHoroscope(dto: DailyHoroscopeDto) {
    try {
      const accessToken = await this.getAccessToken();
      const sign = dto.sign.toLowerCase();

      let datetime: string;
      if (dto.date) {
        const dateObj = new Date(dto.date);
        datetime = dateObj.toISOString();
      } else {
        datetime = new Date().toISOString();
      }

      const url = new URL(`${this.apiBaseUrl}/horoscope/daily`);
      url.searchParams.append('sign', sign);
      url.searchParams.append('datetime', datetime);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(
          `Prokerala API error: ${response.status} - ${JSON.stringify(errorData)}`,
        );

        if (response.status === 429) {
          throw new HttpException(
            'Rate limit exceeded. Please try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (response.status === 401) {
          throw new HttpException(
            'Invalid credentials. Please check your PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET configuration.',
            HttpStatus.UNAUTHORIZED,
          );
        }

        throw new HttpException(
          `Failed to fetch horoscope: ${errorData.message || response.statusText}`,
          response.status,
        );
      }

      const data = await response.json();

      const responseDate = dto.date || new Date().toISOString().split('T')[0];

      return {
        sign: dto.sign,
        date: responseDate,
        horoscope: data.data || data,
        source: 'Prokerala API',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error fetching daily horoscope: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to fetch daily horoscope. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMyDayToday(token: string, date?: string) {
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
        if (userDetailsResponse.status === 401) {
          throw new HttpException(
            'Invalid or expired token. Please login again.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        if (userDetailsResponse.status === 404) {
          throw new NotFoundException(
            'Birth details not found. Please complete your profile first.',
          );
        }
        throw new HttpException(
          'Failed to fetch user details.',
          userDetailsResponse.status,
        );
      }

      const userDetails = await userDetailsResponse.json();

      if (!userDetails.dob) {
        throw new NotFoundException(
          'Birth date not found. Please complete your profile first.',
        );
      }

      const dob = new Date(userDetails.dob);
      const zodiacSign = getZodiacSignFromDateOfBirth(dob);

      const horoscopeDto: DailyHoroscopeDto = {
        sign: zodiacSign,
        date,
      };

      return this.getDailyHoroscope(horoscopeDto);
    } catch (error) {
      if (
        error instanceof HttpException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Error fetching personalized horoscope: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to fetch personalized horoscope. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
