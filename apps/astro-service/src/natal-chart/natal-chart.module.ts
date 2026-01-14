import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NatalChartController } from './natal-chart.controller';
import { NatalChartService } from './natal-chart.service';
import { KundliModule } from '../kundli/kundli.module';

@Module({
  imports: [ConfigModule, KundliModule],
  controllers: [NatalChartController],
  providers: [NatalChartService],
  exports: [NatalChartService],
})
export class NatalChartModule {}

