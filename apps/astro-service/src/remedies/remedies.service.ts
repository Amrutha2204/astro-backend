import { Injectable, Logger } from '@nestjs/common';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { CalendarService } from '../calendar/calendar.service';

export interface Remedy {
  type: 'gemstone' | 'mantra' | 'fasting' | 'donation' | 'ritual';
  name: string;
  description: string;
  timing?: string;
  frequency?: string;
}

export interface RemedyRecommendations {
  gemstones: Remedy[];
  mantras: Remedy[];
  fastingDays: Remedy[];
  donations: Remedy[];
  rituals: Remedy[];
  bestTiming: {
    day: string;
    time: string;
    tithi?: string;
    nakshatra?: string;
  };
}

@Injectable()
export class RemediesService {
  private readonly logger = new Logger(RemediesService.name);

  constructor(
    private readonly astrologyEngineService: AstrologyEngineService,
    private readonly calendarService: CalendarService,
  ) {}

  async getRemedies(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    latitude: number,
    longitude: number,
  ): Promise<RemedyRecommendations> {
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

      const gemstones = this.getGemstoneRecommendations(vedicChart);
      const mantras = this.getMantraRecommendations(vedicChart);
      const fastingDays = this.getFastingDays(vedicChart);
      const donations = this.getDonationRecommendations(vedicChart);
      const rituals = this.getRitualRecommendations(vedicChart);
      const bestTiming = await this.getBestTiming(latitude, longitude);

      return {
        gemstones,
        mantras,
        fastingDays,
        donations,
        rituals,
        bestTiming,
      };
    } catch (error) {
      this.logger.error(`Error getting remedies: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getGemstoneRecommendations(chart: any): Remedy[] {
    const gemstones: Remedy[] = [];
    const weakPlanets = this.identifyWeakPlanets(chart);

    const gemstoneMap: Record<string, string> = {
      'Sun': 'Ruby',
      'Moon': 'Pearl',
      'Mars': 'Red Coral',
      'Mercury': 'Emerald',
      'Jupiter': 'Yellow Sapphire',
      'Venus': 'Diamond',
      'Saturn': 'Blue Sapphire',
      'Rahu': 'Hessonite',
      'Ketu': 'Cat\'s Eye',
    };

    weakPlanets.forEach((planet) => {
      const gemstone = gemstoneMap[planet];
      if (gemstone) {
        gemstones.push({
          type: 'gemstone',
          name: gemstone,
          description: `Wear ${gemstone} to strengthen ${planet}. Consult an astrologer for proper wearing method.`,
          timing: 'Wear on auspicious day',
        });
      }
    });

    return gemstones.length > 0 ? gemstones : [
      {
        type: 'gemstone',
        name: 'General Protection',
        description: 'Consult an astrologer for personalized gemstone recommendations based on your chart.',
      },
    ];
  }

  private getMantraRecommendations(chart: any): Remedy[] {
    const mantras: Remedy[] = [];
    const lagna = chart.lagna?.sign || '';
    const moonSign = chart.moonSign?.sign || '';

    const mantraMap: Record<string, string> = {
      'Aries': 'Om Mangalaya Namah',
      'Taurus': 'Om Shukraya Namah',
      'Gemini': 'Om Budhaya Namah',
      'Cancer': 'Om Chandramase Namah',
      'Leo': 'Om Suryaya Namah',
      'Virgo': 'Om Budhaya Namah',
      'Libra': 'Om Shukraya Namah',
      'Scorpio': 'Om Mangalaya Namah',
      'Sagittarius': 'Om Gurave Namah',
      'Capricorn': 'Om Shanaye Namah',
      'Aquarius': 'Om Shanaye Namah',
      'Pisces': 'Om Gurave Namah',
    };

    if (mantraMap[lagna]) {
      mantras.push({
        type: 'mantra',
        name: `Lagna Mantra for ${lagna}`,
        description: `Chant "${mantraMap[lagna]}" 108 times daily`,
        frequency: 'Daily, preferably in the morning',
      });
    }

    if (mantraMap[moonSign] && moonSign !== lagna) {
      mantras.push({
        type: 'mantra',
        name: `Moon Sign Mantra for ${moonSign}`,
        description: `Chant "${mantraMap[moonSign]}" 108 times daily`,
        frequency: 'Daily, preferably in the evening',
      });
    }

    return mantras.length > 0 ? mantras : [
      {
        type: 'mantra',
        name: 'Universal Mantra',
        description: 'Chant "Om Namah Shivaya" 108 times daily for overall well-being',
        frequency: 'Daily',
      },
    ];
  }

  private getFastingDays(chart: any): Remedy[] {
    const fastingDays: Remedy[] = [];
    const moonNakshatra = chart.planets?.find((p: any) => p.planet === 'Moon')?.nakshatra || '';

    const nakshatraFastingMap: Record<string, string> = {
      'Rohini': 'Friday',
      'Mrigashira': 'Tuesday',
      'Ardra': 'Wednesday',
      'Punarvasu': 'Thursday',
      'Pushya': 'Thursday',
      'Ashlesha': 'Saturday',
      'Magha': 'Sunday',
      'Purva Phalguni': 'Friday',
      'Uttara Phalguni': 'Sunday',
      'Hasta': 'Wednesday',
      'Chitra': 'Tuesday',
      'Swati': 'Friday',
      'Vishakha': 'Thursday',
      'Anuradha': 'Saturday',
      'Jyeshta': 'Tuesday',
      'Mula': 'Monday',
      'Purva Ashadha': 'Thursday',
      'Uttara Ashadha': 'Sunday',
      'Shravana': 'Monday',
      'Dhanishta': 'Saturday',
      'Shatabhisha': 'Friday',
      'Purva Bhadrapada': 'Thursday',
      'Uttara Bhadrapada': 'Saturday',
      'Revati': 'Thursday',
    };

    const fastingDay = nakshatraFastingMap[moonNakshatra];
    if (fastingDay) {
      fastingDays.push({
        type: 'fasting',
        name: `${fastingDay} Fasting`,
        description: `Fast on ${fastingDay} based on your birth nakshatra ${moonNakshatra}`,
        frequency: 'Weekly',
      });
    }

    return fastingDays.length > 0 ? fastingDays : [
      {
        type: 'fasting',
        name: 'Ekadashi Fasting',
        description: 'Fast on Ekadashi (11th day of lunar cycle) for spiritual purification',
        frequency: 'Twice a month',
      },
    ];
  }

  private getDonationRecommendations(chart: any): Remedy[] {
    const donations: Remedy[] = [];
    const weakPlanets = this.identifyWeakPlanets(chart);

    const donationMap: Record<string, { item: string; day: string }> = {
      'Sun': { item: 'Wheat, Copper', day: 'Sunday' },
      'Moon': { item: 'Rice, Silver', day: 'Monday' },
      'Mars': { item: 'Red Lentils, Red Cloth', day: 'Tuesday' },
      'Mercury': { item: 'Green Gram, Green Cloth', day: 'Wednesday' },
      'Jupiter': { item: 'Yellow Gram, Yellow Cloth', day: 'Thursday' },
      'Venus': { item: 'White Cloth, Sugar', day: 'Friday' },
      'Saturn': { item: 'Black Sesame, Black Cloth', day: 'Saturday' },
    };

    weakPlanets.forEach((planet) => {
      const donation = donationMap[planet];
      if (donation) {
        donations.push({
          type: 'donation',
          name: `${planet} Donation`,
          description: `Donate ${donation.item} on ${donation.day} to strengthen ${planet}`,
          frequency: 'Weekly',
        });
      }
    });

    return donations.length > 0 ? donations : [
      {
        type: 'donation',
        name: 'General Donation',
        description: 'Donate food, clothes, or money to the needy for overall well-being',
        frequency: 'Monthly',
      },
    ];
  }

  private getRitualRecommendations(chart: any): Remedy[] {
    return [
      {
        type: 'ritual',
        name: 'Daily Prayer',
        description: 'Offer prayers to your Ishta Devata (chosen deity) daily',
        frequency: 'Daily',
      },
      {
        type: 'ritual',
        name: 'Planetary Puja',
        description: 'Perform puja for weak planets on their respective days',
        frequency: 'Weekly',
      },
    ];
  }

  private async getBestTiming(latitude: number, longitude: number): Promise<any> {
    try {
      const calendar = await this.calendarService.getTodayCalendar(latitude, longitude);
      
      return {
        day: 'Thursday',
        time: 'Morning (6 AM - 9 AM)',
        tithi: calendar.tithi,
        nakshatra: calendar.nakshatra,
      };
    } catch (error) {
      return {
        day: 'Thursday',
        time: 'Morning (6 AM - 9 AM)',
      };
    }
  }

  private identifyWeakPlanets(chart: any): string[] {
    const weakPlanets: string[] = [];
    
    const planets = chart.planets || [];
    planets.forEach((planet: any) => {
      const sign = planet.sign?.toLowerCase() || '';
      const planetName = planet.planet;
      
      const debilitatedSigns: Record<string, string[]> = {
        'Sun': ['libra'],
        'Moon': ['scorpio'],
        'Mars': ['cancer'],
        'Mercury': ['pisces'],
        'Jupiter': ['capricorn'],
        'Venus': ['virgo'],
        'Saturn': ['aries'],
      };

      if (debilitatedSigns[planetName]?.includes(sign)) {
        weakPlanets.push(planetName);
      }
    });

    return weakPlanets.length > 0 ? weakPlanets : ['Saturn'];
  }
}

