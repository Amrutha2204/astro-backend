import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { KundliDto } from '../kundli/dto/kundli.dto';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';
import {
  parseBirthDateTime,
  getTimezoneOffsetFromLongitude,
} from '../common/utils/birth-time.util';

@Injectable()
export class NatalChartService {
  private readonly logger = new Logger(NatalChartService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  async getNatalChart(dto: KundliDto) {
    try {
      const { year, month, day, hour, minute, second } = parseBirthDateTime(
        dto.dob,
        dto.birthTime,
      );
      const timezoneOffset = getTimezoneOffsetFromLongitude(dto.longitude);
      const julianDayUt = this.swissEphemerisService.localTimeToJulianDayUt(
        year,
        month,
        day,
        hour,
        minute,
        second,
        timezoneOffset,
      );

      const vedicChart =
        await this.astrologyEngineService.calculateVedicChartFromJulianDay(
          julianDayUt,
          dto.latitude,
          dto.longitude,
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
