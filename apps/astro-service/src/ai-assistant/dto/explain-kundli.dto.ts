import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExplainKundliDto {
  @ApiPropertyOptional({
    description: 'Focus area for explanation',
    example: 'overall',
    enum: ['overall', 'sun-sign', 'moon-sign', 'ascendant', 'houses', 'planets'],
  })
  @IsOptional()
  @IsString()
  focus?: string;
}

