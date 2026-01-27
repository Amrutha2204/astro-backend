/**
 * Constants for astrological remedy recommendations.
 */

export const GEMSTONE_MAP: Record<string, string> = {
  Sun: 'Ruby',
  Moon: 'Pearl',
  Mars: 'Red Coral',
  Mercury: 'Emerald',
  Jupiter: 'Yellow Sapphire',
  Venus: 'Diamond',
  Saturn: 'Blue Sapphire',
  Rahu: 'Hessonite',
  Ketu: "Cat's Eye",
};

export const MANTRA_MAP: Record<string, string> = {
  Aries: 'Om Mangalaya Namah',
  Taurus: 'Om Shukraya Namah',
  Gemini: 'Om Budhaya Namah',
  Cancer: 'Om Chandramase Namah',
  Leo: 'Om Suryaya Namah',
  Virgo: 'Om Budhaya Namah',
  Libra: 'Om Shukraya Namah',
  Scorpio: 'Om Mangalaya Namah',
  Sagittarius: 'Om Gurave Namah',
  Capricorn: 'Om Shanaye Namah',
  Aquarius: 'Om Shanaye Namah',
  Pisces: 'Om Gurave Namah',
};

/** Nakshatra to recommended fasting weekday. */
export const NAKSHATRA_FASTING_MAP: Record<string, string> = {
  Rohini: 'Friday', Mrigashira: 'Tuesday', Ardra: 'Wednesday', Punarvasu: 'Thursday',
  Pushya: 'Thursday', Ashlesha: 'Saturday', Magha: 'Sunday', 'Purva Phalguni': 'Friday',
  'Uttara Phalguni': 'Sunday', Hasta: 'Wednesday', Chitra: 'Tuesday', Swati: 'Friday',
  Vishakha: 'Thursday', Anuradha: 'Saturday', Jyeshta: 'Tuesday', Mula: 'Monday',
  'Purva Ashadha': 'Thursday', 'Uttara Ashadha': 'Sunday', Shravana: 'Monday',
  Dhanishta: 'Saturday', Shatabhisha: 'Friday', 'Purva Bhadrapada': 'Thursday',
  'Uttara Bhadrapada': 'Saturday', Revati: 'Thursday',
};

export const DONATION_MAP: Record<string, { item: string; day: string }> = {
  Sun: { item: 'Wheat, Copper', day: 'Sunday' },
  Moon: { item: 'Rice, Silver', day: 'Monday' },
  Mars: { item: 'Red Lentils, Red Cloth', day: 'Tuesday' },
  Mercury: { item: 'Green Gram, Green Cloth', day: 'Wednesday' },
  Jupiter: { item: 'Yellow Gram, Yellow Cloth', day: 'Thursday' },
  Venus: { item: 'White Cloth, Sugar', day: 'Friday' },
  Saturn: { item: 'Black Sesame, Black Cloth', day: 'Saturday' },
};

/** Planet to debilitation signs (lowercase). */
export const DEBILITATED_SIGNS: Record<string, string[]> = {
  Sun: ['libra'],
  Moon: ['scorpio'],
  Mars: ['cancer'],
  Mercury: ['pisces'],
  Jupiter: ['capricorn'],
  Venus: ['virgo'],
  Saturn: ['aries'],
};
