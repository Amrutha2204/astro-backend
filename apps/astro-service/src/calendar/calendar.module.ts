import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

@Module({
  imports: [ConfigModule],
  controllers: [CalendarController],
  providers: [CalendarService, SwissEphemerisService],
  exports: [CalendarService],
})
export class CalendarModule {}

