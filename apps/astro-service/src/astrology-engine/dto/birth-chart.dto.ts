import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { HouseSystem } from '../../common/constants/astrology.constants';

export { HouseSystem } from '../../common/constants/astrology.constants';

export class BirthChartDto {
  @ApiProperty({
    description: 'Year of birth',
    example: 1990,
    minimum: 1900,
    maximum: 2100,
  })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Month of birth (1-12)',
    example: 5,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Day of birth',
    example: 15,
    minimum: 1,
    maximum: 31,
  })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @ApiProperty({
    description: 'Hour of birth (0-23)',
    example: 10,
    minimum: 0,
    maximum: 23,
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(23)
  @IsOptional()
  hour?: number;

  @ApiProperty({
    description: 'Minute of birth (0-59)',
    example: 30,
    minimum: 0,
    maximum: 59,
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(59)
  @IsOptional()
  minute?: number;

  @ApiProperty({
    description: 'Latitude of birth place',
    example: 28.6139,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude of birth place',
    example: 77.209,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'House system to use (P=Placidus, K=Koch, E=Equal, W=WholeSign) or use names: placidus, koch, equal, whole-sign',
    enum: HouseSystem,
    required: false,
    default: HouseSystem.Placidus,
    example: 'P',
  })
  @IsOptional()
  houseSystem?: HouseSystem | string;
}

