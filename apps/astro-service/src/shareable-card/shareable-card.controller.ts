import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ShareableCardService, StoredCard } from './shareable-card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/shareable-card')
@ApiTags('Shareable Card')
export class ShareableCardController {
  constructor(private readonly shareableCardService: ShareableCardService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a shareable card image (and PDF) from horoscope or kundli summary',
  })
  @ApiOkResponse({ description: 'Card created; returns image and PDF URLs' })
  async createCard(
    @CurrentUser() user: any,
    @Body() dto: CreateCardDto,
  ): Promise<StoredCard> {
    return this.shareableCardService.createAndStore(dto);
  }

  @Get('file/:filename')
  @ApiOperation({
    summary: 'Serve a stored card file (PNG or PDF) by filename',
  })
  async getFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    const buffer = this.shareableCardService.readFile(safeName);
    if (!buffer) {
      throw new NotFoundException('File not found');
    }
    const isPdf = safeName.toLowerCase().endsWith('.pdf');
    res.set({
      'Content-Type': isPdf ? 'application/pdf' : 'image/png',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
