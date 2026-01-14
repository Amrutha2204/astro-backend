import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ProkeralaService } from '../common/services/prokerala.service';

@Injectable()
export class TransitsService {
  private readonly logger = new Logger(TransitsService.name);

  constructor(private readonly prokeralaService: ProkeralaService) {}

  async getTodayTransits() {
    try {
      const today = new Date();
      const datetime = today.toISOString();

      // Use cached Prokerala service with response caching
      const kundliData = await this.prokeralaService.makeRequest<any>(
        '/astrology/kundli',
        {
          datetime,
          coordinates: '28.6139,77.209',
          ayanamsa: '1',
          chart_type: 'north-indian',
        },
        true, // Use cache
      );
      
      // Prokerala kundli API doesn't return individual planets, but we can get Sun/Moon from nakshatra_details
      const nakshatraDetails = kundliData.nakshatra_details || {};
      const majorTransits: Array<{ planet: string; sign: string; description?: string }> = [];

      // Get Sun and Moon positions from nakshatra_details
      if (nakshatraDetails.soorya_rasi) {
        majorTransits.push({
          planet: 'Sun',
          sign: nakshatraDetails.soorya_rasi.name || 'Unknown',
        });
      }
      
      if (nakshatraDetails.chandra_rasi) {
        majorTransits.push({
          planet: 'Moon',
          sign: nakshatraDetails.chandra_rasi.name || 'Unknown',
        });
      }
      
      // Note: Prokerala basic kundli endpoint doesn't return all planets
      // For full planetary positions, would need advanced endpoint
      const planets = {
        sun: nakshatraDetails.soorya_rasi ? { name: 'Sun', sign: { name: nakshatraDetails.soorya_rasi.name } } : null,
        moon: nakshatraDetails.chandra_rasi ? { name: 'Moon', sign: { name: nakshatraDetails.chandra_rasi.name } } : null,
      };

      return {
        currentPlanetPositions: planets,
        majorActiveTransits: majorTransits,
        date: new Date().toISOString().split('T')[0],
        source: 'Prokerala API',
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

