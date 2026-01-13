import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HoroscopeController } from './horoscope.controller';
import { HoroscopeService } from './horoscope.service';

describe('HoroscopeController', () => {
  let controller: HoroscopeController;
  let service: HoroscopeService;

  const mockHoroscopeService = {
    getMyDayToday: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HoroscopeController],
      providers: [
        {
          provide: HoroscopeService,
          useValue: mockHoroscopeService,
        },
      ],
    }).compile();

    controller = module.get<HoroscopeController>(HoroscopeController);
    service = module.get<HoroscopeService>(HoroscopeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyDayToday', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer test-token',
      },
    };

    const mockResponse = {
      sign: 'capricorn',
      date: '2024-01-15',
      horoscope: {
        daily_prediction: {
          sign_name: 'Capricorn',
          prediction: 'Test prediction',
        },
      },
      source: 'Prokerala API',
    };

    it('should return personalized horoscope', async () => {
      mockHoroscopeService.getMyDayToday.mockResolvedValue(mockResponse);

      const result = await controller.getMyDayToday(mockRequest);

      expect(service.getMyDayToday).toHaveBeenCalledWith('test-token', undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should pass date parameter when provided', async () => {
      mockHoroscopeService.getMyDayToday.mockResolvedValue(mockResponse);

      await controller.getMyDayToday(mockRequest, '2024-01-20');

      expect(service.getMyDayToday).toHaveBeenCalledWith(
        'test-token',
        '2024-01-20',
      );
    });

    it('should throw HttpException when authorization header is missing', async () => {
      const requestWithoutAuth = {
        headers: {},
      };

      await expect(
        controller.getMyDayToday(requestWithoutAuth),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when authorization header does not start with Bearer', async () => {
      const requestWithInvalidAuth = {
        headers: {
          authorization: 'Invalid token',
        },
      };

      await expect(
        controller.getMyDayToday(requestWithInvalidAuth),
      ).rejects.toThrow(HttpException);
    });

    it('should extract token correctly from Bearer header', async () => {
      mockHoroscopeService.getMyDayToday.mockResolvedValue(mockResponse);

      await controller.getMyDayToday(mockRequest);

      expect(service.getMyDayToday).toHaveBeenCalledWith('test-token', undefined);
    });
  });
});

