import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum ZodiacSign {
  Aries = 'aries',
  Taurus = 'taurus',
  Gemini = 'gemini',
  Cancer = 'cancer',
  Leo = 'leo',
  Virgo = 'virgo',
  Libra = 'libra',
  Scorpio = 'scorpio',
  Sagittarius = 'sagittarius',
  Capricorn = 'capricorn',
  Aquarius = 'aquarius',
  Pisces = 'pisces',
}

export class DailyHoroscopeDto {
  @ApiProperty({
    description: 'Zodiac sign',
    enum: ZodiacSign,
    example: ZodiacSign.Aries,
  })
  @IsEnum(ZodiacSign)
  sign: ZodiacSign;

  @ApiProperty({
    description: 'Date for horoscope (YYYY-MM-DD). Defaults to today if not provided',
    required: false,
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}

