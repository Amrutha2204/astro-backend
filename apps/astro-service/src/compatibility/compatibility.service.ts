import { Injectable, Logger } from '@nestjs/common';
import {
  NADI_GROUPS,
  NAKSHATRAS,
  SIGN_NUMBERS,
} from '../common/constants/astrology.constants';
import {
  BAD_TARAS,
  COMPATIBLE_YONI_PAIRS,
  GANA_MAP,
  GOOD_TARAS,
  SIGN_GROUPS,
  VARNA_MAP,
  VASHYA_GROUPS,
  YONI_MAP,
} from '../common/constants/compatibility.constants';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { DoshaService } from '../dosha/dosha.service';
import type { CompatibilityResult, GunaMilanResult } from './interfaces/compatibility.interface';

export type { CompatibilityResult, GunaMilanResult } from './interfaces/compatibility.interface';

@Injectable()
export class CompatibilityService {
  private readonly logger = new Logger(CompatibilityService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
    private readonly doshaService: DoshaService,
  ) {}

  async calculateGunaMilan(
    chart1: any,
    chart2: any,
  ): Promise<GunaMilanResult> {
    try {
      if (!chart1 || !chart2) {
        throw new Error('Chart data is missing. Both partner1 and partner2 are required.');
      }

      if (!chart1.year || !chart1.month || !chart1.day) {
        throw new Error('Partner1 birth details incomplete. Year, month, and day are required.');
      }

      if (!chart2.year || !chart2.month || !chart2.day) {
        throw new Error('Partner2 birth details incomplete. Year, month, and day are required.');
      }

      const vedicChart1 = await this.astrologyEngineService.calculateVedicChart({
        year: chart1.year,
        month: chart1.month,
        day: chart1.day,
        hour: chart1.hour || 12,
        minute: chart1.minute || 0,
        latitude: chart1.latitude,
        longitude: chart1.longitude,
      });

      const vedicChart2 = await this.astrologyEngineService.calculateVedicChart({
        year: chart2.year,
        month: chart2.month,
        day: chart2.day,
        hour: chart2.hour || 12,
        minute: chart2.minute || 0,
        latitude: chart2.latitude,
        longitude: chart2.longitude,
      });

      const gunas = [
        this.calculateVarna(vedicChart1, vedicChart2),
        this.calculateVashya(vedicChart1, vedicChart2),
        this.calculateTara(vedicChart1, vedicChart2),
        this.calculateYoni(vedicChart1, vedicChart2),
        this.calculateGrahaMaitri(vedicChart1, vedicChart2),
        this.calculateGana(vedicChart1, vedicChart2),
        this.calculateBhakoot(vedicChart1, vedicChart2),
        this.calculateNadi(vedicChart1, vedicChart2),
      ];

      const totalScore = gunas.reduce((sum, guna) => sum + (guna.score || 0), 0);
      const maxScore = gunas.reduce((sum, guna) => sum + (guna.maxScore || 0), 0);
      
      if (maxScore === 0) {
        throw new Error('Invalid guna calculation: maxScore is 0');
      }
      
      const percentage = Math.round((totalScore / maxScore) * 100);

      let verdict: 'Excellent' | 'Good' | 'Average' | 'Below Average';
      if (percentage >= 75) {
        verdict = 'Excellent';
      } else if (percentage >= 60) {
        verdict = 'Good';
      } else if (percentage >= 45) {
        verdict = 'Average';
      } else {
        verdict = 'Below Average';
      }

      return {
        totalScore,
        maxScore,
        percentage,
        verdict,
        gunas,
      };
    } catch (error) {
      this.logger.error(`Error calculating Guna Milan: ${error.message}`, error.stack);
      throw error;
    }
  }

