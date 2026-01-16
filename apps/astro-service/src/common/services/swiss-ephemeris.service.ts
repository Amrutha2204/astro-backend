import { Injectable, Logger } from '@nestjs/common';
import * as swisseph from 'swisseph-v2';

export interface PlanetaryPosition {
  planet: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  sign: string;
  signDegree: number;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: string;
  signDegree: number;
}

export interface BirthChartData {
  ascendant: {
    longitude: number;
    sign: string;
    signDegree: number;
  };
  mc: {
    longitude: number;
    sign: string;
    signDegree: number;
  };
  planets: PlanetaryPosition[];
  houses: HouseCusp[];
  julianDay: number;
}

@Injectable()
export class SwissEphemerisService {
  private readonly logger = new Logger(SwissEphemerisService.name);
  private readonly zodiacSigns = [
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

  private dateToJulianDay(
    year: number,
    month: number,
    day: number,
    hour: number = 0,
    minute: number = 0,
    second: number = 0,
  ): number {
    const date = new Date(year, month - 1, day, hour, minute, second);
    return swisseph.swe_julday(
      year,
      month,
      day,
      hour + minute / 60 + second / 3600,
      swisseph.SE_GREG_CAL,
    );
  }

  private longitudeToSign(longitude: number): { sign: string; degree: number } {
    const signIndex = Math.floor(longitude / 30);
    const degree = longitude % 30;
    return {
      sign: this.zodiacSigns[signIndex % 12],
      degree: degree,
    };
  }

  async calculatePlanetaryPositions(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    latitude: number,
    longitude: number,
  ): Promise<PlanetaryPosition[]> {
    try {
      const julianDay = this.dateToJulianDay(year, month, day, hour, minute);
      const planets: PlanetaryPosition[] = [];

      const planetIds = [
        { id: swisseph.SE_SUN, name: 'Sun' },
        { id: swisseph.SE_MOON, name: 'Moon' },
        { id: swisseph.SE_MERCURY, name: 'Mercury' },
        { id: swisseph.SE_VENUS, name: 'Venus' },
        { id: swisseph.SE_MARS, name: 'Mars' },
        { id: swisseph.SE_JUPITER, name: 'Jupiter' },
        { id: swisseph.SE_SATURN, name: 'Saturn' },
        { id: swisseph.SE_URANUS, name: 'Uranus' },
        { id: swisseph.SE_NEPTUNE, name: 'Neptune' },
        { id: swisseph.SE_PLUTO, name: 'Pluto' },
        { id: swisseph.SE_MEAN_NODE, name: 'Rahu' },
        { id: swisseph.SE_TRUE_NODE, name: 'Ketu' },
      ];

      for (const planet of planetIds) {
        try {
          const result = swisseph.swe_calc_ut(
            julianDay,
            planet.id,
            swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED,
          );

          if (result && 'longitude' in result) {
            const { sign, degree } = this.longitudeToSign(result.longitude);
            planets.push({
              planet: planet.name,
              longitude: result.longitude,
              latitude: result.latitude || 0,
              distance: result.distance || 0,
              speed: result.longitudeSpeed || 0,
              sign: sign,
              signDegree: degree,
            });
          }
        } catch (error) {
          this.logger.warn(
            `Failed to calculate position for ${planet.name}: ${error.message}`,
          );
        }
      }

      const rahu = planets.find((p) => p.planet === 'Rahu');
      if (rahu) {
        const ketuLongitude = (rahu.longitude + 180) % 360;
        const { sign, degree } = this.longitudeToSign(ketuLongitude);
        const ketuIndex = planets.findIndex((p) => p.planet === 'Ketu');
        if (ketuIndex >= 0) {
          planets[ketuIndex] = {
            planet: 'Ketu',
            longitude: ketuLongitude,
            latitude: rahu.latitude ? -rahu.latitude : 0,
            distance: rahu.distance || 0,
            speed: rahu.speed ? -rahu.speed : 0,
            sign: sign,
            signDegree: degree,
          };
        }
      }

      return planets;
    } catch (error) {
      this.logger.error(
        `Error calculating planetary positions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async calculateHouses(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    latitude: number,
    longitude: number,
    houseSystem: string = 'P',
  ): Promise<{
    ascendant: { longitude: number; sign: string; signDegree: number };
    mc: { longitude: number; sign: string; signDegree: number };
    houses: HouseCusp[];
  }> {
    try {
      const julianDay = this.dateToJulianDay(year, month, day, hour, minute);
      const housesResult = swisseph.swe_houses(
        julianDay,
        latitude,
        longitude,
        houseSystem,
      );

      if (!housesResult || 'error' in housesResult || !housesResult.house) {
        throw new Error(
          'error' in housesResult
            ? housesResult.error
            : 'Failed to calculate houses',
        );
      }

      const houseArray = housesResult.house;
      const ascendant = housesResult.ascendant;
      const mc = housesResult.mc;

      const houses: HouseCusp[] = [];
      for (let i = 1; i <= 12; i++) {
        let cuspLongitude = houseArray[i];
        if (cuspLongitude === undefined || cuspLongitude === null || isNaN(cuspLongitude)) {
          if (i === 12 && houseArray[1] !== undefined) {
            cuspLongitude = (houseArray[1] + 180) % 360;
          } else {
            continue;
          }
        }
        const { sign, degree } = this.longitudeToSign(cuspLongitude);
        houses.push({
          house: i,
          longitude: cuspLongitude,
          sign: sign,
          signDegree: degree,
        });
      }

      return {
        ascendant: {
          longitude: ascendant,
          sign: this.longitudeToSign(ascendant).sign,
          signDegree: this.longitudeToSign(ascendant).degree,
        },
        mc: {
          longitude: mc,
          sign: this.longitudeToSign(mc).sign,
          signDegree: this.longitudeToSign(mc).degree,
        },
        houses: houses,
      };
    } catch (error) {
      this.logger.error(`Error calculating houses: ${error.message}`, error.stack);
      throw error;
    }
  }

  async calculateBirthChart(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    latitude: number,
    longitude: number,
    houseSystem: string = 'P',
  ): Promise<BirthChartData> {
    try {
      const julianDay = this.dateToJulianDay(year, month, day, hour, minute);
      const planets = await this.calculatePlanetaryPositions(
        year,
        month,
        day,
        hour,
        minute,
        latitude,
        longitude,
      );
      const housesData = await this.calculateHouses(
        year,
        month,
        day,
        hour,
        minute,
        latitude,
        longitude,
        houseSystem,
      );

      return {
        ascendant: housesData.ascendant,
        mc: housesData.mc,
        planets: planets,
        houses: housesData.houses,
        julianDay: julianDay,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating birth chart: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  convertToSidereal(
    tropicalLongitude: number,
    julianDay: number,
    ayanamsa: number = swisseph.SE_SIDM_LAHIRI,
  ): number {
    try {
      swisseph.swe_set_sid_mode(ayanamsa, 0, 0);
      const ayanamsaResult = swisseph.swe_get_ayanamsa_ex_ut(
        julianDay,
        swisseph.SEFLG_SWIEPH,
      );
      
      if ('error' in ayanamsaResult) {
        this.logger.warn(`Error getting ayanamsa: ${ayanamsaResult.error}`);
        return tropicalLongitude;
      }

      const ayanamsaValue = ayanamsaResult.ayanamsa;
      const siderealLongitude = tropicalLongitude - ayanamsaValue;
      return siderealLongitude < 0 ? siderealLongitude + 360 : siderealLongitude;
    } catch (error) {
      this.logger.error(
        `Error converting to sidereal: ${error.message}`,
        error.stack,
      );
      return tropicalLongitude;
    }
  }
}

