import { Injectable, Logger } from '@nestjs/common';
import {
  MANGLIK_HOUSES,
  MANGLIK_SIGNS,
  NADI_GROUPS,
  SIGN_NUMBERS,
} from '../common/constants/astrology.constants';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';
import { getTimezoneOffsetFromLongitude } from '../common/utils/birth-time.util';
import type { DoshaDetails } from './interfaces/dosha.interface';

export type { DoshaDetails } from './interfaces/dosha.interface';

@Injectable()
export class DoshaService {
  private readonly logger = new Logger(DoshaService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
    private readonly swissEphemerisService: SwissEphemerisService,
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
      const timezoneOffset = getTimezoneOffsetFromLongitude(longitude);
      const julianDayUt = this.swissEphemerisService.localTimeToJulianDayUt(
        year,
        month,
        day,
        hour,
        minute,
        0,
        timezoneOffset,
      );
      const vedicChart =
        await this.astrologyEngineService.calculateVedicChartFromJulianDay(
          julianDayUt,
          latitude,
          longitude,
        );

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
    const marsLongitude = marsPlanet.longitude || 0;
    
    const hasSignDosha = (MANGLIK_SIGNS as readonly string[]).includes(marsSign);
    const marsHouse = this.getPlanetHouse(marsLongitude, chart.houses);
    const hasHouseDosha = marsHouse != null && (MANGLIK_HOUSES as readonly number[]).includes(marsHouse);
    
    const hasDosha = hasSignDosha || hasHouseDosha;

    let severity: 'High' | 'Medium' | 'Low' | 'None' = 'None';
    let description = '';
    
    if (hasDosha) {
      if (marsSign === 'aries' || marsSign === 'scorpio') {
        severity = 'High';
      } else if (marsSign === 'capricorn') {
        severity = 'Medium';
      } else if (hasHouseDosha) {
        severity = 'Medium';
      }
      
      const reasons: string[] = [];
      if (hasSignDosha) {
        reasons.push(`Mars is in ${marsPlanet.sign} sign`);
      }
      if (hasHouseDosha) {
        reasons.push(`Mars is in ${marsHouse}th house`);
      }
      
      description = `Manglik dosha present. ${reasons.join(' and ')}.`;
    } else {
      description = 'The person is not Manglik.';
    }

    return {
      hasDosha,
      description,
      severity,
    };
  }

  private getPlanetHouse(planetLongitude: number, houses: any[]): number | null {
    if (!houses || houses.length === 0) {
      return null;
    }
    
    // Normalize planet longitude to 0-360
    const normalizedLongitude = ((planetLongitude % 360) + 360) % 360;
    
    // Get house cusps with longitudes
    const houseCusps = houses
      .filter(h => h.longitude !== undefined && h.longitude !== null)
      .map(h => ({
        house: h.house,
        longitude: ((h.longitude % 360) + 360) % 360,
      }))
      .sort((a, b) => a.longitude - b.longitude);
    
    if (houseCusps.length === 0) {
      return null;
    }
    
    // Find which house the planet is in
    for (let i = 0; i < houseCusps.length; i++) {
      const currentHouse = houseCusps[i];
      const nextHouse = houseCusps[(i + 1) % houseCusps.length];
      
      let currentLong = currentHouse.longitude;
      let nextLong = nextHouse.longitude;
      
      // Handle wrap-around (house 12 to house 1)
      if (nextLong < currentLong) {
        nextLong += 360;
      }
      
      let planetLong = normalizedLongitude;
      if (planetLong < currentLong) {
        planetLong += 360;
      }
      
      if (planetLong >= currentLong && planetLong < nextLong) {
        return currentHouse.house;
      }
    }
    
    // Fallback: check if planet is before first house cusp (house 12)
    const firstHouseLong = houseCusps[0].longitude;
    if (normalizedLongitude < firstHouseLong) {
      const lastHouse = houseCusps[houseCusps.length - 1];
      return lastHouse.house;
    }
    
    return null;
  }

  private checkNadiDosha(chart: any): any {
    const moonNakshatra = chart.planets.find((p: any) => p.planet === 'Moon')?.nakshatra || '';
    const nadi = NADI_GROUPS[moonNakshatra] || 'Unknown';
    
    return {
      hasDosha: false,
      description: `Moon is in ${nadi} Nadi. Nadi dosha occurs when both partners have the same Nadi.`,
    };
  }

  private checkBhakootDosha(chart: any): any {
    const moonSign = chart.moonSign.sign.toLowerCase();
    const sunSign = chart.sunSign.sign.toLowerCase();
    const moonNum = SIGN_NUMBERS[moonSign] ?? 0;
    const sunNum = SIGN_NUMBERS[sunSign] ?? 0;
    
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
    vedicChart1: any,
    vedicChart2: any,
    birthDetails1: any,
    birthDetails2: any,
  ): Promise<{
    manglikCompatibility: string;
    nadiCompatibility: string;
    bhakootCompatibility: string;
  }> {
    const dosha1 = await this.checkDoshas(
      birthDetails1.year,
      birthDetails1.month,
      birthDetails1.day,
      birthDetails1.hour || 12,
      birthDetails1.minute || 0,
      birthDetails1.latitude,
      birthDetails1.longitude,
    );

    const dosha2 = await this.checkDoshas(
      birthDetails2.year,
      birthDetails2.month,
      birthDetails2.day,
      birthDetails2.hour || 12,
      birthDetails2.minute || 0,
      birthDetails2.latitude,
      birthDetails2.longitude,
    );

    const manglik1 = dosha1.manglik.hasDosha;
    const manglik2 = dosha2.manglik.hasDosha;
    
    let manglikCompatibility = 'Compatible';
    if (manglik1 && manglik2) {
      manglikCompatibility = 'Manglik-Manglik match cancels the dosha';
    } else if (manglik1 || manglik2) {
      manglikCompatibility = 'Manglik dosha present - remedies recommended';
    }

    const moon1 = vedicChart1.planets?.find((p: any) => p.planet === 'Moon');
    const moon2 = vedicChart2.planets?.find((p: any) => p.planet === 'Moon');
    const nadi1 = moon1?.nakshatra || '';
    const nadi2 = moon2?.nakshatra || '';
    const nadi1Type = NADI_GROUPS[nadi1] || '';
    const nadi2Type = NADI_GROUPS[nadi2] || '';
    
    const nadiCompatibility = nadi1Type === nadi2Type && nadi1Type !== ''
      ? 'Nadi dosha present - same Nadi'
      : 'No Nadi dosha';

    const moonSign1 = vedicChart1.moonSign?.sign || vedicChart1.moonSign || '';
    const moonSign2 = vedicChart2.moonSign?.sign || vedicChart2.moonSign || '';
    const diff = Math.abs((SIGN_NUMBERS[moonSign1] ?? 0) - (SIGN_NUMBERS[moonSign2] ?? 0));
    const hasBhakootDosha = diff === 6 || diff === 8 || diff === 12;
    
    const bhakootCompatibility = hasBhakootDosha
      ? 'Bhakoot dosha present'
      : 'No Bhakoot dosha';

    return {
      manglikCompatibility,
      nadiCompatibility,
      bhakootCompatibility,
    };
  }
}

