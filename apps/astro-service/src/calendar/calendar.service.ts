import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ProkeralaService } from '../common/services/prokerala.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prokeralaService: ProkeralaService) {}

  async getTodayCalendar(latitude: number, longitude: number) {
    try {
      const today = new Date();
      const datetime = today.toISOString();
      const dateString = datetime.split('T')[0];
      const coordinates = `${latitude},${longitude}`;

      // Use cached Prokerala service with response caching
      const panchangData = await this.prokeralaService.makeRequest<any>(
        '/astrology/panchang',
        {
          datetime,
          coordinates,
          ayanamsa: '1',
        },
        true, // Use cache
      );

      // Tithi and Nakshatra are arrays - get the current one
      const tithiArray = Array.isArray(panchangData.tithi) ? panchangData.tithi : [];
      const nakshatraArray = Array.isArray(panchangData.nakshatra) ? panchangData.nakshatra : [];
      
      // Get current tithi (first one in array, or find one that's active now)
      const currentTithi = tithiArray.length > 0 ? tithiArray[0] : {};
      const currentNakshatra = nakshatraArray.length > 0 ? nakshatraArray[0] : {};
      
      // Moon phase might be in a different structure - check for moonrise/moonset
      const moonPhase = panchangData.moon?.phase || panchangData.moon?.name || 
                       (panchangData.moonrise && panchangData.moonset ? 'Visible' : 'Unknown');

      const tithiName = currentTithi.name || 'Unknown';
      const nakshatraName = currentNakshatra.name || 'Unknown';

      const majorEvents: string[] = [];
      if (panchangData.auspicious_periods && panchangData.auspicious_periods.length > 0) {
        majorEvents.push('Auspicious periods available');
      }
      if (panchangData.inauspicious_periods && panchangData.inauspicious_periods.length > 0) {
        majorEvents.push('Inauspicious periods present');
      }

      return {
        moonPhase,
        tithi: tithiName,
        nakshatra: nakshatraName,
        majorPlanetaryEvents: majorEvents.length > 0 ? majorEvents : ['No major events'],
        date: dateString,
        source: 'Prokerala API',
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
}

