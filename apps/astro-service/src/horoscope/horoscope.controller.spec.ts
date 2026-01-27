import { Test, TestingModule } from '@nestjs/testing';
import { HoroscopeController } from './horoscope.controller';
import { HoroscopeService } from './horoscope.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

describe('HoroscopeController', () => {
  let controller: HoroscopeController;
  let service: HoroscopeService;

  const mockHoroscopeService = {
    getWeeklyHoroscope: jest.fn(),
    getMonthlyHoroscope: jest.fn(),
  };

  const mockUser = { token: 'test-token' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HoroscopeController],
      providers: [
        {
          provide: HoroscopeService,
          useValue: mockHoroscopeService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<HoroscopeController>(HoroscopeController);
    service = module.get<HoroscopeService>(HoroscopeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeeklyHoroscope', () => {
    const mockWeeklyResponse = {
      weekStart: '2025-01-27',
      predictions: [
        {
          date: '2025-01-27',
          day: 'Monday',
          horoscope: {
            dayType: 'neutral',
            mainTheme: 'Test theme',
            reason: 'Test reason',
          },
        },
      ],
      source: 'Swiss Ephemeris',
    };

    it('should return personalized weekly horoscope', async () => {
      mockHoroscopeService.getWeeklyHoroscope.mockResolvedValue(
        mockWeeklyResponse,
      );

      const result = await controller.getWeeklyHoroscope(mockUser);

      expect(service.getWeeklyHoroscope).toHaveBeenCalledWith('test-token');
      expect(result).toEqual(mockWeeklyResponse);
    });

    it('should pass user.token to the service', async () => {
      mockHoroscopeService.getWeeklyHoroscope.mockResolvedValue(
        mockWeeklyResponse,
      );

      await controller.getWeeklyHoroscope({ token: 'custom-token' });

      expect(service.getWeeklyHoroscope).toHaveBeenCalledWith('custom-token');
    });
  });

  describe('getMonthlyHoroscope', () => {
    const mockMonthlyResponse = {
      monthStart: '2025-01-27',
      predictions: [
        {
          date: '2025-01-27',
          horoscope: {
            dayType: 'neutral',
            mainTheme: 'Test theme',
            reason: 'Test reason',
          },
        },
      ],
      source: 'Swiss Ephemeris',
    };

    it('should return personalized monthly horoscope', async () => {
      mockHoroscopeService.getMonthlyHoroscope.mockResolvedValue(
        mockMonthlyResponse,
      );

      const result = await controller.getMonthlyHoroscope(mockUser);

      expect(service.getMonthlyHoroscope).toHaveBeenCalledWith('test-token');
      expect(result).toEqual(mockMonthlyResponse);
    });

    it('should pass user.token to the service', async () => {
      mockHoroscopeService.getMonthlyHoroscope.mockResolvedValue(
        mockMonthlyResponse,
      );

      await controller.getMonthlyHoroscope({ token: 'custom-token' });

      expect(service.getMonthlyHoroscope).toHaveBeenCalledWith('custom-token');
    });
  });
});
