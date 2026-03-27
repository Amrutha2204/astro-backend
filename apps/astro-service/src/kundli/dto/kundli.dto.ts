import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ChartType } from '../../common/utils/coordinates.util';

export class KundliDto {
  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsDateString()
  dob: string;

  @ApiProperty({
    description: 'Time of birth (HH:MM:SS)',
    example: '10:30:00',
  })
  @IsString()
  birthTime: string;

  @ApiProperty({
    description: 'Latitude of birth place',
    example: 28.6139,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude of birth place',
    example: 77.209,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Chart type (diagram style)',
    enum: ChartType,
    default: ChartType.NorthIndian,
  })
  @IsOptional()
  @IsEnum(ChartType)
  chartType?: ChartType;

  @ApiPropertyOptional({
    description: 'Which chart to show: lagna (D-1), navamsa (D-9), saptamsa (D-7), dasamsa (D-10), etc. Only for Vedic.',
    example: 'lagna',
  })
  @IsOptional()
  @IsString()
  chart?: string;
}

