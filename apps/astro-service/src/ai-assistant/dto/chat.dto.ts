import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({
    description: 'User question about astrology',
    example: 'Why is today important for me?',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  question: string;

  @ApiPropertyOptional({
    description: 'Optional context for the question',
    example: 'daily',
    enum: ['daily', 'weekly', 'relationships', 'career', 'wellness'],
  })
  @IsOptional()
  @IsString()
  context?: string;
}

