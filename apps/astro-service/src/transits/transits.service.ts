import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

/** Planets that go retrograde (exclude Sun, Moon – no retrograde). */
const RETROGRADE_PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

/** Major transit planets (slow-moving, sign changes are significant). */
const MAJOR_TRANSIT_PLANETS = ['Jupiter', 'Saturn'];

@Injectable()
export class TransitsService {
  private readonly logger = new Logger(TransitsService.name);

  constructor(
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  async getTodayTransits() {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const hour = today.getHours();
      const minute = today.getMinutes();

      const planets = await this.swissEphemerisService.calculatePlanetaryPositions(
        year,
        month,
        day,
        hour,
        minute,
        28.6139,
        77.209,
      );

      const currentPlanetPositions: Record<string, any> = {};
      const majorActiveTransits: Array<{
        planet: string;
        sign: string;
        description?: string;
      }> = [];

      planets.forEach((planet) => {
        currentPlanetPositions[planet.planet.toLowerCase()] = {
          name: planet.planet,
          sign: { name: planet.sign },
          degree: planet.signDegree,
        };

        majorActiveTransits.push({
          planet: planet.planet,
          sign: planet.sign,
        });
      });

      return {
        currentPlanetPositions,
        majorActiveTransits,
        date: new Date().toISOString().split('T')[0],
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error fetching transits: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to fetch transits. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get transits for a specific date (noon UTC). Same shape as getTodayTransits.
   */
  async getTransitsForDate(
    dateStr: string,
    latitude: number = 28.6139,
    longitude: number = 77.209,
  ) {
    const date = this.parseDate(dateStr);
    if (!date) {
      throw new HttpException(
        'Invalid date. Use YYYY-MM-DD.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const planets = await this.swissEphemerisService.calculatePlanetaryPositions(
      year,
      month,
      day,
      12,
      0,
      latitude,
      longitude,
    );

    const currentPlanetPositions: Record<string, any> = {};
    const majorActiveTransits: Array<{ planet: string; sign: string }> = [];

    planets.forEach((planet) => {
      currentPlanetPositions[planet.planet.toLowerCase()] = {
        name: planet.planet,
        sign: { name: planet.sign },
        degree: planet.signDegree,
      };
      majorActiveTransits.push({
        planet: planet.planet,
        sign: planet.sign,
      });
    });

    return {
      currentPlanetPositions,
      majorActiveTransits,
      date: dateStr,
      source: 'Swiss Ephemeris',
    };
  }

  /**
   * Get retrograde periods: when planets (Mercury, Venus, Mars, Jupiter, Saturn) are retrograde and for how long.
   */
  async getRetrogrades(
    fromDate: string,
    toDate: string,
    latitude: number = 28.6139,
    longitude: number = 77.209,
  ): Promise<{
    fromDate: string;
    toDate: string;
    retrogrades: Array<{
      planet: string;
      startDate: string;
      endDate: string;
      durationDays: number;
      description: string;
    }>;
  }> {
    const from = this.parseDate(fromDate);
    const to = this.parseDate(toDate);
    if (!from || !to || from > to) {
      throw new HttpException(
        'Invalid date range. Use YYYY-MM-DD with fromDate <= toDate.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const maxDays = 366 * 3;
    const daysDiff = Math.min(
      Math.floor((to.getTime() - from.getTime()) / 86400000),
      maxDays,
    );
    if (daysDiff < 0) {
      throw new HttpException('Date range too large.', HttpStatus.BAD_REQUEST);
    }

    const retrogrades: Array<{
      planet: string;
      startDate: string;
      endDate: string;
      durationDays: number;
      description: string;
    }> = [];

    for (const planetName of RETROGRADE_PLANETS) {
      let inRetrograde = false;
      let startDate: string | null = null;

      for (let d = 0; d <= daysDiff; d++) {
        const date = new Date(from);
        date.setDate(date.getDate() + d);
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const day = date.getDate();
        const dateStr = this.formatDate(y, m, day);

        const positions = await this.swissEphemerisService.calculatePlanetaryPositions(
          y,
          m,
          day,
          12,
          0,
          latitude,
          longitude,
        );
        const planet = positions.find((p) => p.planet === planetName);
        if (!planet) continue;
        const isRetro = planet.speed < 0;

        if (isRetro && !inRetrograde) {
          inRetrograde = true;
          startDate = dateStr;
        } else if (!isRetro && inRetrograde && startDate) {
          const prevDate = new Date(date);
          prevDate.setDate(prevDate.getDate() - 1);
          const endDate = this.formatDate(
            prevDate.getFullYear(),
            prevDate.getMonth() + 1,
            prevDate.getDate(),
          );
          const start = this.parseDate(startDate)!;
          const end = this.parseDate(endDate)!;
          const durationDays = Math.floor(
            (end.getTime() - start.getTime()) / 86400000,
          ) + 1;
          retrogrades.push({
            planet: planetName,
            startDate,
            endDate,
            durationDays,
            description: `${planetName} retrograde ${startDate} to ${endDate} (${durationDays} days)`,
          });
          inRetrograde = false;
          startDate = null;
        }
      }
      if (inRetrograde && startDate) {
        retrogrades.push({
          planet: planetName,
          startDate,
          endDate: toDate,
          durationDays: -1,
          description: `${planetName} retrograde from ${startDate} (ongoing at end of range)`,
        });
      }
    }

    return {
      fromDate,
      toDate,
      retrogrades: retrogrades.sort(
        (a, b) => a.startDate.localeCompare(b.startDate),
      ),
    };
  }

  /**
   * Get upcoming solar and lunar eclipses.
   */
  async getEclipses(
    fromDate: string,
    limit: number = 10,
  ): Promise<{
    fromDate: string;
    solar: Array<{
      date: string;
      maximum: string;
      type: string;
    }>;
    lunar: Array<{
      date: string;
      maximum: string;
      type: string;
      umbralMagnitude?: number;
      penumbralMagnitude?: number;
      sarosNumber?: number;
      sarosMember?: number;
    }>;
  }> {
    const from = this.parseDate(fromDate);
    if (!from) {
      throw new HttpException(
        'Invalid fromDate. Use YYYY-MM-DD.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const jd = this.swissEphemerisService.dateStringToJulianDay(fromDate);
    const solar = this.swissEphemerisService.getNextSolarEclipses(
      jd,
      Math.min(limit, 20),
    );
    const lunar = this.swissEphemerisService.getNextLunarEclipses(
      jd,
      Math.min(limit, 20),
    );
    return {
      fromDate: fromDate,
      solar,
      lunar,
    };
  }

  /**
   * Get major transits: when Jupiter, Saturn (and optionally other slow planets) change signs.
   */
  async getMajorTransits(
    fromDate: string,
    toDate: string,
    latitude: number = 28.6139,
    longitude: number = 77.209,
  ): Promise<{
    fromDate: string;
    toDate: string;
    transits: Array<{
      planet: string;
      fromSign: string;
      toSign: string;
      date: string;
      description: string;
    }>;
  }> {
    const from = this.parseDate(fromDate);
    const to = this.parseDate(toDate);
    if (!from || !to || from > to) {
      throw new HttpException(
        'Invalid date range. Use YYYY-MM-DD with fromDate <= toDate.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const maxDays = 366 * 12;
    const daysDiff = Math.min(
      Math.floor((to.getTime() - from.getTime()) / 86400000),
      maxDays,
    );

    const transits: Array<{
      planet: string;
      fromSign: string;
      toSign: string;
      date: string;
      description: string;
    }> = [];
    let prevSigns: Record<string, string> = {};

    // Seed prevSigns from the day before fromDate so we detect sign changes on the first day
    const dayBefore = new Date(from);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const py = dayBefore.getFullYear();
    const pm = dayBefore.getMonth() + 1;
    const pday = dayBefore.getDate();
    const prevPositions = await this.swissEphemerisService.calculatePlanetaryPositions(
      py,
      pm,
      pday,
      12,
      0,
      latitude,
      longitude,
    );
    for (const planetName of MAJOR_TRANSIT_PLANETS) {
      const planet = prevPositions.find((p) => p.planet === planetName);
      if (planet) prevSigns[planetName] = planet.sign;
    }

    for (let d = 0; d <= daysDiff; d++) {
      const date = new Date(from);
      date.setDate(date.getDate() + d);
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const day = date.getDate();
      const dateStr = this.formatDate(y, m, day);

      const positions = await this.swissEphemerisService.calculatePlanetaryPositions(
        y,
        m,
        day,
        12,
        0,
        latitude,
        longitude,
      );

      for (const planetName of MAJOR_TRANSIT_PLANETS) {
        const planet = positions.find((p) => p.planet === planetName);
        if (!planet) continue;
        const sign = planet.sign;
        const prev = prevSigns[planetName];
        if (prev !== undefined && prev !== sign) {
          transits.push({
            planet: planetName,
            fromSign: prev,
            toSign: sign,
            date: dateStr,
            description: `${planetName} enters ${sign} (from ${prev})`,
          });
        }
        prevSigns[planetName] = sign;
      }
    }

    return {
      fromDate,
      toDate,
      transits,
    };
  }

  private parseDate(s: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s?.trim());
    if (!match) return null;
    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return null;
    return date;
  }

  private formatDate(y: number, m: number, d: number): string {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
}
