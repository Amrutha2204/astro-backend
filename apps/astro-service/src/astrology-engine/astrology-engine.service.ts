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

  private getNakshatra(longitude: number): { name: string; pada: number } {
    const nakshatraIndex = Math.floor(longitude / (360 / 27));
    const nakshatra = NAKSHATRAS[nakshatraIndex % 27];
    const remainder = longitude % (360 / 27);
    const pada = Math.floor(remainder / (360 / 27 / 4)) + 1;
    return { name: nakshatra, pada: Math.min(pada, 4) };
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
    } catch (error) {
      this.logger.error(
        `Error calculating Vedic chart: ${error.message}`,
        error.stack,
      );
      throw error;
    }
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

  /**
   * Convert longitude to sign and degree within sign
   */
  private longitudeToSign(longitude: number): { sign: string; degree: number } {
    const signIndex = Math.floor(longitude / 30);
    const degree = longitude % 30;
    return {
      sign: ZODIAC_SIGNS[signIndex % 12],
      degree: degree,
    };
  }
}

