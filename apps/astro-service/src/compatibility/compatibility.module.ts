import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompatibilityController } from './compatibility.controller';
import { CompatibilityService } from './compatibility.service';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';
import { DoshaModule } from '../dosha/dosha.module';

@Module({
  imports: [ConfigModule, AstrologyEngineModule, DoshaModule],
  controllers: [CompatibilityController],
  providers: [CompatibilityService],
  exports: [CompatibilityService],
})
export class CompatibilityModule {}

