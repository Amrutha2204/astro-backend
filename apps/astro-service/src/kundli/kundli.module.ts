import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KundliController } from './kundli.controller';
import { KundliService } from './kundli.service';

@Module({
  imports: [ConfigModule],
  controllers: [KundliController],
  providers: [KundliService],
  exports: [KundliService],
})
export class KundliModule {}

