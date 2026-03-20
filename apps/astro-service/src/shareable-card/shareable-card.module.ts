import { Module } from '@nestjs/common';
import { ShareableCardController } from './shareable-card.controller';
import { ShareableCardService } from './shareable-card.service';

@Module({
  controllers: [ShareableCardController],
  providers: [ShareableCardService],
  exports: [ShareableCardService],
})
export class ShareableCardModule {}
