import { Injectable, Logger } from '@nestjs/common';
import {
  DASHA_DURATIONS,
  DASHA_ORDER,
  NAKSHATRA_PLANET_MAP,
} from '../common/constants/astrology.constants';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';
import { getTimezoneOffsetFromLongitude } from '../common/utils/birth-time.util';
import type { DashaDetails, DashaPeriod } from './interfaces/dasha.interface';

export type { DashaDetails, DashaPeriod } from './interfaces/dasha.interface';

@Injectable()
export class DashaService {
  private readonly logger = new Logger(DashaService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  async calculateDasha(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    latitude: number,
    longitude: number,
  ): Promise<DashaDetails> {
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

      const moonNakshatra = vedicChart.planets.find((p) => p.planet === 'Moon')?.nakshatra || '';
      const moonLongitude = vedicChart.planets.find((p) => p.planet === 'Moon')?.longitude || 0;
      const birthDate = new Date((julianDayUt - 2440587.5) * 86400 * 1000);
      const currentDate = new Date();
      
      const dashaStartPlanet = this.getDashaStartPlanet(moonNakshatra);
      const dashaStartDate = this.calculateDashaStartDate(birthDate, moonLongitude, dashaStartPlanet);
      
      const currentDasha = this.getCurrentDasha(dashaStartDate, currentDate, dashaStartPlanet);
      const timeline = this.generateDashaTimeline(dashaStartDate, currentDate, 10, dashaStartPlanet);

      return {
        current: currentDasha,
        timeline: timeline,
      };
    } catch (error) {
      this.logger.error(`Error calculating dasha: ${error.message}`, error.stack);
      throw error;
    }
  }

  /** Vimshottari dasha ruler of the Moon's nakshatra at birth. */
  private getDashaStartPlanet(nakshatra: string): string {
    return NAKSHATRA_PLANET_MAP[nakshatra] || 'Moon';
  }

  /** DASHA_ORDER rotated so that startPlanet is first (for correct cycle from birth mahadasha). */
  private dashaOrderFrom(startPlanet: string): string[] {
    const order = DASHA_ORDER as readonly string[];
    const i = order.indexOf(startPlanet);
    if (i < 0) return [...order];
    return [...order.slice(i), ...order.slice(0, i)];
  }

  /**
   * Start date of the mahadasha running at birth (Vimshottari).
   * Balance of dasha at birth = (1 - nakshatraProgress) * totalDashaYears; elapsed = totalDashaYears - balance.
   */
  private calculateDashaStartDate(
    birthDate: Date,
    moonLongitude: number,
    startPlanet: string,
  ): Date {
    const nakshatraProgress = (moonLongitude % (360 / 27)) / (360 / 27);
    const totalDashaYears = DASHA_DURATIONS[startPlanet];
    const elapsedYears = totalDashaYears * nakshatraProgress;

    const startDate = new Date(birthDate);
    startDate.setFullYear(startDate.getFullYear() - elapsedYears);

    return startDate;
  }

