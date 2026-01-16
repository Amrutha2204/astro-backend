import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
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
    const nakshatras = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
    ];

    const nakshatraIndex = Math.floor(longitude / (360 / 27));
    return nakshatras[nakshatraIndex % 27];
  }

  private isAuspiciousDay(planets: any[]): boolean {
    const jupiter = planets.find((p) => p.planet === 'Jupiter');
    const venus = planets.find((p) => p.planet === 'Venus');
    
    if (!jupiter || !venus) return false;

    const jupiterSign = jupiter.sign;
    const venusSign = venus.sign;

    const beneficialSigns = ['Cancer', 'Leo', 'Sagittarius', 'Pisces'];
    return beneficialSigns.includes(jupiterSign) || beneficialSigns.includes(venusSign);
  }
}
