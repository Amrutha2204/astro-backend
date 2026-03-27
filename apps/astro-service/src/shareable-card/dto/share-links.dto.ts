import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class ShareLinksRequestDto {
  @ApiProperty({ description: 'Public URL of the card image or page to share' })
  @IsString()
  @IsUrl({ require_tld: false })
  url: string;

  @ApiPropertyOptional({ description: 'Short title or message for the share post' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
