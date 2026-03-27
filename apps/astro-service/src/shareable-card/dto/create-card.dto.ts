import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';

export enum CardType {
  Horoscope = 'horoscope',
  KundliSummary = 'kundli_summary',
}

export class CreateCardDto {
  @ApiProperty({
    description: 'Type of card to generate',
    enum: CardType,
    example: CardType.Horoscope,
  })
  @IsEnum(CardType)
  type: CardType;

  @ApiPropertyOptional({
    description: 'Title shown on the card',
    example: "Today's Horoscope",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Date label (e.g. 2024-02-15)',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Payload for the card (e.g. dayType, mainTheme, reason for horoscope)',
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
