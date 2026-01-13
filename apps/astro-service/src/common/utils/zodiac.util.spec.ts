import { getZodiacSignFromDateOfBirth, ZodiacSign } from './zodiac.util';

describe('ZodiacUtil', () => {
  describe('getZodiacSignFromDateOfBirth', () => {
    it('should return Aries for March 21', () => {
      const dob = new Date('2000-03-21');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Aries);
    });

    it('should return Aries for April 19', () => {
      const dob = new Date('2000-04-19');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Aries);
    });

    it('should return Taurus for April 20', () => {
      const dob = new Date('2000-04-20');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Taurus);
    });

    it('should return Taurus for May 20', () => {
      const dob = new Date('2000-05-20');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Taurus);
    });

    it('should return Gemini for May 21', () => {
      const dob = new Date('2000-05-21');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Gemini);
    });

    it('should return Cancer for June 21', () => {
      const dob = new Date('2000-06-21');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Cancer);
    });

    it('should return Leo for July 23', () => {
      const dob = new Date('2000-07-23');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Leo);
    });

    it('should return Virgo for August 23', () => {
      const dob = new Date('2000-08-23');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Virgo);
    });

    it('should return Libra for September 23', () => {
      const dob = new Date('2000-09-23');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Libra);
    });

    it('should return Scorpio for October 23', () => {
      const dob = new Date('2000-10-23');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Scorpio);
    });

    it('should return Sagittarius for November 22', () => {
      const dob = new Date('2000-11-22');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Sagittarius);
    });

    it('should return Capricorn for December 22', () => {
      const dob = new Date('2000-12-22');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Capricorn);
    });

    it('should return Capricorn for January 19', () => {
      const dob = new Date('2000-01-19');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Capricorn);
    });

    it('should return Aquarius for January 20', () => {
      const dob = new Date('2000-01-20');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Aquarius);
    });

    it('should return Aquarius for February 18', () => {
      const dob = new Date('2000-02-18');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Aquarius);
    });

    it('should return Pisces for February 19', () => {
      const dob = new Date('2000-02-19');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Pisces);
    });

    it('should return Pisces for March 20', () => {
      const dob = new Date('2000-03-20');
      expect(getZodiacSignFromDateOfBirth(dob)).toBe(ZodiacSign.Pisces);
    });
  });
});

