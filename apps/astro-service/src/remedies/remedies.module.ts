import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RemediesController } from './remedies.controller';
import { RemediesService } from './remedies.service';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';
import { CalendarModule } from '../calendar/calendar.module';
import { AuthClientModule } from '../common/auth-client.module';

@Module({
  imports: [ConfigModule, AstrologyEngineModule, CalendarModule, AuthClientModule],
  controllers: [RemediesController],
  providers: [RemediesService],
  exports: [RemediesService],
})
export class RemediesModule {}

