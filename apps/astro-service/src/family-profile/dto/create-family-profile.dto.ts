import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateFamilyProfileDto {
  @ApiProperty({ description: 'Display name of the family member', example: 'Rahul' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ description: 'Date of birth (YYYY-MM-DD)', example: '1995-06-15' })
  @IsDateString()
  dob: string;

  @ApiProperty({ description: 'Place of birth (city)', example: 'Mumbai' })
  @IsString()
  @Length(1, 255)
  birthPlace: string;

  @ApiPropertyOptional({ description: 'Time of birth (HH:mm or HH:mm:ss)', example: '14:30:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,2}:\d{2}(:\d{2})?$/, { message: 'birthTime must be HH:mm or HH:mm:ss' })
  birthTime?: string;

  @ApiPropertyOptional({ description: 'Relation e.g. spouse, child, parent', example: 'spouse' })
  @IsOptional()
  @IsString()
  @Length(0, 64)
  relation?: string;
}
