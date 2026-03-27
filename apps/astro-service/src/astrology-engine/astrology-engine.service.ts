import { Injectable, Logger } from '@nestjs/common';
import {
  HouseSystem,
  HOUSE_SYSTEM_MAP,
  NAKSHATRAS,
  ZODIAC_SIGNS,
} from '../common/constants/astrology.constants';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';
import { BirthDetails, VedicChartData } from './interfaces/astrology-engine.interface';
import { BirthChartDto } from './dto/birth-chart.dto';

export type { BirthDetails, VedicChartData } from './interfaces/astrology-engine.interface';

@Injectable()
export class AstrologyEngineService {
  private readonly logger = new Logger(AstrologyEngineService.name);

  constructor(
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  mapDtoToBirthDetails(dto: BirthChartDto): BirthDetails {
    const houseSystem =
      dto.houseSystem != null
        ? (HOUSE_SYSTEM_MAP[String(dto.houseSystem).toLowerCase()] ?? HouseSystem.Placidus)
        : HouseSystem.Placidus;
    return {
      year: dto.year,
      month: dto.month,
      day: dto.day,
      hour: dto.hour ?? 12,
      minute: dto.minute ?? 0,
      latitude: dto.latitude,
      longitude: dto.longitude,
      houseSystem,
    };
  }

  /**
   * Vedic nakshatra: 27 equal divisions of 360° (13°20' each), 4 padas per nakshatra (3°20' each).
   * Longitude normalized to [0, 360) for consistent indexing.
   */
  private getNakshatra(longitude: number): { name: string; pada: number } {
    const lon = ((longitude % 360) + 360) % 360;
    const nakshatraIndex = Math.floor(lon / (360 / 27));
    const nakshatra = NAKSHATRAS[nakshatraIndex % 27];
    const remainder = lon % (360 / 27);
    const pada = Math.min(Math.floor(remainder / (360 / 27 / 4)) + 1, 4);
    return { name: nakshatra, pada: Math.max(1, pada) };
  }

  /**
   * Calculate Vedic chart from UT Julian day (e.g. after converting birth local time to UT).
   */
  async calculateVedicChartFromJulianDay(
    julianDayUt: number,
    latitude: number,
    longitude: number,
    houseSystem: HouseSystem = HouseSystem.Placidus,
  ): Promise<VedicChartData> {
    const tropicalChart =
      await this.swissEphemerisService.calculateBirthChartFromJulianDay(
        julianDayUt,
        latitude,
        longitude,
        houseSystem,
      );
    return this.tropicalChartToVedic(tropicalChart);
  }

  async calculateVedicChart(
    birthDetails: BirthDetails,
  ): Promise<VedicChartData> {
    try {
      const houseSystem = birthDetails.houseSystem ?? HouseSystem.Placidus;
      const tropicalChart = await this.swissEphemerisService.calculateBirthChart(
        birthDetails.year,
        birthDetails.month,
        birthDetails.day,
        birthDetails.hour,
        birthDetails.minute,
        birthDetails.latitude,
        birthDetails.longitude,
        houseSystem,
      );

      return this.tropicalChartToVedic(tropicalChart);
    } catch (error) {
      this.logger.error(
        `Error calculating Vedic chart: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private tropicalChartToVedic(tropicalChart: {
    julianDay: number;
    ascendant: { longitude: number };
    planets: Array<{ planet: string; longitude: number; speed?: number }>;
    houses: Array<{ house: number; longitude: number }>;
  }): VedicChartData {
    const julianDay = tropicalChart.julianDay;
      const lagnaSidereal = this.swissEphemerisService.convertToSidereal(
        tropicalChart.ascendant.longitude,
        julianDay,
      );

      const sunSidereal = this.swissEphemerisService.convertToSidereal(
        tropicalChart.planets.find((p) => p.planet === 'Sun')?.longitude || 0,
        julianDay,
      );

      const moonSidereal = this.swissEphemerisService.convertToSidereal(
        tropicalChart.planets.find((p) => p.planet === 'Moon')?.longitude || 0,
        julianDay,
      );

      const siderealPlanets = tropicalChart.planets.map((planet) => {
        const siderealLongitude = this.swissEphemerisService.convertToSidereal(
          planet.longitude,
          julianDay,
        );
        const { sign, degree } = this.longitudeToSign(siderealLongitude);
        const nakshatra = this.getNakshatra(siderealLongitude);

        return {
          planet: planet.planet,
          sign: sign,
          degree: degree,
          longitude: siderealLongitude,
          nakshatra: nakshatra.name,
          pada: nakshatra.pada,
          speed: planet.speed,
        };
      });

      const siderealHouses = tropicalChart.houses.map((house) => {
        const siderealLongitude = this.swissEphemerisService.convertToSidereal(
          house.longitude,
          julianDay,
        );
        const { sign, degree } = this.longitudeToSign(siderealLongitude);

        return {
          house: house.house,
          sign: sign,
          degree: degree,
          longitude: siderealLongitude,
        };
      });

      const { sign: lagnaSign, degree: lagnaDegree } =
        this.longitudeToSign(lagnaSidereal);
      const { sign: sunSign, degree: sunDegree } =
        this.longitudeToSign(sunSidereal);
      const { sign: moonSign, degree: moonDegree } =
        this.longitudeToSign(moonSidereal);

      return {
        lagna: {
          sign: lagnaSign,
          degree: lagnaDegree,
          longitude: lagnaSidereal,
        },
        sunSign: {
          sign: sunSign,
          degree: sunDegree,
          longitude: sunSidereal,
        },
        moonSign: {
          sign: moonSign,
          degree: moonDegree,
          longitude: moonSidereal,
        },
        planets: siderealPlanets,
        houses: siderealHouses,
      };
  }

  async calculateWesternChartFromJulianDay(
    julianDayUt: number,
    latitude: number,
    longitude: number,
    houseSystem: HouseSystem = HouseSystem.Placidus,
  ): Promise<{
    ascendant: { longitude: number; sign: string; signDegree: number };
    mc: { longitude: number; sign: string; signDegree: number };
    planets: Array<{ planet: string; longitude: number; sign: string; signDegree: number }>;
    houses: Array<{ house: number; longitude: number; sign: string; signDegree: number }>;
  }> {
    const chart =
      await this.swissEphemerisService.calculateBirthChartFromJulianDay(
        julianDayUt,
        latitude,
        longitude,
        houseSystem,
      );
    return {
      ascendant: chart.ascendant,
      mc: chart.mc,
      planets: chart.planets,
      houses: chart.houses,
    };
  }

  async calculateWesternChart(
    birthDetails: BirthDetails,
  ): Promise<any> {
    try {
      const houseSystem = birthDetails.houseSystem ?? HouseSystem.Placidus;
      const chart = await this.swissEphemerisService.calculateBirthChart(
        birthDetails.year,
        birthDetails.month,
        birthDetails.day,
        birthDetails.hour,
        birthDetails.minute,
        birthDetails.latitude,
        birthDetails.longitude,
        houseSystem,
      );

      return {
        ascendant: chart.ascendant,
        mc: chart.mc,
        planets: chart.planets,
        houses: chart.houses,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating Western chart: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /** Convert ecliptic longitude to sign (0–30° per sign) and degree within sign. Normalized to [0, 360). */
  private longitudeToSign(longitude: number): { sign: string; degree: number } {
    const lon = ((longitude % 360) + 360) % 360;
    const signIndex = Math.floor(lon / 30) % 12;
    const degree = lon % 30;
    return {
      sign: ZODIAC_SIGNS[signIndex],
      degree,
    };
  }

  /**
   * Build a divisional chart (D-chart) from the birth chart (D-1).
   * Formula: divisional_longitude = (sidereal_longitude * divisor) % 360.
   */
  toDivisionalChart(data: VedicChartData, divisor: number): VedicChartData {
    if (divisor <= 1) return data;

    const transform = (lon: number) => (lon * divisor) % 360;

    const lagnaLon = transform(data.lagna.longitude);
    const { sign: lagnaSign, degree: lagnaDegree } = this.longitudeToSign(lagnaLon);

    const sunLon = transform(data.sunSign.longitude);
    const { sign: sunSign, degree: sunDegree } = this.longitudeToSign(sunLon);

    const moonLon = transform(data.moonSign.longitude);
    const { sign: moonSign, degree: moonDegree } = this.longitudeToSign(moonLon);

    const planets = data.planets.map((p) => {
      const lon = transform(p.longitude);
      const { sign, degree } = this.longitudeToSign(lon);
      const nakshatra = this.getNakshatra(lon);
      return {
        planet: p.planet,
        sign,
        degree,
        longitude: lon,
        nakshatra: nakshatra.name,
        pada: nakshatra.pada,
        speed: p.speed,
      };
    });

    const houses = data.houses.map((h) => {
      const lon = transform(h.longitude);
      const { sign, degree } = this.longitudeToSign(lon);
      return { house: h.house, sign, degree, longitude: lon };
    });

    return {
      lagna: { sign: lagnaSign, degree: lagnaDegree, longitude: lagnaLon },
      sunSign: { sign: sunSign, degree: sunDegree, longitude: sunLon },
      moonSign: { sign: moonSign, degree: moonDegree, longitude: moonLon },
      planets,
      houses,
    };
  }
}

