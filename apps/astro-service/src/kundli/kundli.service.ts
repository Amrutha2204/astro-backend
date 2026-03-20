import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { KundliDto } from './dto/kundli.dto';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';
import { DIVISIONAL_CHARTS, HOUSE_MEANINGS, HOUSE_MEANINGS_DETAIL } from '../common/constants/astrology.constants';
import {
  parseBirthDateTime,
  getTimezoneOffsetFromLongitude,
} from '../common/utils/birth-time.util';

@Injectable()
export class KundliService {
  private readonly logger = new Logger(KundliService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  async getKundli(dto: KundliDto) {
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

      let vedicChart =
        await this.astrologyEngineService.calculateVedicChartFromJulianDay(
          julianDayUt,
          dto.latitude,
          dto.longitude,
        );

      let chartLabel = 'Lagna (D-1)';
      const chartKey = (dto.chart || 'lagna').toLowerCase();
      const divisional = DIVISIONAL_CHARTS[chartKey];
      if (divisional && divisional.divisor > 1) {
        vedicChart = this.astrologyEngineService.toDivisionalChart(vedicChart, divisional.divisor);
        chartLabel = divisional.label;
      } else if (chartKey && DIVISIONAL_CHARTS[chartKey]) {
        chartLabel = DIVISIONAL_CHARTS[chartKey].label;
      }

      const moonPlanet = vedicChart.planets.find((p) => p.planet === 'Moon');
      const sunPlanet = vedicChart.planets.find((p) => p.planet === 'Sun');

      return {
        chart: chartKey,
        chartLabel,
        lagna: vedicChart.lagna.sign,
        moonSign: vedicChart.moonSign.sign,
        sunSign: vedicChart.sunSign.sign,
        nakshatra: moonPlanet?.nakshatra || 'Unknown',
        pada: moonPlanet?.pada || 1,
        chandraRasi: vedicChart.moonSign.sign,
        sooryaRasi: vedicChart.sunSign.sign,
        planetaryPositions: vedicChart.planets.map((p) => ({
          planet: p.planet,
          sign: p.sign,
          degree: p.degree,
          nakshatra: p.nakshatra,
          pada: p.pada,
          retrograde: typeof p.speed === 'number' && p.speed < 0,
        })),
        houses: vedicChart.houses.map((h) => ({
          house: h.house,
          sign: h.sign,
          degree: h.degree,
          meaning: HOUSE_MEANINGS[h.house] ?? '',
          meaningDetail: HOUSE_MEANINGS_DETAIL[h.house] ?? '',
        })),
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error fetching kundli: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to fetch kundli. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Western (tropical) chart in same shape as Vedic for frontend display. */
  async getWesternKundli(dto: KundliDto) {
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

      const westernChart =
        await this.astrologyEngineService.calculateWesternChartFromJulianDay(
          julianDayUt,
          dto.latitude,
          dto.longitude,
        );

      const moonPlanet = westernChart.planets?.find((p: any) => p.planet === 'Moon');
      const sunPlanet = westernChart.planets?.find((p: any) => p.planet === 'Sun');
      const ascendantSign = westernChart.ascendant?.sign || 'Unknown';
      const degree = (p: any) => p.signDegree ?? p.degree ?? 0;

      return {
        chart: 'western',
        chartLabel: 'Western (Tropical)',
        lagna: ascendantSign,
        moonSign: moonPlanet?.sign || 'Unknown',
        sunSign: sunPlanet?.sign || 'Unknown',
        nakshatra: '—',
        pada: 0,
        chandraRasi: moonPlanet?.sign || 'Unknown',
        sooryaRasi: sunPlanet?.sign || 'Unknown',
        planetaryPositions: (westernChart.planets || []).map((p: any) => ({
          planet: p.planet,
          sign: p.sign,
          degree: degree(p),
          nakshatra: undefined,
          pada: undefined,
          retrograde: typeof p.speed === 'number' && p.speed < 0,
        })),
        houses: (westernChart.houses || []).map((h: any) => ({
          house: h.house,
          sign: h.sign,
          degree: h.signDegree ?? h.degree ?? 0,
          meaning: HOUSE_MEANINGS[h.house] ?? '',
        })),
        source: 'Swiss Ephemeris (Western)',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error fetching Western kundli: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to fetch Western chart. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
