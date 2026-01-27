import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MinLength } from 'class-validator';

export class GuestKundliRequestDto {
  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsDateString()
  dob: string;

  @ApiProperty({
    description: 'Time of birth (HH:MM or HH:MM:SS, 24-hour)',
    example: '10:30:00',
  })
  @IsString()
  birthTime: string;

  @ApiProperty({
    description: 'Place of birth (city name, min 3 characters)',
    example: 'Mumbai',
    minLength: 3,
  })
  @IsString()
  @MinLength(3, { message: 'Place of birth must be at least 3 characters' })
  placeOfBirth: string;
}
