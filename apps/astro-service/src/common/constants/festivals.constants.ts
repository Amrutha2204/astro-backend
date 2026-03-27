/**
 * Indian festivals – Gregorian date approximations (month 1–12, day 1–31).
 * Used for listing festivals by date or month.
 */

export interface FestivalEntry {
  name: string;
  month: number;
  day: number;
  /** Optional: lunar/tithi-based note; date is approximate */
  note?: string;
}

/** Major Indian festivals by approximate Gregorian date (repeats yearly). */
export const FESTIVALS_BY_MONTH_DAY: FestivalEntry[] = [
  { name: 'Makar Sankranti', month: 1, day: 14, note: 'Solar; date varies slightly' },
  { name: 'Pongal', month: 1, day: 14 },
  { name: 'Republic Day', month: 1, day: 26 },
  { name: 'Basant Panchami', month: 1, day: 26, note: 'Varies by lunar calendar' },
  { name: 'Maha Shivaratri', month: 2, day: 18, note: 'Lunar; date varies' },
  { name: 'Holi', month: 3, day: 8, note: 'Lunar; Phalguna Purnima' },
  { name: 'Ugadi / Gudi Padwa', month: 3, day: 22, note: 'Lunar new year; date varies' },
  { name: 'Ram Navami', month: 4, day: 6, note: 'Lunar; Chaitra Shukla 9' },
  { name: 'Mahavir Jayanti', month: 4, day: 10, note: 'Lunar; date varies' },
  { name: 'Akshaya Tritiya', month: 4, day: 21, note: 'Lunar; date varies' },
  { name: 'Buddha Purnima', month: 5, day: 12, note: 'Lunar; Vaishakha Purnima' },
  { name: 'Eid ul-Fitr', month: 4, day: 1, note: 'Islamic; date varies yearly' },
  { name: 'Vat Savitri', month: 5, day: 22, note: 'Lunar; date varies' },
  { name: 'Rath Yatra', month: 7, day: 7, note: 'Lunar; Ashadha Shukla 2' },
  { name: 'Guru Purnima', month: 7, day: 21, note: 'Lunar; Ashadha Purnima' },
  { name: 'Eid ul-Adha', month: 6, day: 17, note: 'Islamic; date varies yearly' },
  { name: 'Independence Day', month: 8, day: 15 },
  { name: 'Raksha Bandhan', month: 8, day: 9, note: 'Lunar; Shravana Purnima' },
  { name: 'Janmashtami', month: 8, day: 16, note: 'Lunar; date varies' },
  { name: 'Ganesh Chaturthi', month: 9, day: 7, note: 'Lunar; Bhadrapada Shukla 4' },
  { name: 'Onam', month: 9, day: 5, note: 'Solar; date varies' },
  { name: 'Mahalaya Amavasya', month: 9, day: 24, note: 'Lunar; Pitru Paksha' },
  { name: 'Navratri begins', month: 10, day: 3, note: 'Lunar; Ashwin Shukla 1' },
  { name: 'Dussehra (Vijayadashami)', month: 10, day: 12, note: 'Lunar; Ashwin Shukla 10' },
  { name: 'Karwa Chauth', month: 10, day: 20, note: 'Lunar; date varies' },
  { name: 'Dhanteras', month: 10, day: 29, note: 'Lunar; Krishna Trayodashi' },
  { name: 'Naraka Chaturdashi (Choti Diwali)', month: 10, day: 31, note: 'Lunar' },
  { name: 'Diwali (Lakshmi Puja)', month: 11, day: 1, note: 'Lunar; Kartik Amavasya' },
  { name: 'Govardhan Puja', month: 11, day: 2, note: 'Lunar; Kartik Shukla 1' },
  { name: 'Bhai Dooj', month: 11, day: 3, note: 'Lunar; Kartik Shukla 2' },
  { name: 'Chhath Puja', month: 11, day: 5, note: 'Lunar; date varies' },
  { name: 'Guru Nanak Jayanti', month: 11, day: 15, note: 'Lunar; Kartik Purnima' },
  { name: 'Christmas', month: 12, day: 25 },
  { name: 'Muharram', month: 7, day: 17, note: 'Islamic; date varies yearly' },
];
