import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

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
}
