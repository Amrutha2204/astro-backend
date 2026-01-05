import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateGuestDto {
  @ApiProperty({ description: 'Guest name', minLength: 1, maxLength: 255 })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ description: 'Date of birth (YYYY-MM-DD)' })
  @IsDateString()
  dob: string;

  @ApiProperty({ description: 'Birth place', minLength: 1, maxLength: 255 })
  @IsString()
  @Length(1, 255)
  birthPlace: string;

  @ApiPropertyOptional({ description: 'Birth time (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  birthTime?: string;
}