  /**
   * Vimshottari: startDate is the start of the mahadasha that was running at birth (startPlanet).
   * We iterate dashas in order starting from startPlanet to find current mahadasha and antardasha.
   */
  private getCurrentDasha(startDate: Date, currentDate: Date, startPlanet: string): any {
    const totalDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let remainingDays = totalDays;
    const orderFromStart = this.dashaOrderFrom(startPlanet);

    let currentPlanet: string = orderFromStart[0];
    let currentStartDate = new Date(startDate);

    for (const planet of orderFromStart) {
      const planetDuration = DASHA_DURATIONS[planet] * 365;

      if (remainingDays < planetDuration) {
        currentPlanet = planet;
        break;
      }
      remainingDays -= planetDuration;
      currentStartDate = new Date(currentStartDate.getTime() + planetDuration * 24 * 60 * 60 * 1000);
    }
    
    const mahadashaDuration = DASHA_DURATIONS[currentPlanet] * 365;
    const mahadashaStartDate = new Date(currentStartDate);

    // Calculate antardasha (each mahadasha has 9 antardashas)
    // Antardasha duration = (Mahadasha duration × Planet duration) / 120
    let antardashaRemainingDays = remainingDays;
    let antardashaPlanet: string = DASHA_ORDER[0];
    let antardashaStartDate = new Date(mahadashaStartDate);

    for (const planet of orderFromStart) {
      const antardashaDuration = Math.floor((mahadashaDuration * DASHA_DURATIONS[planet]) / 120);

      if (antardashaRemainingDays < antardashaDuration) {
        antardashaPlanet = planet;
        break;
      }
      antardashaRemainingDays -= antardashaDuration;
      antardashaStartDate = new Date(antardashaStartDate.getTime() + antardashaDuration * 24 * 60 * 60 * 1000);
    }
    
    const currentAntardashaDuration = Math.floor((mahadashaDuration * DASHA_DURATIONS[antardashaPlanet]) / 120);
    const antardashaEndDate = new Date(antardashaStartDate);
    antardashaEndDate.setDate(antardashaEndDate.getDate() + currentAntardashaDuration);
    
    return {
      mahadasha: currentPlanet,
      antardasha: antardashaPlanet,
      startDate: mahadashaStartDate.toISOString().split('T')[0],
      endDate: new Date(mahadashaStartDate.getTime() + mahadashaDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      planet: currentPlanet,
      remainingDays: Math.floor(mahadashaDuration - remainingDays),
    };
  }

  private generateDashaTimeline(startDate: Date, currentDate: Date, years: number, startPlanet: string): DashaPeriod[] {
    const timeline: DashaPeriod[] = [];
    const orderFromStart = this.dashaOrderFrom(startPlanet);
    let currentStart = new Date(startDate);
    const endDate = new Date(currentDate);
    endDate.setFullYear(endDate.getFullYear() + years);

    let totalDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let currentMahadashaIndex = 0;
    let mahadashaStart = new Date(startDate);

    for (let i = 0; i < orderFromStart.length; i++) {
      const planet = orderFromStart[i];
      const planetDuration = DASHA_DURATIONS[planet] * 365;
      if (totalDays < planetDuration) {
        currentMahadashaIndex = i;
        break;
      }
      totalDays -= planetDuration;
      mahadashaStart = new Date(mahadashaStart.getTime() + planetDuration * 24 * 60 * 60 * 1000);
    }

    let mahadashaIndex = currentMahadashaIndex;
    let timelineStart = new Date(mahadashaStart);

    while (timelineStart < endDate && timeline.length < 200) {
      const mahadashaPlanet = orderFromStart[mahadashaIndex % orderFromStart.length];
      const mahadashaDuration = DASHA_DURATIONS[mahadashaPlanet] * 365;
      const mahadashaEnd = new Date(timelineStart);
      mahadashaEnd.setDate(mahadashaEnd.getDate() + mahadashaDuration);

      let antardashaStart = new Date(timelineStart);
      for (const antardashaPlanet of orderFromStart) {
        const antardashaDuration = Math.floor((mahadashaDuration * DASHA_DURATIONS[antardashaPlanet]) / 120);
        const antardashaEnd = new Date(antardashaStart);
        antardashaEnd.setDate(antardashaEnd.getDate() + antardashaDuration);
        
        if (antardashaStart >= endDate) {
          break;
        }
        
        timeline.push({
          dasha: mahadashaPlanet,
          antardasha: antardashaPlanet,
          startDate: antardashaStart.toISOString().split('T')[0],
          endDate: antardashaEnd.toISOString().split('T')[0],
          planet: mahadashaPlanet,
          duration: Math.floor(antardashaDuration / 365 * 10) / 10, // Convert to years with 1 decimal
        });
        
        antardashaStart = antardashaEnd;
        
        if (antardashaStart >= endDate) {
          break;
        }
      }
      
      timelineStart = mahadashaEnd;
      mahadashaIndex++;
    }
    
    return timeline;
  }
}

