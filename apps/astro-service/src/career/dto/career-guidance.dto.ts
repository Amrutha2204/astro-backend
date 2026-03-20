import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CareerGuidanceDto {
  @ApiPropertyOptional({
    description: 'Family profile id to use for birth data. If omitted, uses main user details.',
  })
  @IsOptional()
  @IsUUID()
  profileId?: string;
}
