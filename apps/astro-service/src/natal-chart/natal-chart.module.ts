import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NatalChartController } from './natal-chart.controller';
import { NatalChartService } from './natal-chart.service';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';

@Module({
  imports: [ConfigModule, AstrologyEngineModule],
  controllers: [NatalChartController],
  providers: [NatalChartService],
  exports: [NatalChartService],
})
export class NatalChartModule {}

