import { Test, TestingModule } from '@nestjs/testing';
import { SwissEphemerisService } from './swiss-ephemeris.service';
import * as swisseph from 'swisseph-v2';

jest.mock('swisseph-v2');

describe('SwissEphemerisService', () => {
  let service: SwissEphemerisService;
  const mockSwisseph = swisseph as jest.Mocked<typeof swisseph>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwissEphemerisService],
    }).compile();

    service = module.get<SwissEphemerisService>(SwissEphemerisService);

    jest.clearAllMocks();
  });

  describe('calculatePlanetaryPositions', () => {
    const mockBirthDetails = {
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      minute: 30,
      latitude: 28.6139,
      longitude: 77.209,
    };

    beforeEach(() => {
      mockSwisseph.swe_julday = jest.fn().mockReturnValue(2448000.5);
      mockSwisseph.SE_GREG_CAL = 1;
      mockSwisseph.SEFLG_SWIEPH = 2;
      mockSwisseph.SEFLG_SPEED = 256;
      mockSwisseph.SE_SUN = 0;
      mockSwisseph.SE_MOON = 1;
      mockSwisseph.SE_MERCURY = 2;
      mockSwisseph.SE_VENUS = 3;
      mockSwisseph.SE_MARS = 4;
      mockSwisseph.SE_JUPITER = 5;
      mockSwisseph.SE_SATURN = 6;
      mockSwisseph.SE_URANUS = 7;
      mockSwisseph.SE_NEPTUNE = 8;
      mockSwisseph.SE_PLUTO = 9;
      mockSwisseph.SE_MEAN_NODE = 10;
      mockSwisseph.SE_TRUE_NODE = 11;
    });

    it('should calculate planetary positions successfully', async () => {
      mockSwisseph.swe_calc_ut = jest.fn().mockReturnValue({
        longitude: 45.5,
        latitude: 0,
        distance: 1.0,
        longitudeSpeed: 0.985,
      });

      const result = await service.calculatePlanetaryPositions(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('planet');
      expect(result[0]).toHaveProperty('longitude');
      expect(result[0]).toHaveProperty('sign');
      expect(result[0]).toHaveProperty('signDegree');
    });

    it('should include all major planets', async () => {
      mockSwisseph.swe_calc_ut = jest.fn().mockReturnValue({
        longitude: 45.5,
        latitude: 0,
        distance: 1.0,
        longitudeSpeed: 0.985,
      });

      const result = await service.calculatePlanetaryPositions(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
      );

      const planetNames = result.map((p) => p.planet);
      expect(planetNames).toContain('Sun');
      expect(planetNames).toContain('Moon');
      expect(planetNames).toContain('Mercury');
      expect(planetNames).toContain('Venus');
      expect(planetNames).toContain('Mars');
      expect(planetNames).toContain('Jupiter');
      expect(planetNames).toContain('Saturn');
    });

    it('should calculate Ketu as opposite of Rahu', async () => {
      mockSwisseph.swe_calc_ut = jest.fn().mockImplementation((jd, planetId) => {
        if (planetId === mockSwisseph.SE_MEAN_NODE) {
          return { longitude: 100, latitude: 0, distance: 1.0, longitudeSpeed: 0 };
        }
        return { longitude: 45.5, latitude: 0, distance: 1.0, longitudeSpeed: 0.985 };
      });

      const result = await service.calculatePlanetaryPositions(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
      );

      const rahu = result.find((p) => p.planet === 'Rahu');
      const ketu = result.find((p) => p.planet === 'Ketu');

      expect(rahu).toBeDefined();
      expect(ketu).toBeDefined();
      if (rahu && ketu) {
        const expectedKetuLongitude = (rahu.longitude + 180) % 360;
        expect(ketu.longitude).toBeCloseTo(expectedKetuLongitude, 1);
      }
    });

    it('should handle errors gracefully when planet calculation fails', async () => {
      mockSwisseph.swe_calc_ut = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Calculation failed');
        })
        .mockReturnValue({
          longitude: 45.5,
          latitude: 0,
          distance: 1.0,
          longitudeSpeed: 0.985,
        });

      const result = await service.calculatePlanetaryPositions(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should convert longitude to correct zodiac sign', async () => {
      mockSwisseph.swe_calc_ut = jest.fn().mockReturnValue({
        longitude: 45.5,
        latitude: 0,
        distance: 1.0,
        longitudeSpeed: 0.985,
      });

      const result = await service.calculatePlanetaryPositions(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
      );

      if (result.length > 0) {
        expect(result[0].sign).toBeDefined();
        expect(typeof result[0].sign).toBe('string');
        expect(result[0].signDegree).toBeGreaterThanOrEqual(0);
        expect(result[0].signDegree).toBeLessThan(30);
      }
    });
  });

  describe('calculateHouses', () => {
    const mockBirthDetails = {
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      minute: 30,
      latitude: 28.6139,
      longitude: 77.209,
    };

    beforeEach(() => {
      mockSwisseph.swe_julday = jest.fn().mockReturnValue(2448000.5);
      mockSwisseph.SE_GREG_CAL = 1;
      mockSwisseph.SE_HS_PLACIDUS = 'P';
    });

    it('should calculate houses successfully', async () => {
      const mockCusps = [100, 130, 160, 190, 220, 250, 280, 310, 340, 10, 40, 70];
      mockSwisseph.swe_houses = jest.fn().mockReturnValue({
        cusps: mockCusps,
        ascmc: [100, 190],
      });

      const result = await service.calculateHouses(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
        'P',
      );

      expect(result).toBeDefined();
      expect(result.houses).toBeDefined();
      expect(Array.isArray(result.houses)).toBe(true);
      expect(result.houses.length).toBe(12);
      expect(result.ascendant).toBeDefined();
      expect(result.ascendant.longitude).toBeDefined();
    });

    it('should handle missing house 12 by calculating opposite of house 1', async () => {
      const mockCusps = [100, 130, 160, 190, 220, 250, 280, 310, 340, 10, 40, null];
      mockSwisseph.swe_houses = jest.fn().mockReturnValue({
        cusps: mockCusps,
        ascmc: [100, 190],
      });

      const result = await service.calculateHouses(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
        'P',
      );

      const house12 = result.houses.find((h) => h.house === 12);
      expect(house12).toBeDefined();
      if (house12) {
        const house1 = result.houses.find((h) => h.house === 1);
        expect(house12.longitude).toBeCloseTo((house1!.longitude + 180) % 360, 1);
      }
    });

    it('should return ascendant and MC correctly', async () => {
      const mockCusps = [100, 130, 160, 190, 220, 250, 280, 310, 340, 10, 40, 70];
      mockSwisseph.swe_houses = jest.fn().mockReturnValue({
        cusps: mockCusps,
        ascmc: [100, 190],
      });

      const result = await service.calculateHouses(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
        'P',
      );

      expect(result.ascendant.longitude).toBe(100);
      expect(result.mc.longitude).toBe(190);
    });
  });

  describe('calculateBirthChart', () => {
    const mockBirthDetails = {
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      minute: 30,
      latitude: 28.6139,
      longitude: 77.209,
    };

    beforeEach(() => {
      mockSwisseph.swe_julday = jest.fn().mockReturnValue(2448000.5);
      mockSwisseph.SE_GREG_CAL = 1;
      mockSwisseph.SEFLG_SWIEPH = 2;
      mockSwisseph.SEFLG_SPEED = 256;
      mockSwisseph.SE_HS_PLACIDUS = 'P';
      mockSwisseph.swe_calc_ut = jest.fn().mockReturnValue({
        longitude: 45.5,
        latitude: 0,
        distance: 1.0,
        longitudeSpeed: 0.985,
      });
      mockSwisseph.swe_houses = jest.fn().mockReturnValue({
        cusps: [100, 130, 160, 190, 220, 250, 280, 310, 340, 10, 40, 70],
        ascmc: [100, 190],
      });
    });

    it('should calculate complete birth chart', async () => {
      const result = await service.calculateBirthChart(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
        'P',
      );

      expect(result).toBeDefined();
      expect(result.ascendant).toBeDefined();
      expect(result.mc).toBeDefined();
      expect(result.planets).toBeDefined();
      expect(Array.isArray(result.planets)).toBe(true);
      expect(result.houses).toBeDefined();
      expect(Array.isArray(result.houses)).toBe(true);
      expect(result.julianDay).toBeDefined();
    });

    it('should include all required chart components', async () => {
      const result = await service.calculateBirthChart(
        mockBirthDetails.year,
        mockBirthDetails.month,
        mockBirthDetails.day,
        mockBirthDetails.hour,
        mockBirthDetails.minute,
        mockBirthDetails.latitude,
        mockBirthDetails.longitude,
        'P',
      );

      expect(result.ascendant.sign).toBeDefined();
      expect(result.ascendant.signDegree).toBeDefined();
      expect(result.mc.sign).toBeDefined();
      expect(result.planets.length).toBeGreaterThan(0);
      expect(result.houses.length).toBe(12);
    });
  });

  describe('convertToSidereal', () => {
    beforeEach(() => {
      mockSwisseph.SE_SIDM_LAHIRI = 1;
      mockSwisseph.SEFLG_SWIEPH = 2;
      mockSwisseph.swe_set_sid_mode = jest.fn();
      mockSwisseph.swe_get_ayanamsa_ex_ut = jest.fn().mockReturnValue({
        ayanamsa: 23.85,
      });
    });

    it('should convert tropical to sidereal longitude', () => {
      const tropicalLongitude = 100;
      const julianDay = 2448000.5;

      const result = service.convertToSidereal(tropicalLongitude, julianDay);

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(mockSwisseph.swe_set_sid_mode).toHaveBeenCalled();
      expect(mockSwisseph.swe_get_ayanamsa_ex_ut).toHaveBeenCalledWith(
        julianDay,
        mockSwisseph.SEFLG_SWIEPH,
      );
    });

    it('should handle negative results correctly', () => {
      const tropicalLongitude = 10;
      const julianDay = 2448000.5;
      mockSwisseph.swe_get_ayanamsa_ex_ut = jest.fn().mockReturnValue({
        ayanamsa: 25,
      });

      const result = service.convertToSidereal(tropicalLongitude, julianDay);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(360);
    });

    it('should use default Lahiri ayanamsa when not provided', () => {
      const tropicalLongitude = 100;
      const julianDay = 2448000.5;

      const result = service.convertToSidereal(tropicalLongitude, julianDay);

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
      expect(mockSwisseph.swe_set_sid_mode).toHaveBeenCalledWith(
        mockSwisseph.SE_SIDM_LAHIRI,
        0,
        0,
      );
    });

    it('should handle ayanamsa errors gracefully', () => {
      const tropicalLongitude = 100;
      const julianDay = 2448000.5;
      mockSwisseph.swe_get_ayanamsa_ex_ut = jest.fn().mockReturnValue({
        error: 'Ayanamsa calculation failed',
      });

      const result = service.convertToSidereal(tropicalLongitude, julianDay);

      expect(result).toBe(tropicalLongitude);
    });
  });
});

