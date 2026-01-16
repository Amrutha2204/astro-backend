import { Injectable, Logger } from '@nestjs/common';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

export interface BirthDetails {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
}

export interface VedicChartData {
  lagna: {
    sign: string;
    degree: number;
    longitude: number;
  };
  sunSign: {
    sign: string;
    degree: number;
    longitude: number;
  };
  moonSign: {
    sign: string;
    degree: number;
    longitude: number;
  };
  planets: Array<{
    planet: string;
    sign: string;
    degree: number;
    longitude: number;
    nakshatra?: string;
    pada?: number;
  }>;
  houses: Array<{
    house: number;
    sign: string;
    degree: number;
  }>;
}

@Injectable()
export class AstrologyEngineService {
  private readonly logger = new Logger(AstrologyEngineService.name);
  private readonly nakshatras = [
    'Ashwini',
    'Bharani',
    'Krittika',
    'Rohini',
    'Mrigashira',
    'Ardra',
    'Punarvasu',
    'Pushya',
    'Ashlesha',
    'Magha',
    'Purva Phalguni',
    'Uttara Phalguni',
    'Hasta',
    'Chitra',
    'Swati',
    'Vishakha',
    'Anuradha',
    'Jyeshta',
    'Mula',
    'Purva Ashadha',
    'Uttara Ashadha',
    'Shravana',
    'Dhanishta',
    'Shatabhisha',
    'Purva Bhadrapada',
    'Uttara Bhadrapada',
    'Revati',
  ];

  constructor(
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  private getNakshatra(longitude: number): { name: string; pada: number } {
    const nakshatraIndex = Math.floor(longitude / (360 / 27));
    const nakshatra = this.nakshatras[nakshatraIndex % 27];
    const remainder = longitude % (360 / 27);
    const pada = Math.floor(remainder / (360 / 27 / 4)) + 1;
    return { name: nakshatra, pada: Math.min(pada, 4) };
  }

  async calculateVedicChart(
    birthDetails: BirthDetails,
  ): Promise<VedicChartData> {
    try {
      const tropicalChart = await this.swissEphemerisService.calculateBirthChart(
        birthDetails.year,
        birthDetails.month,
        birthDetails.day,
        birthDetails.hour,
        birthDetails.minute,
        birthDetails.latitude,
        birthDetails.longitude,
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
      const chart = await this.swissEphemerisService.calculateBirthChart(
        birthDetails.year,
        birthDetails.month,
        birthDetails.day,
        birthDetails.hour,
        birthDetails.minute,
        birthDetails.latitude,
        birthDetails.longitude,
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
    const zodiacSigns = [
      'Aries',
      'Taurus',
      'Gemini',
      'Cancer',
      'Leo',
      'Virgo',
      'Libra',
      'Scorpio',
      'Sagittarius',
      'Capricorn',
      'Aquarius',
      'Pisces',
    ];
    const signIndex = Math.floor(longitude / 30);
    const degree = longitude % 30;
    return {
      sign: zodiacSigns[signIndex % 12],
      degree: degree,
    };
  }
}

