import { Injectable, Logger } from '@nestjs/common';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';

export interface DoshaDetails {
  manglik: {
    hasDosha: boolean;
    description: string;
    severity?: 'High' | 'Medium' | 'Low' | 'None';
  };
  nadi: {
    hasDosha: boolean;
    description: string;
  };
  bhakoot: {
    hasDosha: boolean;
    description: string;
  };
  totalDoshas: number;
}

@Injectable()
export class DoshaService {
  private readonly logger = new Logger(DoshaService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
  ) {}

  async checkDoshas(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    latitude: number,
    longitude: number,
  ): Promise<DoshaDetails> {
    try {
      const vedicChart = await this.astrologyEngineService.calculateVedicChart({
        year,
        month,
        day,
        hour,
        minute,
        latitude,
        longitude,
      });

      const manglik = this.checkManglikDosha(vedicChart);
      const nadi = this.checkNadiDosha(vedicChart);
      const bhakoot = this.checkBhakootDosha(vedicChart);

      const totalDoshas = [
        manglik.hasDosha,
        nadi.hasDosha,
        bhakoot.hasDosha,
      ].filter(Boolean).length;

      return {
        manglik,
        nadi,
        bhakoot,
        totalDoshas,
      };
    } catch (error) {
      this.logger.error(`Error checking doshas: ${error.message}`, error.stack);
      throw error;
    }
  }

  private checkManglikDosha(chart: any): any {
    const marsPlanet = chart.planets.find((p: any) => p.planet === 'Mars');
    if (!marsPlanet) {
      return { hasDosha: false, description: 'Mars position not found' };
    }

    const marsSign = marsPlanet.sign.toLowerCase();
    const manglikSigns = ['aries', 'scorpio', 'sagittarius', 'capricorn'];
    const hasDosha = manglikSigns.includes(marsSign);

    let severity: 'High' | 'Medium' | 'Low' | 'None' = 'None';
    if (hasDosha) {
      if (marsSign === 'aries' || marsSign === 'scorpio') {
        severity = 'High';
      } else {
        severity = 'Medium';
      }
    }

    return {
      hasDosha,
      description: hasDosha
        ? `Mars is placed in ${marsPlanet.sign}, indicating Manglik dosha.`
        : 'The person is not Manglik.',
      severity,
    };
  }

  private checkNadiDosha(chart: any): any {
    const moonNakshatra = chart.planets.find((p: any) => p.planet === 'Moon')?.nakshatra || '';
    
    const nadiGroups: Record<string, string> = {
      'Ashwini': 'Vata',
      'Bharani': 'Vata',
      'Krittika': 'Vata',
      'Rohini': 'Kapha',
      'Mrigashira': 'Kapha',
      'Ardra': 'Kapha',
      'Punarvasu': 'Vata',
      'Pushya': 'Vata',
      'Ashlesha': 'Vata',
      'Magha': 'Pitta',
      'Purva Phalguni': 'Pitta',
      'Uttara Phalguni': 'Pitta',
      'Hasta': 'Vata',
      'Chitra': 'Vata',
      'Swati': 'Vata',
      'Vishakha': 'Pitta',
      'Anuradha': 'Pitta',
      'Jyeshta': 'Pitta',
      'Mula': 'Kapha',
      'Purva Ashadha': 'Kapha',
      'Uttara Ashadha': 'Kapha',
      'Shravana': 'Vata',
      'Dhanishta': 'Vata',
      'Shatabhisha': 'Vata',
      'Purva Bhadrapada': 'Pitta',
      'Uttara Bhadrapada': 'Pitta',
      'Revati': 'Pitta',
    };

    const nadi = nadiGroups[moonNakshatra] || 'Unknown';
    
    return {
      hasDosha: false,
      description: `Moon is in ${nadi} Nadi. Nadi dosha occurs when both partners have the same Nadi.`,
    };
  }

  private checkBhakootDosha(chart: any): any {
    const moonSign = chart.moonSign.sign.toLowerCase();
    const sunSign = chart.sunSign.sign.toLowerCase();
    
    const signNumbers: Record<string, number> = {
      'aries': 1, 'taurus': 2, 'gemini': 3, 'cancer': 4,
      'leo': 5, 'virgo': 6, 'libra': 7, 'scorpio': 8,
      'sagittarius': 9, 'capricorn': 10, 'aquarius': 11, 'pisces': 12,
    };

    const moonNum = signNumbers[moonSign] || 0;
    const sunNum = signNumbers[sunSign] || 0;
    
    const difference = Math.abs(moonNum - sunNum);
    const hasDosha = difference === 6 || difference === 8 || difference === 12;

    return {
      hasDosha,
      description: hasDosha
        ? 'Bhakoot dosha is present. This may cause challenges in relationships.'
        : 'No Bhakoot dosha detected.',
    };
  }

  async checkCompatibilityDoshas(
    chart1: any,
    chart2: any,
  ): Promise<{
    manglikCompatibility: string;
    nadiCompatibility: string;
    bhakootCompatibility: string;
  }> {
    const dosha1 = await this.checkDoshas(
      chart1.year,
      chart1.month,
      chart1.day,
      chart1.hour,
      chart1.minute,
      chart1.latitude,
      chart1.longitude,
    );

    const dosha2 = await this.checkDoshas(
      chart2.year,
      chart2.month,
      chart2.day,
      chart2.hour,
      chart2.minute,
      chart2.latitude,
      chart2.longitude,
    );

    const manglik1 = dosha1.manglik.hasDosha;
    const manglik2 = dosha2.manglik.hasDosha;
    
    let manglikCompatibility = 'Compatible';
    if (manglik1 && manglik2) {
      manglikCompatibility = 'Manglik-Manglik match cancels the dosha';
    } else if (manglik1 || manglik2) {
      manglikCompatibility = 'Manglik dosha present - remedies recommended';
    }

    const nadi1 = chart1.planets.find((p: any) => p.planet === 'Moon')?.nakshatra || '';
    const nadi2 = chart2.planets.find((p: any) => p.planet === 'Moon')?.nakshatra || '';
    
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

    const nadi1Type = nadiGroups[nadi1] || '';
    const nadi2Type = nadiGroups[nadi2] || '';
    
    const nadiCompatibility = nadi1Type === nadi2Type && nadi1Type !== ''
      ? 'Nadi dosha present - same Nadi'
      : 'No Nadi dosha';

    const bhakoot1 = dosha1.bhakoot.hasDosha;
    const bhakoot2 = dosha2.bhakoot.hasDosha;
    
    const bhakootCompatibility = bhakoot1 || bhakoot2
      ? 'Bhakoot dosha present'
      : 'No Bhakoot dosha';

    return {
      manglikCompatibility,
      nadiCompatibility,
      bhakootCompatibility,
    };
  }
}

