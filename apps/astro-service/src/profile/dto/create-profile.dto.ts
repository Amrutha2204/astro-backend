import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({
    description: 'Profile name (optional, defaults to user name)',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-05-15',
  })
  @IsDateString()
  dob: string;

  @ApiProperty({
    description: 'Place of birth (city name)',
    example: 'Delhi',
  })
  @IsString()
  birthPlace: string;

  @ApiProperty({
    description: 'Time of birth (HH:MM:SS)',
    example: '10:30:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  birthTime?: string;

  @ApiProperty({
    description: 'Latitude of birth place',
    example: 28.6139,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude of birth place',
    example: 77.209,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: 'Timezone',
    example: 'Asia/Kolkata',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    description: 'Set as primary profile',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({
    description: 'Additional notes',
    example: 'My personal profile',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

