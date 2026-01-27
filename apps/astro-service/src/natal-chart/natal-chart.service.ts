import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { KundliDto } from '../kundli/dto/kundli.dto';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';

@Injectable()
export class NatalChartService {
  private readonly logger = new Logger(NatalChartService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
  ) {}

  async getNatalChart(dto: KundliDto) {
    try {
      const dobDate = new Date(`${dto.dob}T${dto.birthTime}`);
      const year = dobDate.getFullYear();
      const month = dobDate.getMonth() + 1;
      const day = dobDate.getDate();
      const hour = dobDate.getHours();
      const minute = dobDate.getMinutes();

      const vedicChart = await this.astrologyEngineService.calculateVedicChart(
        {
          year,
          month,
          day,
          hour,
          minute,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      );

      const planetSignList = vedicChart.planets.map((planet) => ({
        planet: planet.planet,
        sign: planet.sign,
      }));

      return {
        sunSign: vedicChart.sunSign.sign,
        moonSign: vedicChart.moonSign.sign,
        ascendant: vedicChart.lagna.sign,
        planetSignList,
        source: 'Swiss Ephemeris',
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
