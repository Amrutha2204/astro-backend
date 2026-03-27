import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KundliController } from './kundli.controller';
import { KundliService } from './kundli.service';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';

@Module({
  imports: [ConfigModule, AstrologyEngineModule],
  controllers: [KundliController],
  providers: [KundliService],
  exports: [KundliService],
})
export class KundliModule {}