  async calculateMarriageCompatibility(
    chart1: any,
    chart2: any,
  ): Promise<CompatibilityResult> {
    try {
      const gunaMilan = await this.calculateGunaMilan(chart1, chart2);
      
      const vedicChart1 = await this.astrologyEngineService.calculateVedicChart({
        year: chart1.year,
        month: chart1.month,
        day: chart1.day,
        hour: chart1.hour || 12,
        minute: chart1.minute || 0,
        latitude: chart1.latitude,
        longitude: chart1.longitude,
      });

      const vedicChart2 = await this.astrologyEngineService.calculateVedicChart({
        year: chart2.year,
        month: chart2.month,
        day: chart2.day,
        hour: chart2.hour || 12,
        minute: chart2.minute || 0,
        latitude: chart2.latitude,
        longitude: chart2.longitude,
      });
      
      const doshaCompatibility = await this.doshaService.checkCompatibilityDoshas(
        vedicChart1,
        vedicChart2,
        chart1,
        chart2,
      );

      const strengths = this.getStrengths(gunaMilan, doshaCompatibility);
      const challenges = this.getChallenges(gunaMilan, doshaCompatibility);
      const overallVerdict = this.getOverallVerdict(gunaMilan, doshaCompatibility);

      return {
        gunaMilan,
        doshas: {
          manglik: doshaCompatibility.manglikCompatibility,
          nadi: doshaCompatibility.nadiCompatibility,
          bhakoot: doshaCompatibility.bhakootCompatibility,
        },
        strengths,
        challenges,
        overallVerdict,
      };
    } catch (error) {
      this.logger.error(`Error calculating compatibility: ${error.message}`, error.stack);
      throw error;
    }
  }

  private calculateVarna(chart1: any, chart2: any): any {
    const sunSign1 = chart1.sunSign?.sign || chart1.sunSign || '';
    const sunSign2 = chart2.sunSign?.sign || chart2.sunSign || '';
    const varna1 = VARNA_MAP[sunSign1] ?? 0;
    const varna2 = VARNA_MAP[sunSign2] ?? 0;

    let score = 0;
    if (varna1 === varna2) {
      score = 1;
    } else if (Math.abs(varna1 - varna2) === 1) {
      score = 0;
    } else {
      score = 0;
    }

    return {
      name: 'Varna',
      score,
      maxScore: 1,
      description: score === 1 ? 'Varna matching is good' : 'Varna matching needs attention',
    };
  }

  private calculateVashya(chart1: any, chart2: any): any {
    const moon1 = chart1.moonSign?.sign || chart1.moonSign || '';
    const moon2 = chart2.moonSign?.sign || chart2.moonSign || '';
    const group1 = VASHYA_GROUPS[moon1] ?? 0;
    const group2 = VASHYA_GROUPS[moon2] ?? 0;
    
    let score = 0;
    if (group1 === group2) {
      score = 2; // Same group - excellent
    } else if (
      (group1 === 1 && group2 === 3) || (group1 === 3 && group2 === 1) || // Fire-Air
      (group1 === 2 && group2 === 4) || (group1 === 4 && group2 === 2)    // Earth-Water
    ) {
      score = 1; // Compatible groups
    } else {
      score = 0; // Incompatible groups
    }
    
    return {
      name: 'Vashya',
      score,
      maxScore: 2,
      description: score === 2 
        ? 'Vashya matching is excellent (same element)' 
        : score === 1 
        ? 'Vashya matching is good (compatible elements)' 
        : 'Vashya matching needs attention',
    };
  }

  private calculateTara(chart1: any, chart2: any): any {
    const moon1 = chart1.planets?.find((p: any) => p.planet === 'Moon');
    const moon2 = chart2.planets?.find((p: any) => p.planet === 'Moon');
    const nakshatra1 = moon1?.nakshatra || '';
    const nakshatra2 = moon2?.nakshatra || '';
    
    if (!nakshatra1 || !nakshatra2) {
      return {
        name: 'Tara',
        score: 0,
        maxScore: 3,
        description: 'Tara calculation requires nakshatra data',
      };
    }
    
    const index1 = NAKSHATRAS.indexOf(nakshatra1 as any);
    const index2 = NAKSHATRAS.indexOf(nakshatra2 as any);
    
    if (index1 === -1 || index2 === -1) {
      return {
        name: 'Tara',
        score: 0,
        maxScore: 3,
        description: 'Invalid nakshatra data',
      };
    }
    
    // Calculate Tara (9 tara system)
    // Count from partner1's nakshatra to partner2's nakshatra
    let tara = ((index2 - index1) % 27 + 27) % 27;
    if (tara === 0) tara = 27;
    
    const taraNumber = ((tara - 1) % 9) + 1;
    let score = 0;
    if ((GOOD_TARAS as readonly number[]).includes(taraNumber)) {
      score = 3;
    } else if ((BAD_TARAS as readonly number[]).includes(taraNumber)) {
      score = 0;
    } else {
      score = 1; // Neutral (shouldn't happen in 9 tara, but safety)
    }
    
    return {
      name: 'Tara',
      score,
      maxScore: 3,
      description: score === 3 
        ? `Tara matching is excellent (Tara ${taraNumber})` 
        : score === 0 
        ? `Tara matching is unfavorable (Tara ${taraNumber})` 
        : `Tara matching is neutral (Tara ${taraNumber})`,
    };
  }

