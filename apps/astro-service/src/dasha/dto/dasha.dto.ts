import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class DashaDto {
  @ApiProperty({ description: 'Year of birth', example: 1990 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Month of birth (1-12)', example: 5 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Day of birth', example: 15 })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @ApiProperty({ description: 'Hour of birth (0-23)', example: 10, required: false })
  @IsInt()
  @Min(0)
  @Max(23)
  @IsOptional()
  hour?: number;

  @ApiProperty({ description: 'Minute of birth (0-59)', example: 30, required: false })
  @IsInt()
  @Min(0)
  @Max(59)
  @IsOptional()
  minute?: number;

  @ApiProperty({ description: 'Latitude of birth place', example: 28.6139 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude of birth place', example: 77.209 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

