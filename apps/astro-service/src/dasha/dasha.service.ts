import { Injectable, Logger } from '@nestjs/common';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

export interface DashaPeriod {
  dasha: string;
  antardasha: string;
  pratyantardasha?: string;
  startDate: string;
  endDate: string;
  planet: string;
  duration: number;
}

export interface DashaDetails {
  current: {
    mahadasha: string;
    antardasha: string;
    pratyantardasha?: string;
    startDate: string;
    endDate: string;
    planet: string;
    remainingDays: number;
  };
  timeline: DashaPeriod[];
}

@Injectable()
export class DashaService {
  private readonly logger = new Logger(DashaService.name);
  
  private readonly dashaOrder = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 
    'Rahu', 'Jupiter', 'Saturn', 'Mercury'
  ];
  
  private readonly dashaDurations = {
    'Ketu': 7,
    'Venus': 20,
    'Sun': 6,
    'Moon': 10,
    'Mars': 7,
    'Rahu': 18,
    'Jupiter': 16,
    'Saturn': 19,
    'Mercury': 17,
  };

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
      const vedicChart = await this.astrologyEngineService.calculateVedicChart({
        year,
        month,
        day,
        hour,
        minute,
        latitude,
        longitude,
      });

      const moonNakshatra = vedicChart.planets.find((p) => p.planet === 'Moon')?.nakshatra || '';
      const moonLongitude = vedicChart.planets.find((p) => p.planet === 'Moon')?.longitude || 0;
      
      const birthDate = new Date(year, month - 1, day, hour, minute);
      const currentDate = new Date();
      
      const dashaStartPlanet = this.getDashaStartPlanet(moonNakshatra);
      const dashaStartDate = this.calculateDashaStartDate(birthDate, moonLongitude, dashaStartPlanet);
      
      const currentDasha = this.getCurrentDasha(dashaStartDate, currentDate);
      const timeline = this.generateDashaTimeline(dashaStartDate, currentDate, 10);

      return {
        current: currentDasha,
        timeline: timeline,
      };
    } catch (error) {
      this.logger.error(`Error calculating dasha: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getDashaStartPlanet(nakshatra: string): string {
    const nakshatraPlanetMap: Record<string, string> = {
      'Ashwini': 'Ketu',
      'Bharani': 'Venus',
      'Krittika': 'Sun',
      'Rohini': 'Moon',
      'Mrigashira': 'Mars',
      'Ardra': 'Rahu',
      'Punarvasu': 'Jupiter',
      'Pushya': 'Saturn',
      'Ashlesha': 'Mercury',
      'Magha': 'Ketu',
      'Purva Phalguni': 'Venus',
      'Uttara Phalguni': 'Sun',
      'Hasta': 'Moon',
      'Chitra': 'Mars',
      'Swati': 'Rahu',
      'Vishakha': 'Jupiter',
      'Anuradha': 'Saturn',
      'Jyeshta': 'Mercury',
      'Mula': 'Ketu',
      'Purva Ashadha': 'Venus',
      'Uttara Ashadha': 'Sun',
      'Shravana': 'Moon',
      'Dhanishta': 'Mars',
      'Shatabhisha': 'Rahu',
      'Purva Bhadrapada': 'Jupiter',
      'Uttara Bhadrapada': 'Saturn',
      'Revati': 'Mercury',
    };

    return nakshatraPlanetMap[nakshatra] || 'Moon';
  }

  private calculateDashaStartDate(
    birthDate: Date,
    moonLongitude: number,
    startPlanet: string,
  ): Date {
    const nakshatraStartLongitude = Math.floor(moonLongitude / (360 / 27)) * (360 / 27);
    const nakshatraProgress = (moonLongitude % (360 / 27)) / (360 / 27);
    
    const planetIndex = this.dashaOrder.indexOf(startPlanet);
    const totalDashaYears = this.dashaDurations[startPlanet];
    const elapsedYears = totalDashaYears * nakshatraProgress;
    
    const startDate = new Date(birthDate);
    startDate.setFullYear(startDate.getFullYear() - elapsedYears);
    
    return startDate;
  }

  private getCurrentDasha(startDate: Date, currentDate: Date): any {
    const totalDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let remainingDays = totalDays;
    
    let currentPlanet = this.dashaOrder[0];
    let currentStartDate = new Date(startDate);
    
    for (const planet of this.dashaOrder) {
      const planetDuration = this.dashaDurations[planet] * 365;
      
      if (remainingDays < planetDuration) {
        currentPlanet = planet;
        break;
      }
      
      remainingDays -= planetDuration;
      currentStartDate = new Date(currentStartDate.getTime() + planetDuration * 24 * 60 * 60 * 1000);
    }
    
    const planetDuration = this.dashaDurations[currentPlanet] * 365;
    const antardashaStartPlanet = this.dashaOrder[this.dashaOrder.indexOf(currentPlanet)];
    const antardashaProgress = remainingDays / planetDuration;
    const antardashaDuration = (this.dashaDurations[antardashaStartPlanet] * 365) / 12;
    const currentAntardashaDays = remainingDays % antardashaDuration;
    const antardashaIndex = Math.floor(remainingDays / antardashaDuration);
    
    const antardashaPlanet = this.dashaOrder[
      (this.dashaOrder.indexOf(currentPlanet) + antardashaIndex) % this.dashaOrder.length
    ];
    
    const antardashaStart = new Date(currentStartDate);
    antardashaStart.setDate(antardashaStart.getDate() + antardashaIndex * antardashaDuration);
    
    const antardashaEnd = new Date(antardashaStart);
    antardashaEnd.setDate(antardashaEnd.getDate() + antardashaDuration);
    
    return {
      mahadasha: currentPlanet,
      antardasha: antardashaPlanet,
      startDate: currentStartDate.toISOString().split('T')[0],
      endDate: new Date(currentStartDate.getTime() + planetDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      planet: currentPlanet,
      remainingDays: Math.floor(planetDuration - remainingDays),
    };
  }

  private generateDashaTimeline(startDate: Date, currentDate: Date, years: number): DashaPeriod[] {
    const timeline: DashaPeriod[] = [];
    let currentStart = new Date(startDate);
    const endDate = new Date(currentDate);
    endDate.setFullYear(endDate.getFullYear() + years);
    
    let planetIndex = 0;
    
    while (currentStart < endDate && timeline.length < 100) {
      const planet = this.dashaOrder[planetIndex % this.dashaOrder.length];
      const duration = this.dashaDurations[planet] * 365;
      const end = new Date(currentStart);
      end.setDate(end.getDate() + duration);
      
      const antardashaPlanet = planet;
      const antardashaDuration = duration / 12;
      
      timeline.push({
        dasha: planet,
        antardasha: antardashaPlanet,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        planet: planet,
        duration: duration,
      });
      
      currentStart = end;
      planetIndex++;
    }
    
    return timeline;
  }
}

