import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Amount in INR (rupees)' })
  @IsNumber()
  @Min(1)
  amountRupees: number;

  @ApiPropertyOptional({ description: 'Short description for the order' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  description?: string;

  @ApiPropertyOptional({ description: 'Optional receipt id for your reference' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  receipt?: string;
}
