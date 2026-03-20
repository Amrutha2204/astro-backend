import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BENEFICIAL_PLANETS,
  CHALLENGING_PLANETS,
} from '../common/constants/astrology.constants';
import { ChartType } from '../common/utils/coordinates.util';
import { NatalChartService } from '../natal-chart/natal-chart.service';
import { TransitsService } from '../transits/transits.service';
import { KundliDto } from '../kundli/dto/kundli.dto';

@Injectable()
export class HoroscopeRuleService {
  private readonly logger = new Logger(HoroscopeRuleService.name);

  constructor(
    private readonly natalChartService: NatalChartService,
    private readonly transitsService: TransitsService,
    private readonly configService: ConfigService,
  ) {}

  async getTodayHoroscope(dto: KundliDto) {
    return this.getHoroscopeForDate(dto, new Date().toISOString().split('T')[0]);
  }

  /** Get horoscope for a specific date (used for weekly so each day can differ). */
  async getHoroscopeForDate(dto: KundliDto, dateStr: string) {
    try {
      const lat = dto.latitude ?? 28.6139;
      const lng = dto.longitude ?? 77.209;
      const [natalChart, transits] = await Promise.all([
        this.natalChartService.getNatalChart(dto),
        this.transitsService.getTransitsForDate(dateStr, lat, lng),
      ]);

      const dayType = this.calculateDayType(natalChart, transits);
      const mainTheme = this.getMainTheme(dayType, natalChart, transits);
      const reason = this.getReason(natalChart, transits, dateStr);
      const { doAvoid, goodTime } = this.getDoAvoidAndGoodTime(dayType);

      return {
        dayType,
        mainTheme,
        reason,
        doAvoid,
        goodTime,
        date: dateStr,
        source: 'Rule-Based Logic',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error generating horoscope: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to generate horoscope. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculateDayType(
    natalChart: any,
    transits: any,
  ): 'Good' | 'Neutral' | 'Challenging' {
    const majorTransits = transits.majorActiveTransits || [];
    let score = 0;

    majorTransits.forEach((transit: any) => {
      const planet = (transit.planet || '').toString().toLowerCase();
      if ((BENEFICIAL_PLANETS as readonly string[]).includes(planet)) {
        score += 1;
      } else if ((CHALLENGING_PLANETS as readonly string[]).includes(planet)) {
        score -= 1;
      }
    });

    const moonTransit = majorTransits.find(
      (t: any) => (t.planet || '').toString().toLowerCase() === 'moon',
    );
    const moonSign = (moonTransit?.sign || '').toString().toLowerCase();
    const natalMoon = (natalChart.moonSign || '').toString().toLowerCase();
    if (moonSign && natalMoon) {
      const sameSign = moonSign === natalMoon;
      const friendlySigns: Record<string, string[]> = {
        aries: ['leo', 'sagittarius'],
        taurus: ['virgo', 'capricorn'],
        gemini: ['libra', 'aquarius'],
        cancer: ['scorpio', 'pisces'],
        leo: ['aries', 'sagittarius'],
        virgo: ['taurus', 'capricorn'],
        libra: ['gemini', 'aquarius'],
        scorpio: ['cancer', 'pisces'],
        sagittarius: ['aries', 'leo'],
        capricorn: ['taurus', 'virgo'],
        aquarius: ['gemini', 'libra'],
        pisces: ['cancer', 'scorpio'],
      };
      const friends = friendlySigns[natalMoon];
      if (sameSign) {
        score += 2;
      } else if (friends && friends.includes(moonSign)) {
        score += 1;
      }
    }

    if (score > 0) {
      return 'Good';
    } else if (score < 0) {
      return 'Challenging';
    }
    return 'Neutral';
  }

  private getMainTheme(
    dayType: string,
    natalChart: any,
    transits: any,
  ): string {
    const majorTransits = transits.majorActiveTransits || [];
    const moonTransit = majorTransits.find(
      (t: any) => (t.planet || '').toString().toLowerCase() === 'moon',
    );
    const moonInSign = moonTransit?.sign ? ` Moon in ${moonTransit.sign}.` : '';
    if (dayType === 'Good') {
      return `Focus on opportunities and growth.${moonInSign}`;
    } else if (dayType === 'Challenging') {
      return `Exercise caution and patience.${moonInSign}`;
    }
    return `Reflection and balance.${moonInSign}`;
  }

  private getReason(natalChart: any, transits: any, dateStr?: string): string {
    const majorTransits = transits.majorActiveTransits || [];
    const positions = majorTransits
      .map((t: any) => {
        if (!t.planet || !t.sign) return t.planet || '';
        const deg =
          typeof t.signDegree === 'number' && !Number.isNaN(t.signDegree)
            ? ` ${Number(t.signDegree).toFixed(1)}°`
            : '';
        return `${t.planet}${deg} in ${t.sign}`;
      })
      .filter(Boolean)
      .join(', ');

    const ascendantText = natalChart.ascendant
      ? `${natalChart.ascendant} Ascendant`
      : 'your birth chart';

    const dayLabel = dateStr ? `Transits for ${dateStr}` : "Today's transits";
    return `${dayLabel}: ${positions || 'planetary positions'} influence your ${natalChart.moonSign} Moon sign and ${ascendantText}`;
  }

  /** Do / Avoid and Good time — directive lines for India MVP. */
  private getDoAvoidAndGoodTime(dayType: string): {
    doAvoid: string;
    goodTime: string;
  } {
    if (dayType === 'Good') {
      return {
        doAvoid: 'Do: Take important decisions, start new work, network. Avoid: Overcommitting.',
        goodTime: 'Good time: Morning and late afternoon for key tasks.',
      };
    }
    if (dayType === 'Challenging') {
      return {
        doAvoid: 'Do: Rest, reflect, finish pending tasks. Avoid: Big commitments, arguments.',
        goodTime: 'Not recommended: Postpone major decisions if possible.',
      };
    }
    return {
      doAvoid: 'Do: Steady progress, routine work. Avoid: Rush or forcing outcomes.',
      goodTime: 'Neutral day: Midday generally favourable for routine matters.',
    };
  }
}

