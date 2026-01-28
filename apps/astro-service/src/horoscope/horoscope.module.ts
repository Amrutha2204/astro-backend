import { Module } from '@nestjs/common';
import { HoroscopeController } from './horoscope.controller';
import { HoroscopeService } from './horoscope.service';
import { HoroscopeRuleModule } from '../horoscope-rule/horoscope-rule.module';

@Module({
  imports: [HoroscopeRuleModule],
  controllers: [HoroscopeController],
  providers: [HoroscopeService],
  exports: [HoroscopeService],
})
export class HoroscopeModule {}

