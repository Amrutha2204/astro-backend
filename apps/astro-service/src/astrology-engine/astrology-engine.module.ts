import { Module } from '@nestjs/common';
import { AstrologyEngineService } from './astrology-engine.service';
import { AstrologyEngineController } from './astrology-engine.controller';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

@Module({
  controllers: [AstrologyEngineController],
  providers: [AstrologyEngineService, SwissEphemerisService],
  exports: [AstrologyEngineService, SwissEphemerisService],
})
export class AstrologyEngineModule {}

