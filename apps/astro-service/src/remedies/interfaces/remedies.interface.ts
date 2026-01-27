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
