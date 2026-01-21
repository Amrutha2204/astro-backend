import { Test, TestingModule } from '@nestjs/testing';
import { AstrologyEngineService } from './astrology-engine.service';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

describe('AstrologyEngineService', () => {
  let service: AstrologyEngineService;
  let swissEphemerisService: SwissEphemerisService;

  const mockSwissEphemerisService = {
    calculateBirthChart: jest.fn(),
    convertToSidereal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AstrologyEngineService,
        {
          provide: SwissEphemerisService,
          useValue: mockSwissEphemerisService,
        },
      ],
    }).compile();

    service = module.get<AstrologyEngineService>(AstrologyEngineService);
    swissEphemerisService = module.get<SwissEphemerisService>(
      SwissEphemerisService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateVedicChart', () => {
    const mockBirthDetails = {
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      minute: 30,
      latitude: 28.6139,
      longitude: 77.209,
    };

    const mockTropicalChart = {
      julianDay: 2448000.5,
      ascendant: {
        longitude: 100,
        sign: 'Leo',
        signDegree: 10,
      },
      mc: {
        longitude: 190,
        sign: 'Scorpio',
        signDegree: 10,
      },
      planets: [
        { planet: 'Sun', longitude: 45, sign: 'Taurus', signDegree: 15 },
        { planet: 'Moon', longitude: 120, sign: 'Leo', signDegree: 0 },
        { planet: 'Mercury', longitude: 50, sign: 'Taurus', signDegree: 20 },
      ],
      houses: [
        { house: 1, longitude: 100, sign: 'Leo', signDegree: 10 },
        { house: 2, longitude: 130, sign: 'Virgo', signDegree: 10 },
      ],
    };

    beforeEach(() => {
      mockSwissEphemerisService.calculateBirthChart.mockResolvedValue(
        mockTropicalChart,
      );
      mockSwissEphemerisService.convertToSidereal.mockImplementation(
        (longitude) => longitude - 23.85,
      );
    });

    it('should calculate Vedic chart successfully', async () => {
      const result = await service.calculateVedicChart(mockBirthDetails);

      expect(result).toBeDefined();
      expect(result.lagna).toBeDefined();
      expect(result.sunSign).toBeDefined();
      expect(result.moonSign).toBeDefined();
      expect(result.planets).toBeDefined();
      expect(Array.isArray(result.planets)).toBe(true);
      expect(result.houses).toBeDefined();
      expect(Array.isArray(result.houses)).toBe(true);
    });

    it('should convert tropical to sidereal for all planets', async () => {
      const result = await service.calculateVedicChart(mockBirthDetails);

      expect(mockSwissEphemerisService.convertToSidereal).toHaveBeenCalled();
      expect(result.planets.length).toBe(mockTropicalChart.planets.length);
      result.planets.forEach((planet) => {
        expect(planet).toHaveProperty('nakshatra');
        expect(planet).toHaveProperty('pada');
        expect(planet).toHaveProperty('sign');
        expect(planet).toHaveProperty('degree');
        expect(planet).toHaveProperty('longitude');
      });
    });

    it('should include Nakshatra and Pada for planets', async () => {
      const result = await service.calculateVedicChart(mockBirthDetails);

      result.planets.forEach((planet) => {
        expect(planet.nakshatra).toBeDefined();
        expect(typeof planet.nakshatra).toBe('string');
        expect(planet.pada).toBeDefined();
        expect(planet.pada).toBeGreaterThanOrEqual(1);
        expect(planet.pada).toBeLessThanOrEqual(4);
      });
    });

    it('should convert houses to sidereal', async () => {
      const result = await service.calculateVedicChart(mockBirthDetails);

      expect(result.houses.length).toBe(mockTropicalChart.houses.length);
      result.houses.forEach((house) => {
        expect(house).toHaveProperty('house');
        expect(house).toHaveProperty('sign');
        expect(house).toHaveProperty('degree');
      });
    });

    it('should calculate Lagna, Sun, and Moon signs correctly', async () => {
      const result = await service.calculateVedicChart(mockBirthDetails);

      expect(result.lagna.sign).toBeDefined();
      expect(result.lagna.degree).toBeDefined();
      expect(result.lagna.longitude).toBeDefined();
      expect(result.sunSign.sign).toBeDefined();
      expect(result.moonSign.sign).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockSwissEphemerisService.calculateBirthChart.mockRejectedValue(
        new Error('Calculation failed'),
      );

      await expect(
        service.calculateVedicChart(mockBirthDetails),
      ).rejects.toThrow('Calculation failed');
    });
  });

  describe('calculateWesternChart', () => {
    const mockBirthDetails = {
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      minute: 30,
      latitude: 28.6139,
      longitude: 77.209,
    };

    const mockChart = {
      julianDay: 2448000.5,
      ascendant: {
        longitude: 100,
        sign: 'Leo',
        signDegree: 10,
      },
      mc: {
        longitude: 190,
        sign: 'Scorpio',
        signDegree: 10,
      },
      planets: [
        { planet: 'Sun', longitude: 45, sign: 'Taurus', signDegree: 15 },
        { planet: 'Moon', longitude: 120, sign: 'Leo', signDegree: 0 },
      ],
      houses: [
        { house: 1, longitude: 100, sign: 'Leo', signDegree: 10 },
      ],
    };

    beforeEach(() => {
      mockSwissEphemerisService.calculateBirthChart.mockResolvedValue(mockChart);
    });

    it('should calculate Western chart successfully', async () => {
      const result = await service.calculateWesternChart(mockBirthDetails);

      expect(result).toBeDefined();
      expect(result.ascendant).toBeDefined();
      expect(result.mc).toBeDefined();
      expect(result.planets).toBeDefined();
      expect(result.houses).toBeDefined();
    });

    it('should return tropical chart without sidereal conversion', async () => {
      const result = await service.calculateWesternChart(mockBirthDetails);

      expect(mockSwissEphemerisService.convertToSidereal).not.toHaveBeenCalled();
      expect(result.ascendant).toEqual(mockChart.ascendant);
      expect(result.mc).toEqual(mockChart.mc);
      expect(result.planets).toEqual(mockChart.planets);
      expect(result.houses).toEqual(mockChart.houses);
    });

    it('should handle errors gracefully', async () => {
      mockSwissEphemerisService.calculateBirthChart.mockRejectedValue(
        new Error('Calculation failed'),
      );

      await expect(
        service.calculateWesternChart(mockBirthDetails),
      ).rejects.toThrow('Calculation failed');
    });
  });

  describe('getNakshatra (private via calculateVedicChart)', () => {
    it('should return correct Nakshatra for given longitude', async () => {
      const mockBirthDetails = {
        year: 1990,
        month: 5,
        day: 15,
        hour: 10,
        minute: 30,
        latitude: 28.6139,
        longitude: 77.209,
      };

      const mockChart = {
        julianDay: 2448000.5,
        ascendant: { longitude: 100, sign: 'Leo', signDegree: 10 },
        mc: { longitude: 190, sign: 'Scorpio', signDegree: 10 },
        planets: [
          { planet: 'Sun', longitude: 45, sign: 'Taurus', signDegree: 15 },
          { planet: 'Moon', longitude: 120, sign: 'Leo', signDegree: 0 },
        ],
        houses: [{ house: 1, longitude: 100, sign: 'Leo', signDegree: 10 }],
      };

      mockSwissEphemerisService.calculateBirthChart.mockResolvedValue(mockChart);
      mockSwissEphemerisService.convertToSidereal.mockImplementation(
        (longitude) => longitude - 23.85,
      );

      const result = await service.calculateVedicChart(mockBirthDetails);

      result.planets.forEach((planet) => {
        expect(planet.nakshatra).toBeDefined();
        expect(['Ashwini', 'Bharani', 'Krittika', 'Rohini']).toContain(
          planet.nakshatra,
        );
      });
    });

    it('should return pada between 1 and 4', async () => {
      const mockBirthDetails = {
        year: 1990,
        month: 5,
        day: 15,
        hour: 10,
        minute: 30,
        latitude: 28.6139,
        longitude: 77.209,
      };

      const mockChart = {
        julianDay: 2448000.5,
        ascendant: { longitude: 100, sign: 'Leo', signDegree: 10 },
        mc: { longitude: 190, sign: 'Scorpio', signDegree: 10 },
        planets: [
          { planet: 'Sun', longitude: 45, sign: 'Taurus', signDegree: 15 },
        ],
        houses: [],
      };

      mockSwissEphemerisService.calculateBirthChart.mockResolvedValue(mockChart);
      mockSwissEphemerisService.convertToSidereal.mockReturnValue(50);

      const result = await service.calculateVedicChart(mockBirthDetails);

      result.planets.forEach((planet) => {
        expect(planet.pada).toBeGreaterThanOrEqual(1);
        expect(planet.pada).toBeLessThanOrEqual(4);
      });
    });
  });
});

