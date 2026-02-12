import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { KundliDto } from './dto/kundli.dto';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';

@Injectable()
export class KundliService {
  private readonly logger = new Logger(KundliService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
  ) {}

  async getKundli(dto: KundliDto) {
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

      const moonPlanet = vedicChart.planets.find((p) => p.planet === 'Moon');
      const sunPlanet = vedicChart.planets.find((p) => p.planet === 'Sun');

      return {
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
        })),
        houses: vedicChart.houses.map((h) => ({
          house: h.house,
          sign: h.sign,
          degree: h.degree,
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
      const dobDate = new Date(`${dto.dob}T${dto.birthTime}`);
      const year = dobDate.getFullYear();
      const month = dobDate.getMonth() + 1;
      const day = dobDate.getDate();
      const hour = dobDate.getHours();
      const minute = dobDate.getMinutes();

      const westernChart = await this.astrologyEngineService.calculateWesternChart({
        year,
        month,
        day,
        hour,
        minute,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });

      const moonPlanet = westernChart.planets?.find((p: any) => p.planet === 'Moon');
      const sunPlanet = westernChart.planets?.find((p: any) => p.planet === 'Sun');
      const ascendantSign = westernChart.ascendant?.sign || 'Unknown';
      const degree = (p: any) => p.signDegree ?? p.degree ?? 0;

      return {
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
        })),
        houses: (westernChart.houses || []).map((h: any) => ({
          house: h.house,
          sign: h.sign,
          degree: h.signDegree ?? h.degree ?? 0,
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
