import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable()
export class ProkeralaService {
  private readonly logger = new Logger(ProkeralaService.name);
  private readonly apiBaseUrl = 'https://api.prokerala.com/v2';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  // Response cache: key -> { data, expiry }
  private responseCache = new Map<string, CacheEntry<any>>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes cache

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

  private getCacheKey(endpoint: string, params: Record<string, string>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  private getCached<T>(cacheKey: string): T | null {
    const entry = this.responseCache.get(cacheKey);
    if (entry && Date.now() < entry.expiry) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return entry.data as T;
    }
    if (entry) {
      this.responseCache.delete(cacheKey);
    }
    return null;
  }

  private setCache<T>(cacheKey: string, data: T): void {
    this.responseCache.set(cacheKey, {
      data,
      expiry: Date.now() + this.cacheTTL,
    });
  }

  async makeRequest<T>(
    endpoint: string,
    params: Record<string, string>,
    useCache: boolean = true,
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    if (useCache) {
      const cached = this.getCached<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const accessToken = await this.getAccessToken();
      const url = new URL(`${this.apiBaseUrl}${endpoint}`);
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          this.logger.warn(
            `Rate limit exceeded for ${endpoint}. Consider upgrading your Prokerala plan or reducing API calls.`,
          );
          throw new HttpException(
            'Rate limit exceeded. Please try again later. Consider upgrading your Prokerala API plan for higher limits.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (response.status === 401) {
          // Token might be expired, clear it
          this.accessToken = null;
          this.tokenExpiry = 0;
          throw new HttpException(
            'Invalid credentials. Please check your PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET configuration.',
            HttpStatus.UNAUTHORIZED,
          );
        }

        this.logger.error(
          `Prokerala API error: ${response.status} - ${JSON.stringify(errorData)}`,
        );
        throw new HttpException(
          `Failed to fetch data: ${errorData.message || response.statusText}`,
          response.status,
        );
      }

      const data = await response.json();
      const result = (data.data || data) as T;
      
      // Cache the result
      if (useCache) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error making Prokerala API request: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to fetch data from Prokerala API. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  clearCache(): void {
    this.responseCache.clear();
    this.logger.log('Prokerala response cache cleared');
  }
}

