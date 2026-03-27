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
      const jdNoonUt = this.swissEphemerisService.localTimeToJulianDayUt(
        year, month, day, 12, 0, 0, 0,
      );
      const moonSidereal = moonPlanet?.longitude != null
        ? this.swissEphemerisService.convertToSidereal(moonPlanet.longitude, jdNoonUt)
        : 0;
      const nakshatra = this.getNakshatraFromLongitude(moonSidereal);
      const { tithi, paksha } = this.calculateTithiAndPaksha(moonPlanet, sunPlanet);

      const dateStr = new Date().toISOString().split('T')[0];
      const sunRiseSet = this.swissEphemerisService.getSunRiseSetTransit(
        year, month, day, longitude, latitude,
      );
      const moonRiseSet = this.swissEphemerisService.getMoonRiseSet(
        year, month, day, longitude, latitude,
      );

      const majorEvents: string[] = [];
      if (this.isAuspiciousDay(planets)) {
        majorEvents.push('Auspicious day');
      }

      const out: Record<string, any> = {
        moonPhase,
        tithi,
        paksha,
        nakshatra,
        ritu: this.getRituFromDate(year, month, day),
        hinduMonth: this.getHinduMonthFromDate(year, month, day),
        majorPlanetaryEvents: majorEvents.length > 0 ? majorEvents : ['No major events'],
        date: dateStr,
        source: 'Swiss Ephemeris',
      };

      if (sunRiseSet && !('error' in sunRiseSet)) {
        out.sunrise = this.utcTimeToLocal(sunRiseSet.sunrise, longitude);
        out.sunset = this.utcTimeToLocal(sunRiseSet.sunset, longitude);
      }
      if (moonRiseSet && !('error' in moonRiseSet)) {
        out.moonRise = this.utcTimeToLocal(moonRiseSet.moonRise, longitude);
        out.moonSet = this.utcTimeToLocal(moonRiseSet.moonSet, longitude);
      }

      return out;
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

  /**
   * Lunar phase from elongation (Moon–Sun longitude). Astronomically correct 8-phase scheme.
   * Elongation 0° = New, 90° = First Quarter, 180° = Full, 270° = Last Quarter.
   */
  private calculateMoonPhase(moonPlanet: any, sunPlanet: any): string {
    if (!moonPlanet || !sunPlanet) return 'Unknown';

    const moonLongitude = moonPlanet.longitude;
    const sunLongitude = sunPlanet.longitude;
    let elongation = moonLongitude - sunLongitude;
    if (elongation < 0) elongation += 360;

    if (elongation < 45) return 'New Moon';
    if (elongation < 90) return 'Waxing Crescent';
    if (elongation < 135) return 'First Quarter';
    if (elongation < 180) return 'Waxing Gibbous';
    if (elongation < 225) return 'Full Moon';
    if (elongation < 270) return 'Waning Gibbous';
    if (elongation < 315) return 'Last Quarter';
    return 'Waning Crescent';
  }

  private calculateTithi(moonPlanet: any, sunPlanet: any): string {
    const { tithi } = this.calculateTithiAndPaksha(moonPlanet, sunPlanet);
    return tithi;
  }

  /** Returns tithi string and paksha (Shukla/Krishna) for calendar response. */
  private calculateTithiAndPaksha(moonPlanet: any, sunPlanet: any): { tithi: string; paksha: string } {
    if (!moonPlanet || !sunPlanet) return { tithi: 'Unknown', paksha: 'Unknown' };

    const moonLongitude = moonPlanet.longitude;
    const sunLongitude = sunPlanet.longitude;
    let elongation = moonLongitude - sunLongitude;

    if (elongation < 0) elongation += 360;

    const tithiNumber = Math.floor(elongation / 12) + 1;
    const paksha = tithiNumber <= 15 ? 'Shukla' : 'Krishna';
    const tithiDay = tithiNumber <= 15 ? tithiNumber : tithiNumber - 15;
    const tithi = `${paksha} ${tithiDay}`;

    return { tithi, paksha };
  }

  /** Ritu (season) by solar month (1–12). */
  private getRituFromDate(year: number, month: number, _day: number): string {
    const RITU_BY_MONTH: Record<number, string> = {
      1: 'Shishir', 2: 'Shishir', 3: 'Vasant', 4: 'Vasant', 5: 'Grishma', 6: 'Grishma',
      7: 'Varsha', 8: 'Varsha', 9: 'Sharad', 10: 'Sharad', 11: 'Hemant', 12: 'Hemant',
    };
    return RITU_BY_MONTH[month] ?? 'Unknown';
  }

  /** Hindu solar month name by solar month (1–12). */
  private getHinduMonthFromDate(year: number, month: number, _day: number): string {
    const HINDU_MONTH: Record<number, string> = {
      1: 'Magha', 2: 'Phalguna', 3: 'Chaitra', 4: 'Vaisakha', 5: 'Jyeshtha', 6: 'Ashadha',
      7: 'Sravana', 8: 'Bhadrapada', 9: 'Ashwin', 10: 'Kartika', 11: 'Margashirsha', 12: 'Pausha',
    };
    return HINDU_MONTH[month] ?? 'Unknown';
  }

  private getNakshatraFromLongitude(longitude: number): string {
    const nakshatraIndex = Math.floor(longitude / (360 / 27));
    return NAKSHATRAS[nakshatraIndex % 27];
  }

  /** Convert UTC time "HH:mm" to local time at longitude (e.g. for sunrise/sunset display). */
  private utcTimeToLocal(utcHHmm: string, longitude: number): string {
    const [h = 0, m = 0] = utcHHmm.split(':').map(Number);
    const utcMins = h * 60 + m;
    const offsetHours = longitude / 15;
    let localMins = utcMins + Math.round(offsetHours * 60);
    if (localMins < 0) localMins += 24 * 60;
    if (localMins >= 24 * 60) localMins %= 24 * 60;
    const lh = Math.floor(localMins / 60) % 24;
    const lm = Math.floor(localMins % 60);
    return `${String(lh).padStart(2, '0')}:${String(lm).padStart(2, '0')}`;
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
      sunrise: this.utcTimeToLocal(riseSet.sunrise, longitude),
      sunset: this.utcTimeToLocal(riseSet.sunset, longitude),
      solarNoon: this.utcTimeToLocal(riseSet.transit, longitude),
      abhijitMuhurat: {
        start: this.utcTimeToLocal(minsToTime(abhijitStart), longitude),
        end: this.utcTimeToLocal(minsToTime(abhijitEnd), longitude),
      },
      goodPeriods: [
        { name: 'Sunrise period', start: this.utcTimeToLocal(riseSet.sunrise, longitude), end: this.utcTimeToLocal(minsToTime(transitMinutes - 60), longitude) },
        { name: 'Abhijit Muhurat', start: this.utcTimeToLocal(minsToTime(abhijitStart), longitude), end: this.utcTimeToLocal(minsToTime(abhijitEnd), longitude) },
        { name: 'Afternoon period', start: this.utcTimeToLocal(minsToTime(abhijitEnd), longitude), end: this.utcTimeToLocal(riseSet.sunset, longitude) },
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
    source?: string;
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
        source: 'Swiss Ephemeris',
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

  /**
   * Get Rahu Kaal and Yamagandam (inauspicious periods) for a given day.
   * Day is divided into 8 equal parts from sunrise to sunset; weekday determines which part is Rahu Kaal / Yamagandam.
   * Times returned in same format as sunrise/sunset (UTC).
   */
  async getRahuKaalYamagandam(
    date: string,
    latitude: number,
    longitude: number,
  ): Promise<{
    date: string;
    sunrise: string;
    sunset: string;
    rahuKaal: { start: string; end: string; note: string };
    yamagandam: { start: string; end: string; note: string };
    source: string;
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
      this.logger.warn(`Rahu Kaal rise/set error: ${riseSet.error}`);
      throw new HttpException(
        'Could not compute sun times for this location/date.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const timeToMinutes = (t: string): number => {
      const parts = t.split(':').map(Number);
      const h = parts[0] ?? 0;
      const min = parts[1] ?? 0;
      return h * 60 + min;
    };

    const minsToTime = (mins: number): string => {
      const total = Math.round(mins);
      const h = Math.floor(total / 60) % 24;
      const min = Math.floor(total % 60);
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    };

    const sunriseMins = timeToMinutes(riseSet.sunrise);
    const sunsetMins = timeToMinutes(riseSet.sunset);
    let dayLengthMins = sunsetMins - sunriseMins;
    if (dayLengthMins <= 0) dayLengthMins += 24 * 60;
    const periodMins = dayLengthMins / 8;

    const weekday = new Date(y, m - 1, d).getDay();
    const rahuKaalPeriod = [2, 7, 3, 6, 5, 4, 8][weekday];
    const yamagandamPeriod = [1, 2, 3, 4, 5, 6, 7][weekday];

    const periodStart = (periodIndex: number) =>
      sunriseMins + (periodIndex - 1) * periodMins;
    const periodEnd = (periodIndex: number) =>
      sunriseMins + periodIndex * periodMins;

    return {
      date,
      sunrise: this.utcTimeToLocal(riseSet.sunrise, longitude),
      sunset: this.utcTimeToLocal(riseSet.sunset, longitude),
      rahuKaal: {
        start: this.utcTimeToLocal(minsToTime(periodStart(rahuKaalPeriod)), longitude),
        end: this.utcTimeToLocal(minsToTime(periodEnd(rahuKaalPeriod)), longitude),
        note: 'Considered inauspicious for starting important work. Traditional practice: avoid new ventures during this period.',
      },
      yamagandam: {
        start: this.utcTimeToLocal(minsToTime(periodStart(yamagandamPeriod)), longitude),
        end: this.utcTimeToLocal(minsToTime(periodEnd(yamagandamPeriod)), longitude),
        note: 'Inauspicious period (Yama Ghantam). Often avoided for important undertakings.',
      },
      source: 'Swiss Ephemeris',
    };
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
    const { tithi, paksha } = this.calculateTithiAndPaksha(moonPlanet, sunPlanet);
    const jdNoonUt = this.swissEphemerisService.localTimeToJulianDayUt(y, m, d, 12, 0, 0, 0);
    const moonSidereal = moonPlanet?.longitude != null
      ? this.swissEphemerisService.convertToSidereal(moonPlanet.longitude, jdNoonUt)
      : 0;
    const sunRiseSet = this.swissEphemerisService.getSunRiseSetTransit(
      y, m, d, longitude, latitude,
    );
    const moonRiseSet = this.swissEphemerisService.getMoonRiseSet(
      y, m, d, longitude, latitude,
    );

    const out: Record<string, any> = {
      moonPhase: this.calculateMoonPhase(moonPlanet, sunPlanet),
      tithi,
      paksha,
      nakshatra: this.getNakshatraFromLongitude(moonSidereal),
      ritu: this.getRituFromDate(y, m, d),
      hinduMonth: this.getHinduMonthFromDate(y, m, d),
      majorPlanetaryEvents: majorEvents.length > 0 ? majorEvents : ['No major events'],
      date,
      source: 'Swiss Ephemeris',
    };
    if (sunRiseSet && !('error' in sunRiseSet)) {
      out.sunrise = this.utcTimeToLocal(sunRiseSet.sunrise, longitude);
      out.sunset = this.utcTimeToLocal(sunRiseSet.sunset, longitude);
    }
    if (moonRiseSet && !('error' in moonRiseSet)) {
      out.moonRise = this.utcTimeToLocal(moonRiseSet.moonRise, longitude);
      out.moonSet = this.utcTimeToLocal(moonRiseSet.moonSet, longitude);
    }
    return out;
  }
}
