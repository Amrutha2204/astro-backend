import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DashaController } from './dasha.controller';
import { DashaService } from './dasha.service';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';
import { SwissEphemerisService } from '../common/services/swiss-ephemeris.service';
import { AuthClientModule } from '../common/auth-client.module';

@Module({
  imports: [ConfigModule, AstrologyEngineModule, AuthClientModule],
  controllers: [DashaController],
  providers: [DashaService, SwissEphemerisService],
  exports: [DashaService],
})
export class DashaModule {}

