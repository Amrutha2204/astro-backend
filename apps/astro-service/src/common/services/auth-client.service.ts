import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UserDetailsMe {
  dob?: string;
  birthPlace?: string;
  birthTime?: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthClientService {
  constructor(private readonly configService: ConfigService) {}

  private get baseUrl(): string {
    return this.configService.get<string>('AUTH_SERVICE_URL') ?? 'http://localhost:8001';
  }

  private get internalApiKey(): string {
    return this.configService.get<string>('AUTH_INTERNAL_API_KEY') ?? '';
  }

  async getMe(token: string): Promise<UserDetailsMe> {
    const res = await fetch(`${this.baseUrl}/api/v1/user-details/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new HttpException('Invalid or expired token. Please login again.', HttpStatus.UNAUTHORIZED);
      }
      if (res.status === 404) {
        throw new HttpException('Birth details not found. Complete your profile first.', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to fetch user details.', res.status);
    }
    return res.json();
  }

  async getByUserIdInternal(userId: string): Promise<{ dob: string; birthPlace: string; birthTime: string }> {
    const key = this.internalApiKey;
    if (!key) {
      throw new HttpException('Internal API key not configured.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const res = await fetch(`${this.baseUrl}/api/v1/user-details/internal/${userId}`, {
      method: 'GET',
      headers: {
        'x-internal-api-key': key,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new HttpException('User details not found.', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to fetch user details.', res.status);
    }
    return res.json();
  }
}
