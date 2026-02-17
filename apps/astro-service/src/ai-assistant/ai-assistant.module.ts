import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AppConfigModule } from '../config/config.module';
import { NatalChartModule } from '../natal-chart/natal-chart.module';
import { TransitsModule } from '../transits/transits.module';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';

@Module({
  imports: [AppConfigModule, NatalChartModule, TransitsModule, AstrologyEngineModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}

