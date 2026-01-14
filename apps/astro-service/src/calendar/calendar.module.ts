import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { ProkeralaService } from '../common/services/prokerala.service';

@Module({
  imports: [ConfigModule],
  controllers: [CalendarController],
  providers: [CalendarService, ProkeralaService],
  exports: [CalendarService],
})
export class CalendarModule {}

