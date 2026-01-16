import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DoshaController } from './dosha.controller';
import { DoshaService } from './dosha.service';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';

@Module({
  imports: [ConfigModule, AstrologyEngineModule],
  controllers: [DoshaController],
  providers: [DoshaService],
  exports: [DoshaService],
})
export class DoshaModule {}