  private calculateYoni(chart1: any, chart2: any): any {
    const moon1 = chart1.planets?.find((p: any) => p.planet === 'Moon');
    const moon2 = chart2.planets?.find((p: any) => p.planet === 'Moon');
    const nakshatra1 = moon1?.nakshatra || '';
    const nakshatra2 = moon2?.nakshatra || '';
    
    if (!nakshatra1 || !nakshatra2) {
      return {
        name: 'Yoni',
        score: 0,
        maxScore: 4,
        description: 'Yoni calculation requires nakshatra data',
      };
    }
    
    const yoni1 = YONI_MAP[nakshatra1] || '';
    const yoni2 = YONI_MAP[nakshatra2] || '';
    
    if (!yoni1 || !yoni2) {
      return {
        name: 'Yoni',
        score: 0,
        maxScore: 4,
        description: 'Invalid nakshatra data for Yoni',
      };
    }
    
    let score = 0;
    if (yoni1 === yoni2) {
      score = 4;
    } else {
      const compatible = COMPATIBLE_YONI_PAIRS[yoni1]?.includes(yoni2) ?? false;
      score = compatible ? 2 : 0;
    }
    
    return {
      name: 'Yoni',
      score,
      maxScore: 4,
      description: score === 4 
        ? `Yoni matching is excellent (both ${yoni1})` 
        : score === 2 
        ? `Yoni matching is good (${yoni1} and ${yoni2} are compatible)` 
        : `Yoni matching needs attention (${yoni1} and ${yoni2})`,
    };
  }

  private calculateGrahaMaitri(chart1: any, chart2: any): any {
    const moon1 = chart1.moonSign?.sign || chart1.moonSign || '';
    const moon2 = chart2.moonSign?.sign || chart2.moonSign || '';
    
    if (!moon1 || !moon2) {
      return {
        name: 'Graha Maitri',
        score: 0,
        maxScore: 5,
        description: 'Graha Maitri calculation requires Moon sign data',
      };
    }
    
    const group1 = SIGN_GROUPS[moon1] ?? 0;
    const group2 = SIGN_GROUPS[moon2] ?? 0;
    
    let score = 0;
    if (group1 === group2) {
      score = 5; // Same element - best friends
    } else if (
      (group1 === 1 && group2 === 3) || (group1 === 3 && group2 === 1) || // Fire-Air (friends)
      (group1 === 2 && group2 === 4) || (group1 === 4 && group2 === 2)    // Earth-Water (friends)
    ) {
      score = 4; // Compatible elements - good friends
    } else if (
      (group1 === 1 && group2 === 2) || (group1 === 2 && group2 === 1) || // Fire-Earth
      (group1 === 3 && group2 === 4) || (group1 === 4 && group2 === 3)    // Air-Water
    ) {
      score = 2; // Neutral
    } else {
      score = 0; // Incompatible
    }
    
    return {
      name: 'Graha Maitri',
      score,
      maxScore: 5,
      description: score >= 4 
        ? 'Planetary friendship is excellent' 
        : score === 2 
        ? 'Planetary friendship is neutral' 
        : 'Planetary friendship needs attention',
    };
  }

  private calculateGana(chart1: any, chart2: any): any {
    const moon1 = chart1.planets?.find((p: any) => p.planet === 'Moon');
    const moon2 = chart2.planets?.find((p: any) => p.planet === 'Moon');
    const nakshatra1 = moon1?.nakshatra || '';
    const nakshatra2 = moon2?.nakshatra || '';
    
    if (!nakshatra1 || !nakshatra2) {
      return {
        name: 'Gana',
        score: 0,
        maxScore: 6,
        description: 'Gana calculation requires nakshatra data',
      };
    }
    
    const gana1 = GANA_MAP[nakshatra1] || '';
    const gana2 = GANA_MAP[nakshatra2] || '';
    
    if (!gana1 || !gana2) {
      return {
        name: 'Gana',
        score: 0,
        maxScore: 6,
        description: 'Invalid nakshatra data for Gana',
      };
    }
    
    let score = 0;
    if (gana1 === gana2) {
      score = 6; // Same gana - excellent
    } else if (
      (gana1 === 'Deva' && gana2 === 'Manushya') || (gana1 === 'Manushya' && gana2 === 'Deva')
    ) {
      score = 5; // Deva-Manushya - very good
    } else if (
      (gana1 === 'Manushya' && gana2 === 'Rakshasa') || (gana1 === 'Rakshasa' && gana2 === 'Manushya')
    ) {
      score = 3; // Manushya-Rakshasa - acceptable
    } else if (
      (gana1 === 'Deva' && gana2 === 'Rakshasa') || (gana1 === 'Rakshasa' && gana2 === 'Deva')
    ) {
      score = 0; // Deva-Rakshasa - incompatible
    }
    
    return {
      name: 'Gana',
      score,
      maxScore: 6,
      description: score === 6 
        ? `Gana matching is excellent (both ${gana1})` 
        : score >= 5 
        ? `Gana matching is very good (${gana1} and ${gana2})` 
        : score >= 3 
        ? `Gana matching is acceptable (${gana1} and ${gana2})` 
        : `Gana matching is incompatible (${gana1} and ${gana2})`,
    };
  }

