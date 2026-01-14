import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KundliService } from '../kundli/kundli.service';
import { KundliDto } from '../kundli/dto/kundli.dto';

@Injectable()
export class NatalChartService {
  private readonly logger = new Logger(NatalChartService.name);

  constructor(
    private readonly kundliService: KundliService,
    private readonly configService: ConfigService,
  ) {}

  async getNatalChart(dto: KundliDto) {
    try {
      const kundliData = await this.kundliService.getKundli(dto);

      const nakshatraDetails = kundliData.nakshatra_details || {};
      const chandraRasi = nakshatraDetails.chandra_rasi || {};
      const sooryaRasi = nakshatraDetails.soorya_rasi || {};
      const zodiac = nakshatraDetails.zodiac || {};

      // Prokerala kundli API doesn't return ascendant or individual planets in basic endpoint
      // We can only get Sun and Moon from nakshatra_details
      const planetSignList: Array<{ planet: string; sign: string }> = [];

      if (sooryaRasi.name) {
        planetSignList.push({
          planet: 'Sun',
          sign: sooryaRasi.name,
        });
      }

      if (chandraRasi.name) {
        planetSignList.push({
          planet: 'Moon',
          sign: chandraRasi.name,
        });
      }

      const sunSign = sooryaRasi.name || zodiac.name || 'Unknown';
      const moonSign = chandraRasi.name || 'Unknown';
      const ascendantName = null;

      return {
        sunSign,
        moonSign,
        ascendant: ascendantName,
        planetSignList,
        source: 'Prokerala API',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error generating natal chart: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to generate natal chart. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

