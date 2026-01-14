import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KundliDto } from './dto/kundli.dto';

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class KundliService {
  private readonly logger = new Logger(KundliService.name);
  private readonly apiBaseUrl = 'https://api.prokerala.com/v2';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly configService: ConfigService) {
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

  async getKundli(dto: KundliDto) {
    try {
      const accessToken = await this.getAccessToken();

      const dobDate = new Date(`${dto.dob}T${dto.birthTime}`);
      const datetime = dobDate.toISOString();
      const chartType = dto.chartType || 'north-indian';
      const coordinates = `${dto.latitude},${dto.longitude}`;
      const ayanamsa = 1;

      const url = new URL(`${this.apiBaseUrl}/astrology/kundli`);
      url.searchParams.append('datetime', datetime);
      url.searchParams.append('coordinates', coordinates);
      url.searchParams.append('ayanamsa', ayanamsa.toString());
      url.searchParams.append('chart_type', chartType);

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
          `Failed to fetch kundli: ${errorData.message || response.statusText}`,
          response.status,
        );
      }

      const data = await response.json();

      return {
        ...data.data || data,
        source: 'Prokerala API',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error fetching kundli: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to fetch kundli. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

