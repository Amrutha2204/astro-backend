import { Module } from '@nestjs/common';
import { HoroscopeController } from './horoscope.controller';
import { HoroscopeService } from './horoscope.service';

@Module({
  controllers: [HoroscopeController],
  providers: [HoroscopeService],
  exports: [HoroscopeService],
})
export class HoroscopeModule {}

