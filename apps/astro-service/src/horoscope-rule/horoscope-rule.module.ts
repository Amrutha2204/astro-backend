import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HoroscopeRuleController } from './horoscope-rule.controller';
import { HoroscopeRuleService } from './horoscope-rule.service';
import { NatalChartModule } from '../natal-chart/natal-chart.module';
import { TransitsModule } from '../transits/transits.module';

@Module({
  imports: [ConfigModule, NatalChartModule, TransitsModule],
  controllers: [HoroscopeRuleController],
  providers: [HoroscopeRuleService],
  exports: [HoroscopeRuleService],
})
export class HoroscopeRuleModule {}

