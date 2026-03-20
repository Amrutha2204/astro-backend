import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransitsController } from './transits.controller';
import { TransitsService } from './transits.service';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';

@Module({
  imports: [ConfigModule],
  controllers: [TransitsController],
  providers: [TransitsService, SwissEphemerisService],
  exports: [TransitsService],
})
export class TransitsModule {}

