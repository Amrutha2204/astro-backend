import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, NotFoundException } from '@nestjs/common';
import { HoroscopeService } from './horoscope.service';
import { ZodiacSign } from '../common/utils/zodiac.util';

describe('HoroscopeService', () => {
  let service: HoroscopeService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AUTH_SERVICE_URL: 'http://localhost:8001',
        PROKERALA_CLIENT_ID: 'test-client-id',
        PROKERALA_CLIENT_SECRET: 'test-client-secret',
      };
      return config[key] || null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HoroscopeService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HoroscopeService>(HoroscopeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('getMyDayToday', () => {
    const mockToken = 'test-token';
    const mockUserDetails = {
      id: 'user-details-id',
      dob: '1990-01-15',
      birthPlace: 'New York',
      birthTime: '10:30:00',
    };

    const mockHoroscopeResponse = {
      sign: ZodiacSign.Capricorn,
      date: '2024-01-15',
      horoscope: {
        daily_prediction: {
          sign_name: 'Capricorn',
          prediction: 'Test prediction',
        },
      },
      source: 'Prokerala API',
    };

    it('should fetch user details and return personalized horoscope', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails,
      });

      jest.spyOn(service, 'getDailyHoroscope' as any).mockResolvedValue(
        mockHoroscopeResponse,
      );

      const result = await service.getMyDayToday(mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/user-details/me',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            Accept: 'application/json',
          },
        },
      );

      expect(result).toEqual(mockHoroscopeResponse);
    });

    it('should throw HttpException when token is invalid', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(service.getMyDayToday(mockToken)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw NotFoundException when birth details not found', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(service.getMyDayToday(mockToken)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when dob is missing', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-details-id',
          birthPlace: 'New York',
        }),
      });

      await expect(service.getMyDayToday(mockToken)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use date parameter when provided', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails,
      });

      jest.spyOn(service, 'getDailyHoroscope' as any).mockResolvedValue(
        mockHoroscopeResponse,
      );

      await service.getMyDayToday(mockToken, '2024-01-20');

      expect(service.getDailyHoroscope).toHaveBeenCalledWith(
        expect.objectContaining({
          sign: ZodiacSign.Capricorn,
          date: '2024-01-20',
        }),
      );
    });
  });

  describe('getDailyHoroscope', () => {
    const mockAccessToken = 'prokerala-access-token';
    const mockProkeralaResponse = {
      data: {
        daily_prediction: {
          sign_name: 'Aries',
          prediction: 'Test prediction',
        },
      },
    };

    beforeEach(() => {
      jest.spyOn(service as any, 'getAccessToken').mockResolvedValue(
        mockAccessToken,
      );
    });

    it('should fetch horoscope from Prokerala API', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockProkeralaResponse,
      });

      const result = await service.getDailyHoroscope({
        sign: ZodiacSign.Aries,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sign=aries'),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
            Accept: 'application/json',
          },
        },
      );

      expect(result.sign).toBe(ZodiacSign.Aries);
      expect(result.horoscope).toBeDefined();
    });

    it('should handle rate limit error', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' }),
      });

      await expect(
        service.getDailyHoroscope({ sign: ZodiacSign.Aries }),
      ).rejects.toThrow(HttpException);
    });

    it('should handle authentication error', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(
        service.getDailyHoroscope({ sign: ZodiacSign.Aries }),
      ).rejects.toThrow(HttpException);
    });
  });
});

