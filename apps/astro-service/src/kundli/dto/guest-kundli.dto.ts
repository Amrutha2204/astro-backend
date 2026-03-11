import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsString, MinLength, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class GuestKundliRequestDto {
  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsDateString()
  dob: string;

  @ApiPropertyOptional({
    description: 'Time of birth (HH:MM or HH:MM:SS, 24-hour). Omit or use unknownTime when not known; noon (12:00) is used as fallback.',
    example: '10:30:00',
  })
  @IsOptional()
  @IsString()
  birthTime?: string;

  @ApiPropertyOptional({
    description: 'Set to true when birth time is not known; chart will use 12:00 (noon) for calculations.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  unknownTime?: boolean;

  @ApiProperty({
    description: 'Place of birth (city name, min 3 characters)',
    example: 'Mumbai',
    minLength: 3,
  })
  @IsString()
  @MinLength(3, { message: 'Place of birth must be at least 3 characters' })
  placeOfBirth: string;

  @ApiPropertyOptional({
    description: 'Chart system: vedic (sidereal) or western (tropical). Default vedic.',
    enum: ['vedic', 'western'],
  })
  @IsOptional()
  @IsIn(['vedic', 'western'], { message: 'system must be vedic or western' })
  system?: 'vedic' | 'western';

  @ApiPropertyOptional({
    description: 'Vedic chart variant: lagna (D-1), navamsa (D-9), saptamsa (D-7), dasamsa (D-10), etc. Ignored when system is western.',
    example: 'lagna',
  })
  @IsOptional()
  @IsString()
  chart?: string;
}
