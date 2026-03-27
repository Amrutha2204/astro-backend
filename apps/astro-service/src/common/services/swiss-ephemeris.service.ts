import { Injectable, Logger } from '@nestjs/common';
import * as swisseph from 'swisseph-v2';
import { ZODIAC_SIGNS } from '../constants/astrology.constants';
import type { BirthChartData, HouseCusp, PlanetaryPosition } from '../interfaces/swiss-ephemeris.interface';

export type { BirthChartData, HouseCusp, PlanetaryPosition } from '../interfaces/swiss-ephemeris.interface';

@Injectable()
export class SwissEphemerisService {
  private readonly logger = new Logger(SwissEphemerisService.name);

  private dateToJulianDay(
    year: number,
    month: number,
    day: number,
    hour: number = 0,
    minute: number = 0,
    second: number = 0,
  ): number {
    return swisseph.swe_julday(
      year,
      month,
      day,
      hour + minute / 60 + second / 3600,
      swisseph.SE_GREG_CAL,
    );
  }

  /**
   * Convert local time at birth place to Julian day (UT).
   * Birth time is interpreted as local time; timezoneOffsetHours is east-of-Greenwich (e.g. 5.5 for IST).
   */
  localTimeToJulianDayUt(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    timezoneOffsetHours: number,
  ): number {
    const utc = swisseph.swe_utc_time_zone(
      year,
      month,
      day,
      hour,
      minute,
      second,
      timezoneOffsetHours,
    );
    const result = swisseph.swe_utc_to_jd(
      utc.year,
      utc.month,
      utc.day,
      utc.hour,
      utc.minute,
      utc.second,
      swisseph.SE_GREG_CAL,
    );
    if (result && 'error' in result) {
      throw new Error(String((result as { error: string }).error));
    }
    return (result as { julianDayUT: number }).julianDayUT;
  }

  private longitudeToSign(longitude: number): { sign: string; degree: number } {
    const signIndex = Math.floor(longitude / 30);
    const degree = longitude % 30;
    return {
      sign: ZODIAC_SIGNS[signIndex % 12],
      degree: degree,
    };
  }

