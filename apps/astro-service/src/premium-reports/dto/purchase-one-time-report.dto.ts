import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, ValidateNested, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PartnerForReportDto {
  @ApiProperty({ description: 'Year of birth', example: 1992 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Month (1-12)', example: 8 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Day of birth', example: 20 })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @ApiPropertyOptional({ description: 'Hour (0-23)', example: 14 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  hour?: number;

  @ApiPropertyOptional({ description: 'Minute (0-59)', example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
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

export class CompatibilityPartnersDto {
  @ApiProperty({ type: PartnerForReportDto })
  @ValidateNested()
  @Type(() => PartnerForReportDto)
  partner1: PartnerForReportDto;

  @ApiProperty({ type: PartnerForReportDto })
  @ValidateNested()
  @Type(() => PartnerForReportDto)
  partner2: PartnerForReportDto;
}

export class PurchaseOneTimeReportDto {
  @ApiProperty({
    description: 'Report type',
    enum: ['kundli_summary', 'compatibility_summary'],
    example: 'kundli_summary',
  })
  @IsString()
  @IsIn(['kundli_summary', 'compatibility_summary'])
  reportType: 'kundli_summary' | 'compatibility_summary';

  @ApiPropertyOptional({
    description: 'Required for compatibility_summary: partner birth details',
    type: CompatibilityPartnersDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompatibilityPartnersDto)
  compatibilityPartners?: CompatibilityPartnersDto;
}
