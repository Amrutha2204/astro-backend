import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NatalChartController } from './natal-chart.controller';
import { NatalChartService } from './natal-chart.service';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';
import { AuthClientModule } from '../common/auth-client.module';

@Module({
  imports: [ConfigModule, AstrologyEngineModule, AuthClientModule],
  controllers: [NatalChartController],
  providers: [NatalChartService],
  exports: [NatalChartService],
})
export class NatalChartModule {}

