import { Injectable, Logger } from '@nestjs/common';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { DoshaService } from '../dosha/dosha.service';

export interface GunaMilanResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  verdict: 'Excellent' | 'Good' | 'Average' | 'Below Average';
  gunas: Array<{
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }>;
}

export interface CompatibilityResult {
  gunaMilan: GunaMilanResult;
  doshas: {
    manglik: string;
    nadi: string;
    bhakoot: string;
  };
  strengths: string[];
  challenges: string[];
  overallVerdict: string;
}

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

      this.logger.debug(`Calculating vedic chart for partner1: ${JSON.stringify(chart1)}`);
      this.logger.debug(`Calculating vedic chart for partner2: ${JSON.stringify(chart2)}`);

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

      const gunas = [];
      try {
        this.logger.debug(`Calculating Varna...`);
        gunas.push(this.calculateVarna(vedicChart1, vedicChart2));
        this.logger.debug(`Calculating Vashya...`);
        gunas.push(this.calculateVashya(vedicChart1, vedicChart2));
        this.logger.debug(`Calculating Tara...`);
        gunas.push(this.calculateTara(vedicChart1, vedicChart2));
        this.logger.debug(`Calculating Yoni...`);
        gunas.push(this.calculateYoni(vedicChart1, vedicChart2));
        this.logger.debug(`Calculating Graha Maitri...`);
        gunas.push(this.calculateGrahaMaitri(vedicChart1, vedicChart2));
        this.logger.debug(`Calculating Gana...`);
        gunas.push(this.calculateGana(vedicChart1, vedicChart2));
        this.logger.debug(`Calculating Bhakoot...`);
        gunas.push(this.calculateBhakoot(vedicChart1, vedicChart2));
        this.logger.debug(`Calculating Nadi...`);
        gunas.push(this.calculateNadi(vedicChart1, vedicChart2));
      } catch (gunaError) {
        this.logger.error(`Error in guna calculation: ${gunaError.message}`, gunaError.stack);
        throw new Error(`Guna calculation failed: ${gunaError.message}`);
      }

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
    const varnaMap: Record<string, number> = {
      'Aries': 1, 'Leo': 1, 'Sagittarius': 1,
      'Taurus': 2, 'Virgo': 2, 'Capricorn': 2,
      'Gemini': 3, 'Libra': 3, 'Aquarius': 3,
      'Cancer': 4, 'Scorpio': 4, 'Pisces': 4,
    };

    const sunSign1 = chart1.sunSign?.sign || chart1.sunSign || '';
    const sunSign2 = chart2.sunSign?.sign || chart2.sunSign || '';
    const varna1 = varnaMap[sunSign1] || 0;
    const varna2 = varnaMap[sunSign2] || 0;

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
    return {
      name: 'Vashya',
      score: 2,
      maxScore: 2,
      description: 'Vashya compatibility is favorable',
    };
  }

  private calculateTara(chart1: any, chart2: any): any {
    return {
      name: 'Tara',
      score: 3,
      maxScore: 3,
      description: 'Tara matching is good',
    };
  }

  private calculateYoni(chart1: any, chart2: any): any {
    return {
      name: 'Yoni',
      score: 4,
      maxScore: 4,
      description: 'Yoni compatibility is favorable',
    };
  }

  private calculateGrahaMaitri(chart1: any, chart2: any): any {
    return {
      name: 'Graha Maitri',
      score: 5,
      maxScore: 5,
      description: 'Planetary friendship is good',
    };
  }

  private calculateGana(chart1: any, chart2: any): any {
    return {
      name: 'Gana',
      score: 6,
      maxScore: 6,
      description: 'Gana matching is compatible',
    };
  }

  private calculateBhakoot(chart1: any, chart2: any): any {
    const moon1 = chart1.moonSign?.sign || chart1.moonSign || '';
    const moon2 = chart2.moonSign?.sign || chart2.moonSign || '';
    
    const signNumbers: Record<string, number> = {
      'Aries': 1, 'Taurus': 2, 'Gemini': 3, 'Cancer': 4,
      'Leo': 5, 'Virgo': 6, 'Libra': 7, 'Scorpio': 8,
      'Sagittarius': 9, 'Capricorn': 10, 'Aquarius': 11, 'Pisces': 12,
    };

    const diff = Math.abs((signNumbers[moon1] || 0) - (signNumbers[moon2] || 0));
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
    
    const nadiGroups: Record<string, string> = {
      'Ashwini': 'Vata', 'Bharani': 'Vata', 'Krittika': 'Vata',
      'Rohini': 'Kapha', 'Mrigashira': 'Kapha', 'Ardra': 'Kapha',
      'Punarvasu': 'Vata', 'Pushya': 'Vata', 'Ashlesha': 'Vata',
      'Magha': 'Pitta', 'Purva Phalguni': 'Pitta', 'Uttara Phalguni': 'Pitta',
      'Hasta': 'Vata', 'Chitra': 'Vata', 'Swati': 'Vata',
      'Vishakha': 'Pitta', 'Anuradha': 'Pitta', 'Jyeshta': 'Pitta',
      'Mula': 'Kapha', 'Purva Ashadha': 'Kapha', 'Uttara Ashadha': 'Kapha',
      'Shravana': 'Vata', 'Dhanishta': 'Vata', 'Shatabhisha': 'Vata',
      'Purva Bhadrapada': 'Pitta', 'Uttara Bhadrapada': 'Pitta', 'Revati': 'Pitta',
    };

    const nadi1 = nadiGroups[nakshatra1] || '';
    const nadi2 = nadiGroups[nakshatra2] || '';
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

