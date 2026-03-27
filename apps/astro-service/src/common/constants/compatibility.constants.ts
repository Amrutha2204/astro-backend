/**
 * Constants for Guna Milan and compatibility calculations.
 */

/** Varna: Sun sign to varna number (1–4). */
export const VARNA_MAP: Record<string, number> = {
  Aries: 1, Leo: 1, Sagittarius: 1,
  Taurus: 2, Virgo: 2, Capricorn: 2,
  Gemini: 3, Libra: 3, Aquarius: 3,
  Cancer: 4, Scorpio: 4, Pisces: 4,
};

/** Vashya: Moon sign to element group (1=Fire, 2=Earth, 3=Air, 4=Water). */
export const VASHYA_GROUPS: Record<string, number> = {
  Aries: 1, Leo: 1, Sagittarius: 1,
  Taurus: 2, Virgo: 2, Capricorn: 2,
  Gemini: 3, Libra: 3, Aquarius: 3,
  Cancer: 4, Scorpio: 4, Pisces: 4,
};

/** Tara: favorable tara numbers (1–9 system). */
export const GOOD_TARAS = [1, 3, 5, 7, 9] as const;

/** Tara: unfavorable tara numbers (1–9 system). */
export const BAD_TARAS = [2, 4, 6, 8] as const;

/** Yoni: nakshatra to yoni animal. */
export const YONI_MAP: Record<string, string> = {
  Ashwini: 'Horse', Bharani: 'Elephant', Krittika: 'Goat', Rohini: 'Serpent',
  Mrigashira: 'Serpent', Ardra: 'Dog', Punarvasu: 'Cat', Pushya: 'Goat',
  Ashlesha: 'Cat', Magha: 'Rat', 'Purva Phalguni': 'Rat', 'Uttara Phalguni': 'Cow',
  Hasta: 'Buffalo', Chitra: 'Tiger', Swati: 'Buffalo', Vishakha: 'Tiger',
  Anuradha: 'Deer', Jyeshta: 'Hare', Mula: 'Dog', 'Purva Ashadha': 'Monkey',
  'Uttara Ashadha': 'Mongoose', Shravana: 'Monkey', Dhanishta: 'Lion', Shatabhisha: 'Horse',
  'Purva Bhadrapada': 'Lion', 'Uttara Bhadrapada': 'Cow', Revati: 'Elephant',
};

/** Yoni: each animal to compatible yoni animals. */
export const COMPATIBLE_YONI_PAIRS: Record<string, string[]> = {
  Horse: ['Horse', 'Elephant'],
  Elephant: ['Elephant', 'Horse'],
  Goat: ['Goat', 'Serpent'],
  Serpent: ['Serpent', 'Goat'],
  Dog: ['Dog', 'Cat'],
  Cat: ['Cat', 'Dog'],
  Rat: ['Rat', 'Cow'],
  Cow: ['Cow', 'Rat'],
  Buffalo: ['Buffalo', 'Tiger'],
  Tiger: ['Tiger', 'Buffalo'],
  Deer: ['Deer', 'Hare'],
  Hare: ['Hare', 'Deer'],
  Monkey: ['Monkey', 'Mongoose'],
  Mongoose: ['Mongoose', 'Monkey'],
  Lion: ['Lion', 'Horse'],
};

/** Graha Maitri: Moon sign to element group (1=Fire, 2=Earth, 3=Air, 4=Water). */
export const SIGN_GROUPS: Record<string, number> = {
  Aries: 1, Leo: 1, Sagittarius: 1,
  Taurus: 2, Virgo: 2, Capricorn: 2,
  Gemini: 3, Libra: 3, Aquarius: 3,
  Cancer: 4, Scorpio: 4, Pisces: 4,
};

/** Gana: nakshatra to Deva / Manushya / Rakshasa. */
export const GANA_MAP: Record<string, string> = {
  Ashwini: 'Deva', Bharani: 'Manushya', Krittika: 'Rakshasa', Rohini: 'Manushya',
  Mrigashira: 'Deva', Ardra: 'Manushya', Punarvasu: 'Deva', Pushya: 'Deva',
  Ashlesha: 'Rakshasa', Magha: 'Rakshasa', 'Purva Phalguni': 'Manushya', 'Uttara Phalguni': 'Manushya',
  Hasta: 'Deva', Chitra: 'Rakshasa', Swati: 'Rakshasa', Vishakha: 'Rakshasa',
  Anuradha: 'Deva', Jyeshta: 'Rakshasa', Mula: 'Rakshasa', 'Purva Ashadha': 'Manushya',
  'Uttara Ashadha': 'Manushya', Shravana: 'Deva', Dhanishta: 'Rakshasa', Shatabhisha: 'Rakshasa',
  'Purva Bhadrapada': 'Manushya', 'Uttara Bhadrapada': 'Manushya', Revati: 'Deva',
};

/** Full explanation of each Guna Milan parameter (for compatibility modal). */
export const GUNA_PARAMETER_MEANINGS: Record<string, string> = {
  Varna: 'Varna represents the compatibility of the couple\'s social and spiritual values based on their Sun signs. It is derived from the four varnas (Brahmin, Kshatriya, Vaishya, Shudra) and indicates harmony in outlook and life goals.',
  Vashya: 'Vashya indicates mutual attraction and control dynamics between partners based on their Moon signs. It is derived from five animal groups and reflects how well the couple can influence and understand each other.',
  Tara: 'Tara (star) is calculated from the couple\'s birth nakshatras in the 9-point system. It indicates destiny compatibility and whether the marriage will be favorable, neutral, or challenging in terms of longevity and happiness.',
  Yoni: 'Yoni represents sexual and emotional compatibility based on the nakshatra-derived animal symbols. Compatible yoni pairs suggest harmony in intimacy and temperament; incompatible pairs may need understanding and remedies.',
  'Graha Maitri': 'Graha Maitri (planetary friendship) is based on the Moon signs of both partners. It reflects mental compatibility, mutual respect, and whether the couple will be natural friends, neutral, or at odds in daily life.',
  Gana: 'Gana divides nakshatras into Deva (divine), Manushya (human), and Rakshasa (demonic) groups. Same or compatible gana suggests harmony; Deva-Rakshasa match is considered inauspicious and may require remedies.',
  Bhakoot: 'Bhakoot is derived from the Moon signs of both partners. Certain sign combinations (6th, 8th, or 12th from each other) create Bhakoot dosha, which may indicate challenges in financial or emotional compatibility if not remedied.',
  Nadi: 'Nadi is based on the nakshatra grouping into Vata, Pitta, and Kapha (the three nadis). Same Nadi is considered a serious dosha affecting health and progeny; different Nadis indicate good compatibility in these areas.',
};
