import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({
    description: 'Report type',
    enum: ['kundli_summary', 'compatibility_summary'],
    example: 'kundli_summary',
  })
  @IsString()
  @IsIn(['kundli_summary', 'compatibility_summary'])
  reportType: 'kundli_summary' | 'compatibility_summary';
}
