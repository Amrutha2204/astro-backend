import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { HoroscopeService } from './horoscope.service';
import { HoroscopeRuleService } from '../horoscope-rule/horoscope-rule.service';
import * as coordinatesUtil from '../common/utils/coordinates.util';

jest.mock('../common/utils/coordinates.util', () => ({
  getCoordinatesFromCity: jest.fn().mockResolvedValue({ lat: 28.6139, lng: 77.209 }),
}));

const AUTH_BASE_URL = 'http://localhost:8001';
const USER_DETAILS_URL = `${AUTH_BASE_URL}/api/v1/user-details/me`;

describe('HoroscopeService', () => {
  let service: HoroscopeService;
  let horoscopeRuleService: HoroscopeRuleService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AUTH_SERVICE_URL: AUTH_BASE_URL,
      };
      return config[key] ?? null;
    }),
  };

  const mockHoroscopeRuleService = {
    getTodayHoroscope: jest.fn().mockResolvedValue({
      dayType: 'Good',
      mainTheme: 'Focus on opportunities',
      reason: 'Test reason',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HoroscopeService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HoroscopeRuleService, useValue: mockHoroscopeRuleService },
      ],
    }).compile();

    service = module.get<HoroscopeService>(HoroscopeService);
    horoscopeRuleService = module.get<HoroscopeRuleService>(HoroscopeRuleService);
    jest.clearAllMocks();
    (coordinatesUtil.getCoordinatesFromCity as jest.Mock).mockResolvedValue({ lat: 28.6139, lng: 77.209 });
    mockHoroscopeRuleService.getTodayHoroscope.mockResolvedValue({
      dayType: 'Good',
      mainTheme: 'Focus on opportunities',
      reason: 'Test reason',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('getWeeklyHoroscope', () => {
    const mockToken = 'test-token';
    const mockUserDetails = {
      id: 'user-details-id',
      dob: '1990-01-15',
      birthPlace: 'Delhi',
      birthTime: '10:30:00',
    };

    it('should fetch user details and return weekly horoscope', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails,
      });

      const result = await service.getWeeklyHoroscope(mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        USER_DETAILS_URL,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            Accept: 'application/json',
          },
        },
      );
      expect(result.source).toBe('Swiss Ephemeris');
      expect(result.predictions).toHaveLength(7);
      expect(result.weekStart).toBeDefined();
    });

    it('should throw HttpException when user details request fails', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(service.getWeeklyHoroscope(mockToken)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when dob is missing', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'id', birthPlace: 'Delhi' }),
      });

      await expect(service.getWeeklyHoroscope(mockToken)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when birthPlace is missing', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'id', dob: '1990-01-15' }),
      });

      await expect(service.getWeeklyHoroscope(mockToken)).rejects.toThrow(HttpException);
    });
  });

  describe('getMonthlyHoroscope', () => {
    const mockToken = 'test-token';
    const mockUserDetails = {
      id: 'user-details-id',
      dob: '1990-01-15',
      birthPlace: 'Delhi',
      birthTime: '10:30:00',
    };

    it('should fetch user details and return monthly horoscope', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserDetails,
      });

      const result = await service.getMonthlyHoroscope(mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        USER_DETAILS_URL,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            Accept: 'application/json',
          },
        },
      );
      expect(result.source).toBe('Swiss Ephemeris');
      expect(result.predictions).toHaveLength(30);
      expect(result.monthStart).toBeDefined();
    });

    it('should throw HttpException when user details request fails', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(service.getMonthlyHoroscope(mockToken)).rejects.toThrow(HttpException);
    });
  });
});

