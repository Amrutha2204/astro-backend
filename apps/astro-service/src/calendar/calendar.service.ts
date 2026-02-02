import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BENEFICIAL_SIGNS, NAKSHATRAS } from '../common/constants/astrology.constants';
import { FESTIVALS_BY_MONTH_DAY, type FestivalEntry } from '../common/constants/festivals.constants';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  async getTodayCalendar(latitude: number, longitude: number) {
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
        latitude,
        longitude,
      );

      const moonPlanet = planets.find((p) => p.planet === 'Moon');
      const sunPlanet = planets.find((p) => p.planet === 'Sun');

      const moonPhase = this.calculateMoonPhase(moonPlanet, sunPlanet);
      const nakshatra = this.getNakshatraFromLongitude(moonPlanet?.longitude || 0);

      const majorEvents: string[] = [];
      if (this.isAuspiciousDay(planets)) {
        majorEvents.push('Auspicious day');
      }

      return {
        moonPhase,
        tithi: this.calculateTithi(moonPlanet, sunPlanet),
        nakshatra,
        majorPlanetaryEvents: majorEvents.length > 0 ? majorEvents : ['No major events'],
        date: new Date().toISOString().split('T')[0],
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error fetching calendar: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to fetch calendar. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculateMoonPhase(moonPlanet: any, sunPlanet: any): string {
    if (!moonPlanet || !sunPlanet) return 'Unknown';

    const moonLongitude = moonPlanet.longitude;
    const sunLongitude = sunPlanet.longitude;
    let elongation = moonLongitude - sunLongitude;

    if (elongation < 0) elongation += 360;

    if (elongation < 45) return 'New Moon';
    if (elongation < 135) return 'Waxing Crescent';
    if (elongation < 225) return 'First Quarter';
    if (elongation < 315) return 'Waxing Gibbous';
    if (elongation < 360) return 'Full Moon';
    return 'Waning Gibbous';
  }

  private calculateTithi(moonPlanet: any, sunPlanet: any): string {
    if (!moonPlanet || !sunPlanet) return 'Unknown';

    const moonLongitude = moonPlanet.longitude;
    const sunLongitude = sunPlanet.longitude;
    let elongation = moonLongitude - sunLongitude;

    if (elongation < 0) elongation += 360;

    const tithiNumber = Math.floor(elongation / 12) + 1;
    const paksha = tithiNumber <= 15 ? 'Shukla' : 'Krishna';
    const tithiDay = tithiNumber <= 15 ? tithiNumber : tithiNumber - 15;

    return `${paksha} ${tithiDay}`;
  }

  private getNakshatraFromLongitude(longitude: number): string {
    const nakshatraIndex = Math.floor(longitude / (360 / 27));
    return NAKSHATRAS[nakshatraIndex % 27];
  }

  private isAuspiciousDay(planets: any[]): boolean {
    const jupiter = planets.find((p) => p.planet === 'Jupiter');
    const venus = planets.find((p) => p.planet === 'Venus');
    
    if (!jupiter || !venus) return false;

    const jupiterSign = jupiter.sign;
    const venusSign = venus.sign;
    return (BENEFICIAL_SIGNS as readonly string[]).includes(jupiterSign) || (BENEFICIAL_SIGNS as readonly string[]).includes(venusSign);
  }

  /** List festivals for a given date (YYYY-MM-DD) or for a whole month (YYYY-MM). */
  getFestivals(dateOrMonth: string): { dateOrMonth: string; festivals: FestivalEntry[] } {
    const trimmed = dateOrMonth.trim();
    const isMonth = /^\d{4}-\d{2}$/.test(trimmed);
    const isDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);

    if (isDate) {
      const [y, m, d] = trimmed.split('-').map(Number);
      const festivals = FESTIVALS_BY_MONTH_DAY.filter(
        (f) => f.month === m && f.day === d,
      );
      return { dateOrMonth: trimmed, festivals };
    }

    if (isMonth) {
      const [, m] = trimmed.split('-').map(Number);
      const festivals = FESTIVALS_BY_MONTH_DAY.filter((f) => f.month === m);
      return { dateOrMonth: trimmed, festivals };
    }

    return { dateOrMonth: trimmed, festivals: [] };
  }

  /**
   * Get muhurat (good times) for a given day: Abhijit Muhurat and day window.
   * Uses sunrise, sunset, and solar noon from Swiss Ephemeris.
   */
  async getMuhurat(
    date: string,
    latitude: number,
    longitude: number,
  ): Promise<{
    date: string;
    sunrise: string;
    sunset: string;
    solarNoon: string;
    abhijitMuhurat: { start: string; end: string };
    /** Good periods for starting important work (UTC times; client can convert to local). */
    goodPeriods: { name: string; start: string; end: string }[];
  }> {
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) {
      throw new HttpException('Invalid date. Use YYYY-MM-DD.', HttpStatus.BAD_REQUEST);
    }

    const riseSet = this.swissEphemerisService.getSunRiseSetTransit(
      y,
      m,
      d,
      longitude,
      latitude,
    );

    if ('error' in riseSet) {
      this.logger.warn(`Muhurat rise/set error: ${riseSet.error}`);
      throw new HttpException(
        'Could not compute sun times for this location/date.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const [transitH, transitM] = riseSet.transit.split(':').map(Number);
    const transitMinutes = transitH * 60 + transitM;
    const abhijitStart = transitMinutes - 24;
    const abhijitEnd = transitMinutes + 24;
    const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
    const minsToTime = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = Math.floor(mins % 60);
      return `${pad(h)}:${pad(m)}`;
    };

    return {
      date,
      sunrise: riseSet.sunrise,
      sunset: riseSet.sunset,
      solarNoon: riseSet.transit,
      abhijitMuhurat: {
        start: minsToTime(abhijitStart),
        end: minsToTime(abhijitEnd),
      },
      goodPeriods: [
        { name: 'Sunrise period', start: riseSet.sunrise, end: minsToTime(transitMinutes - 60) },
        { name: 'Abhijit Muhurat', start: minsToTime(abhijitStart), end: minsToTime(abhijitEnd) },
        { name: 'Afternoon period', start: minsToTime(abhijitEnd), end: riseSet.sunset },
      ],
    };
  }

  /**
   * Check if a given date is auspicious for important work (based on Jupiter/Venus in beneficial signs).
   */
  async getAuspiciousDayCheck(
    date: string,
    latitude: number,
    longitude: number,
  ): Promise<{
    date: string;
    isAuspicious: boolean;
    reason: string;
    tithi?: string;
    nakshatra?: string;
  }> {
    try {
      const [y, m, d] = date.split('-').map(Number);
      if (!y || !m || !d) {
        throw new HttpException('Invalid date. Use YYYY-MM-DD.', HttpStatus.BAD_REQUEST);
      }

      const planets = await this.swissEphemerisService.calculatePlanetaryPositions(
        y,
        m,
        d,
        12,
        0,
        latitude,
        longitude,
      );
      const moonPlanet = planets.find((p) => p.planet === 'Moon');
      const sunPlanet = planets.find((p) => p.planet === 'Sun');
      const tithi = this.calculateTithi(moonPlanet, sunPlanet);
      const nakshatra = this.getNakshatraFromLongitude(moonPlanet?.longitude || 0);

      const auspicious = this.isAuspiciousDay(planets);
      const jupiter = planets.find((p) => p.planet === 'Jupiter');
      const venus = planets.find((p) => p.planet === 'Venus');
      let reason: string;
      if (auspicious) {
        const factors: string[] = [];
        if (jupiter && (BENEFICIAL_SIGNS as readonly string[]).includes(jupiter.sign)) {
          factors.push(`Jupiter in ${jupiter.sign}`);
        }
        if (venus && (BENEFICIAL_SIGNS as readonly string[]).includes(venus.sign)) {
          factors.push(`Venus in ${venus.sign}`);
        }
        reason = factors.length ? `Considered auspicious: ${factors.join('; ')}.` : 'Planetary positions favour important work.';
      } else {
        reason = 'Jupiter and Venus are not in traditionally beneficial signs today. You may still choose a good muhurat within the day.';
      }

      return {
        date,
        isAuspicious: auspicious,
        reason,
        tithi,
        nakshatra,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error checking auspicious day: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to check auspicious day.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Get calendar (moon phase, tithi, nakshatra, auspicious) for a specific date. */
  async getCalendarForDate(
    date: string,
    latitude: number,
    longitude: number,
  ) {
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) {
      throw new HttpException('Invalid date. Use YYYY-MM-DD.', HttpStatus.BAD_REQUEST);
    }

    const planets = await this.swissEphemerisService.calculatePlanetaryPositions(
      y,
      m,
      d,
      12,
      0,
      latitude,
      longitude,
    );
    const moonPlanet = planets.find((p) => p.planet === 'Moon');
    const sunPlanet = planets.find((p) => p.planet === 'Sun');
    const majorEvents: string[] = [];
    if (this.isAuspiciousDay(planets)) {
      majorEvents.push('Auspicious day');
    }
    return {
      moonPhase: this.calculateMoonPhase(moonPlanet, sunPlanet),
      tithi: this.calculateTithi(moonPlanet, sunPlanet),
      nakshatra: this.getNakshatraFromLongitude(moonPlanet?.longitude || 0),
      majorPlanetaryEvents: majorEvents.length > 0 ? majorEvents : ['No major events'],
      date,
      source: 'Swiss Ephemeris',
    };
  }
}