  async calculatePlanetaryPositionsFromJulianDay(
    julianDayUt: number,
  ): Promise<PlanetaryPosition[]> {
    try {
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
            julianDayUt,
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
            ...planets[ketuIndex],
            longitude: ketuLongitude,
            latitude: rahu.latitude ? -rahu.latitude : 0,
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

  async calculateHousesFromJulianDay(
    julianDayUt: number,
    latitude: number,
    longitude: number,
    houseSystem: string = 'P',
  ): Promise<{
    ascendant: { longitude: number; sign: string; signDegree: number };
    mc: { longitude: number; sign: string; signDegree: number };
    houses: HouseCusp[];
  }> {
    try {
      const housesResult = swisseph.swe_houses(
        julianDayUt,
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

  async calculateBirthChartFromJulianDay(
    julianDayUt: number,
    latitude: number,
    longitude: number,
    houseSystem: string = 'P',
  ): Promise<BirthChartData> {
    try {
      const [planets, housesData] = await Promise.all([
        this.calculatePlanetaryPositionsFromJulianDay(julianDayUt),
        this.calculateHousesFromJulianDay(
          julianDayUt,
          latitude,
          longitude,
          houseSystem,
        ),
      ]);
      return {
        ascendant: housesData.ascendant,
        mc: housesData.mc,
        planets: planets,
        houses: housesData.houses,
        julianDay: julianDayUt,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating birth chart: ${error.message}`,
        error.stack,
      );
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

  /** Tropical to sidereal (Vedic). Default: Lahiri ayanamsa (Indian standard). */
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

  /**
   * Get Sun rise, set, and meridian transit (solar noon) for a given date and location.
   * Times are returned in UTC as HH:mm strings.
   */
  getSunRiseSetTransit(
    year: number,
    month: number,
    day: number,
    longitude: number,
    latitude: number,
    heightMeters: number = 0,
  ): {
    sunrise: string;
    sunset: string;
    transit: string;
    sunriseJd?: number;
    sunsetJd?: number;
    transitJd?: number;
  } | { error: string } {
    try {
      const jdStart = this.dateToJulianDay(year, month, day, 0, 0, 0);
      const atpress = 1013.25;
      const attemp = 15;

      const riseResult = swisseph.swe_rise_trans(
        jdStart,
        swisseph.SE_SUN,
        '',
        swisseph.SEFLG_SWIEPH,
        swisseph.SE_CALC_RISE,
        longitude,
        latitude,
        heightMeters,
        atpress,
        attemp,
      );
      const setResult = swisseph.swe_rise_trans(
        jdStart,
        swisseph.SE_SUN,
        '',
        swisseph.SEFLG_SWIEPH,
        swisseph.SE_CALC_SET,
        longitude,
        latitude,
        heightMeters,
        atpress,
        attemp,
      );
      const transitResult = swisseph.swe_rise_trans(
        jdStart,
        swisseph.SE_SUN,
        '',
        swisseph.SEFLG_SWIEPH,
        swisseph.SE_CALC_MTRANSIT,
        longitude,
        latitude,
        heightMeters,
        atpress,
        attemp,
      );

      if ('error' in riseResult || 'error' in setResult || 'error' in transitResult) {
        return {
          error:
            ('error' in riseResult && riseResult.error) ||
            ('error' in setResult && setResult.error) ||
            ('error' in transitResult && transitResult.error) ||
            'Unknown error',
        };
      }

      const jdToTime = (jd: number): string => {
        const utc = swisseph.swe_jdut1_to_utc(jd, swisseph.SE_GREG_CAL);
        const h = Math.floor(utc.hour);
        const m = Math.floor(utc.minute);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      return {
        sunrise: jdToTime(riseResult.transitTime),
        sunset: jdToTime(setResult.transitTime),
        transit: jdToTime(transitResult.transitTime),
        sunriseJd: riseResult.transitTime,
        sunsetJd: setResult.transitTime,
        transitJd: transitResult.transitTime,
      };
    } catch (error) {
      this.logger.error(
        `Error getting sun rise/set: ${error.message}`,
        error.stack,
      );
      return { error: String(error.message) };
    }
  }

  /**
   * Get Moon rise and set for a given date and location.
   * Times are returned in UTC as HH:mm strings.
   */
  getMoonRiseSet(
    year: number,
    month: number,
    day: number,
    longitude: number,
    latitude: number,
    heightMeters: number = 0,
  ): {
    moonRise: string;
    moonSet: string;
  } | { error: string } {
    try {
      const jdStart = this.dateToJulianDay(year, month, day, 0, 0, 0);
      const atpress = 1013.25;
      const attemp = 15;

      const riseResult = swisseph.swe_rise_trans(
        jdStart,
        swisseph.SE_MOON,
        '',
        swisseph.SEFLG_SWIEPH,
        swisseph.SE_CALC_RISE,
        longitude,
        latitude,
        heightMeters,
        atpress,
        attemp,
      );
      const setResult = swisseph.swe_rise_trans(
        jdStart,
        swisseph.SE_MOON,
        '',
        swisseph.SEFLG_SWIEPH,
        swisseph.SE_CALC_SET,
        longitude,
        latitude,
        heightMeters,
        atpress,
        attemp,
      );

      if ('error' in riseResult || 'error' in setResult) {
        return {
          error:
            ('error' in riseResult && riseResult.error) ||
            ('error' in setResult && setResult.error) ||
            'Unknown error',
        };
      }

      const jdToTime = (jd: number): string => {
        const utc = swisseph.swe_jdut1_to_utc(jd, swisseph.SE_GREG_CAL);
        const h = Math.floor(utc.hour);
        const m = Math.floor(utc.minute);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      return {
        moonRise: jdToTime(riseResult.transitTime),
        moonSet: jdToTime(setResult.transitTime),
      };
    } catch (error) {
      this.logger.error(
        `Error getting moon rise/set: ${error.message}`,
        error.stack,
      );
      return { error: String(error.message) };
    }
  }

  /** Parse YYYY-MM-DD and return Julian day (UT) at noon. */
  dateStringToJulianDay(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    return this.dateToJulianDay(y, m, d, 12, 0, 0);
  }

  /** Convert Julian day (UT) to UTC date string YYYY-MM-DD. */
  jdToUtcDateString(jd: number): string {
    const utc = swisseph.swe_jdut1_to_utc(jd, swisseph.SE_GREG_CAL);
    const d = Math.floor(utc.day);
    const m = Math.floor(utc.month);
    const y = Math.floor(utc.year);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  /** Convert Julian day (UT) to full UTC ISO-like string. */
  jdToUtcIso(jd: number): string {
    const utc = swisseph.swe_jdut1_to_utc(jd, swisseph.SE_GREG_CAL);
    const y = Math.floor(utc.year);
    const m = Math.floor(utc.month);
    const d = Math.floor(utc.day);
    const h = Math.floor(utc.hour);
    const min = Math.floor(utc.minute);
    const sec = Math.floor(utc.second);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}Z`;
  }

  /**
   * Get next N solar eclipses from a start date (global).
   * If endJd is set, only eclipses with maximum <= endJd are included.
   */
  getNextSolarEclipses(
    startJd: number,
    limit: number,
    endJd?: number,
  ): Array<{
    date: string;
    maximum: string;
    type: string;
  }> {
    const results: Array<{
      date: string;
      maximum: string;
      type: string;
    }> = [];
    let jd = startJd;
    const ifl = swisseph.SEFLG_SWIEPH;
    const ifltype = swisseph.SE_ECL_ALLTYPES_SOLAR;

    for (let i = 0; i < limit; i++) {
      try {
        const r = swisseph.swe_sol_eclipse_when_glob(
          jd,
          ifl,
          ifltype,
          0 as 0,
        );
        if ('error' in r) break;
        if (endJd != null && r.maximum > endJd) break;
        const dateStr = this.jdToUtcDateString(r.maximum);
        const maxIso = this.jdToUtcIso(r.maximum);
        let type = 'Partial';
        if (r.rflag & swisseph.SE_ECL_TOTAL) type = 'Total';
        else if (r.rflag & swisseph.SE_ECL_ANNULAR) type = 'Annular';
        else if (r.rflag & swisseph.SE_ECL_ANNULAR_TOTAL) type = 'Hybrid';
        results.push({
          date: dateStr,
          maximum: maxIso,
          type,
        });
        jd = r.maximum + 1;
      } catch {
        break;
      }
    }
    return results;
  }

  /**
   * Get solar eclipses within a Julian day range (inclusive by date).
   */
  getSolarEclipsesInRange(
    startJd: number,
    endJd: number,
    maxIterations: number = 2000,
  ): Array<{
    date: string;
    maximum: string;
    type: string;
  }> {
    const results: Array<{
      date: string;
      maximum: string;
      type: string;
    }> = [];
    let jd = startJd;
    const ifl = swisseph.SEFLG_SWIEPH;
    const ifltype = swisseph.SE_ECL_ALLTYPES_SOLAR;
    const endDateStr = this.jdToUtcDateString(endJd);

    for (let i = 0; i < maxIterations; i++) {
      try {
        const r = swisseph.swe_sol_eclipse_when_glob(
          jd,
          ifl,
          ifltype,
          0 as 0,
        );
        if ('error' in r) break;
        const dateStr = this.jdToUtcDateString(r.maximum);
        if (dateStr > endDateStr) break;
        const maxIso = this.jdToUtcIso(r.maximum);
        let type = 'Partial';
        if (r.rflag & swisseph.SE_ECL_TOTAL) type = 'Total';
        else if (r.rflag & swisseph.SE_ECL_ANNULAR) type = 'Annular';
        else if (r.rflag & swisseph.SE_ECL_ANNULAR_TOTAL) type = 'Hybrid';
        results.push({
          date: dateStr,
          maximum: maxIso,
          type,
        });
        jd = r.maximum + 1;
      } catch {
        break;
      }
    }
    return results;
  }

  /**
   * Get next N lunar eclipses from a start date (global).
   * If endJd is set, only eclipses with maximum <= endJd are included.
   */
  getNextLunarEclipses(
    startJd: number,
    limit: number,
    endJd?: number,
  ): Array<{
    date: string;
    maximum: string;
    type: string;
    umbralMagnitude?: number;
    penumbralMagnitude?: number;
    sarosNumber?: number;
    sarosMember?: number;
  }> {
    const results: Array<{
      date: string;
      maximum: string;
      type: string;
      umbralMagnitude?: number;
      penumbralMagnitude?: number;
      sarosNumber?: number;
      sarosMember?: number;
    }> = [];
    let jd = startJd;
    const ifl = swisseph.SEFLG_SWIEPH;
    const ifltype = swisseph.SE_ECL_ALLTYPES_LUNAR;

    for (let i = 0; i < limit; i++) {
      try {
        const r = swisseph.swe_lun_eclipse_when(jd, ifl, ifltype, 0 as 0);
        if ('error' in r) break;
        if (endJd != null && r.maximum > endJd) break;
        const dateStr = this.jdToUtcDateString(r.maximum);
        const maxIso = this.jdToUtcIso(r.maximum);
        let type = 'Penumbral';
        if (r.rflag & swisseph.SE_ECL_TOTAL) type = 'Total';
        else if (r.rflag & swisseph.SE_ECL_PARTIAL) type = 'Partial';
        const how = swisseph.swe_lun_eclipse_how(
          r.maximum,
          ifl,
          0,
          0,
          0,
        );
        const umbralMagnitude =
          how && !('error' in how) ? how.umbralMagnitude : undefined;
        const penumbralMagnitude =
          how && !('error' in how) ? how.penumbralMagnitude : undefined;
        const sarosNumber = how && !('error' in how) ? how.sarosNumber : undefined;
        const sarosMember = how && !('error' in how) ? how.sarosMember : undefined;
        results.push({
          date: dateStr,
          maximum: maxIso,
          type,
          umbralMagnitude,
          penumbralMagnitude,
          sarosNumber,
          sarosMember,
        });
        jd = r.maximum + 1;
      } catch {
        break;
      }
    }
    return results;
  }

  /**
   * Get lunar eclipses within a Julian day range (inclusive by date).
   */
  getLunarEclipsesInRange(
    startJd: number,
    endJd: number,
    maxIterations: number = 2000,
  ): Array<{
    date: string;
    maximum: string;
    type: string;
    umbralMagnitude?: number;
    penumbralMagnitude?: number;
    sarosNumber?: number;
    sarosMember?: number;
  }> {
    const results: Array<{
      date: string;
      maximum: string;
      type: string;
      umbralMagnitude?: number;
      penumbralMagnitude?: number;
      sarosNumber?: number;
      sarosMember?: number;
    }> = [];
    let jd = startJd;
    const ifl = swisseph.SEFLG_SWIEPH;
    const ifltype = swisseph.SE_ECL_ALLTYPES_LUNAR;
    const endDateStr = this.jdToUtcDateString(endJd);

    for (let i = 0; i < maxIterations; i++) {
      try {
        const r = swisseph.swe_lun_eclipse_when(jd, ifl, ifltype, 0 as 0);
        if ('error' in r) break;
        const dateStr = this.jdToUtcDateString(r.maximum);
        if (dateStr > endDateStr) break;
        const maxIso = this.jdToUtcIso(r.maximum);
        let type = 'Penumbral';
        if (r.rflag & swisseph.SE_ECL_TOTAL) type = 'Total';
        else if (r.rflag & swisseph.SE_ECL_PARTIAL) type = 'Partial';
        const how = swisseph.swe_lun_eclipse_how(
          r.maximum,
          ifl,
          0,
          0,
          0,
        );
        const umbralMagnitude =
          how && !('error' in how) ? how.umbralMagnitude : undefined;
        const penumbralMagnitude =
          how && !('error' in how) ? how.penumbralMagnitude : undefined;
        const sarosNumber = how && !('error' in how) ? how.sarosNumber : undefined;
        const sarosMember = how && !('error' in how) ? how.sarosMember : undefined;
        results.push({
          date: dateStr,
          maximum: maxIso,
          type,
          umbralMagnitude,
          penumbralMagnitude,
          sarosNumber,
          sarosMember,
        });
        jd = r.maximum + 1;
      } catch {
        break;
      }
    }
    return results;
  }
}
