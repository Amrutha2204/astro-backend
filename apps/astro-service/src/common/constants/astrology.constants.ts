/**
 * Astrology-related enums and constants shared across the astro-service.
 */

export enum HouseSystem {
  Placidus = 'P',
  Koch = 'K',
  Equal = 'E',
  WholeSign = 'W',
}

/** Maps string input (names or codes) to HouseSystem enum. */
export const HOUSE_SYSTEM_MAP: Record<string, HouseSystem> = {
  placidus: HouseSystem.Placidus,
  koch: HouseSystem.Koch,
  equal: HouseSystem.Equal,
  'whole-sign': HouseSystem.WholeSign,
  wholeSign: HouseSystem.WholeSign,
  P: HouseSystem.Placidus,
  p: HouseSystem.Placidus,
  K: HouseSystem.Koch,
  k: HouseSystem.Koch,
  E: HouseSystem.Equal,
  e: HouseSystem.Equal,
  W: HouseSystem.WholeSign,
  w: HouseSystem.WholeSign,
};

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshta',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

/** Nakshatra to Vimshottari Dasha ruling planet. */
export const NAKSHATRA_PLANET_MAP: Record<string, string> = {
  Ashwini: 'Ketu',
  Bharani: 'Venus',
  Krittika: 'Sun',
  Rohini: 'Moon',
  Mrigashira: 'Mars',
  Ardra: 'Rahu',
  Punarvasu: 'Jupiter',
  Pushya: 'Saturn',
  Ashlesha: 'Mercury',
  Magha: 'Ketu',
  'Purva Phalguni': 'Venus',
  'Uttara Phalguni': 'Sun',
  Hasta: 'Moon',
  Chitra: 'Mars',
  Swati: 'Rahu',
  Vishakha: 'Jupiter',
  Anuradha: 'Saturn',
  Jyeshta: 'Mercury',
  Mula: 'Ketu',
  'Purva Ashadha': 'Venus',
  'Uttara Ashadha': 'Sun',
  Shravana: 'Moon',
  Dhanishta: 'Mars',
  Shatabhisha: 'Rahu',
  'Purva Bhadrapada': 'Jupiter',
  'Uttara Bhadrapada': 'Saturn',
  Revati: 'Mercury',
};

/** Nakshatra to Nadi group (Vata, Pitta, Kapha) for Nadi dosha. */
export const NADI_GROUPS: Record<string, string> = {
  Ashwini: 'Vata',
  Bharani: 'Vata',
  Krittika: 'Vata',
  Rohini: 'Kapha',
  Mrigashira: 'Kapha',
  Ardra: 'Kapha',
  Punarvasu: 'Vata',
  Pushya: 'Vata',
  Ashlesha: 'Vata',
  Magha: 'Pitta',
  'Purva Phalguni': 'Pitta',
  'Uttara Phalguni': 'Pitta',
  Hasta: 'Vata',
  Chitra: 'Vata',
  Swati: 'Vata',
  Vishakha: 'Pitta',
  Anuradha: 'Pitta',
  Jyeshta: 'Pitta',
  Mula: 'Kapha',
  'Purva Ashadha': 'Kapha',
  'Uttara Ashadha': 'Kapha',
  Shravana: 'Vata',
  Dhanishta: 'Vata',
  Shatabhisha: 'Vata',
  'Purva Bhadrapada': 'Pitta',
  'Uttara Bhadrapada': 'Pitta',
  Revati: 'Pitta',
};

/** Zodiac sign (lowercase) to number 1–12 for Bhakoot and similar calculations. */
export const SIGN_NUMBERS: Record<string, number> = {
  aries: 1, taurus: 2, gemini: 3, cancer: 4,
  leo: 5, virgo: 6, libra: 7, scorpio: 8,
  sagittarius: 9, capricorn: 10, aquarius: 11, pisces: 12,
  Aries: 1, Taurus: 2, Gemini: 3, Cancer: 4,
  Leo: 5, Virgo: 6, Libra: 7, Scorpio: 8,
  Sagittarius: 9, Capricorn: 10, Aquarius: 11, Pisces: 12,
};

/** Manglik dosha: Mars in these signs indicates dosha. */
export const MANGLIK_SIGNS = ['aries', 'scorpio', 'capricorn'] as const;

/** Manglik dosha: Mars in these houses indicates dosha. */
export const MANGLIK_HOUSES = [1, 4, 7, 8, 12] as const;

/** Vimshottari Dasha planet order. */
export const DASHA_ORDER = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
  'Rahu', 'Jupiter', 'Saturn', 'Mercury',
] as const;

/** Vimshottari Dasha duration in years per planet. */
export const DASHA_DURATIONS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

/** Beneficial signs for Jupiter/Venus (e.g. auspicious day). */
export const BENEFICIAL_SIGNS = ['Cancer', 'Leo', 'Sagittarius', 'Pisces'] as const;

/** Beneficial planets for day-type scoring. */
export const BENEFICIAL_PLANETS = ['jupiter', 'venus', 'mercury'] as const;

/** Challenging planets for day-type scoring. */
export const CHALLENGING_PLANETS = ['saturn', 'mars', 'rahu', 'ketu'] as const;

/**
 * Vedic divisional chart types (D-charts).
 * Key = API value, value = { divisor, label }.
 * D-1 = Lagna/Rasi, D-9 = Navamsa, etc.
 */
export const DIVISIONAL_CHARTS: Record<string, { divisor: number; label: string }> = {
  lagna: { divisor: 1, label: 'Lagna (D-1)' },
  navamsa: { divisor: 9, label: 'Navamsa (D-9)' },
  saptamsa: { divisor: 7, label: 'Saptamsa (D-7)' },
  dasamsa: { divisor: 10, label: 'Dasamsa (D-10)' },
  dwadasamsa: { divisor: 12, label: 'Dwadasamsa (D-12)' },
  shodasamsa: { divisor: 16, label: 'Shodasamsa (D-16)' },
  vimsamsa: { divisor: 20, label: 'Vimsamsa (D-20)' },
  chaturvimsamsa: { divisor: 24, label: 'Chaturvimsamsa (D-24)' },
  trimsamsa: { divisor: 30, label: 'Trimsamsa (D-30)' },
};

/** House number (1–12) to life-area meaning for Kundli display. */
export const HOUSE_MEANINGS: Record<number, string> = {
  1: 'Personality, Self',
  2: 'Money, Speech',
  3: 'Courage, Communication',
  4: 'Home, Family',
  5: 'Education, Creativity',
  6: 'Health, Enemies',
  7: 'Marriage, Relationships',
  8: 'Transformation',
  9: 'Luck, Wisdom',
  10: 'Career, Reputation',
  11: 'Network, Friends',
  12: 'Spirituality, Isolation',
};