  private calculateBhakoot(chart1: any, chart2: any): any {
    const moon1 = chart1.moonSign?.sign || chart1.moonSign || '';
    const moon2 = chart2.moonSign?.sign || chart2.moonSign || '';
    const diff = Math.abs((SIGN_NUMBERS[moon1] ?? 0) - (SIGN_NUMBERS[moon2] ?? 0));
    const hasDosha = diff === 6 || diff === 8 || diff === 12;

    return {
      name: 'Bhakoot',
      score: hasDosha ? 0 : 7,
      maxScore: 7,
      description: hasDosha ? 'Bhakoot dosha present' : 'Bhakoot matching is good',
    };
  }

  private calculateNadi(chart1: any, chart2: any): any {
    const moon1 = chart1.planets?.find((p: any) => p.planet === 'Moon');
    const moon2 = chart2.planets?.find((p: any) => p.planet === 'Moon');
    const nakshatra1 = moon1?.nakshatra || '';
    const nakshatra2 = moon2?.nakshatra || '';
    const nadi1 = NADI_GROUPS[nakshatra1] || '';
    const nadi2 = NADI_GROUPS[nakshatra2] || '';
    const hasDosha = nadi1 === nadi2 && nadi1 !== '';

    return {
      name: 'Nadi',
      score: hasDosha ? 0 : 8,
      maxScore: 8,
      description: hasDosha ? 'Nadi dosha present' : 'Nadi matching is excellent',
    };
  }

  private getStrengths(gunaMilan: GunaMilanResult, doshas: any): string[] {
    const strengths: string[] = [];
    
    if (gunaMilan.percentage >= 75) {
      strengths.push('Excellent overall compatibility');
    }
    
    if (doshas.manglikCompatibility.includes('cancels')) {
      strengths.push('Manglik dosha is canceled');
    }
    
    if (!doshas.nadiCompatibility.includes('dosha')) {
      strengths.push('No Nadi dosha - good health compatibility');
    }
    
    return strengths.length > 0 ? strengths : ['Moderate compatibility'];
  }

  private getChallenges(gunaMilan: GunaMilanResult, doshas: any): string[] {
    const challenges: string[] = [];
    
    if (gunaMilan.percentage < 60) {
      challenges.push('Overall compatibility score is below ideal');
    }
    
    if (doshas.manglikCompatibility.includes('remedies')) {
      challenges.push('Manglik dosha requires remedies');
    }
    
    if (doshas.nadiCompatibility.includes('dosha')) {
      challenges.push('Nadi dosha may affect health compatibility');
    }
    
    if (doshas.bhakootCompatibility.includes('dosha')) {
      challenges.push('Bhakoot dosha may cause relationship challenges');
    }
    
    return challenges.length > 0 ? challenges : ['Minor adjustments may be needed'];
  }

  private getOverallVerdict(gunaMilan: GunaMilanResult, doshas: any): string {
    if (gunaMilan.percentage >= 75 && !doshas.manglikCompatibility.includes('remedies') && !doshas.nadiCompatibility.includes('dosha')) {
      return 'Highly favorable for marriage';
    } else if (gunaMilan.percentage >= 60) {
      return 'Favorable for marriage with some remedies';
    } else if (gunaMilan.percentage >= 45) {
      return 'Average compatibility - guidance recommended';
    } else {
      return 'Challenging match - detailed consultation advised';
    }
  }
}

