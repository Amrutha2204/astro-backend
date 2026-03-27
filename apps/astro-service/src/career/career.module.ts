import { Module } from '@nestjs/common';
import { AuthClientModule } from '../common/auth-client.module';
import { FamilyProfileModule } from '../family-profile/family-profile.module';
import { NatalChartModule } from '../natal-chart/natal-chart.module';
import { TransitsModule } from '../transits/transits.module';
import { AiAssistantModule } from '../ai-assistant/ai-assistant.module';
import { CareerService } from './career.service';
import { CareerController } from './career.controller';

@Module({
  imports: [
    AuthClientModule,
    FamilyProfileModule,
    NatalChartModule,
    TransitsModule,
    AiAssistantModule,
  ],
  controllers: [CareerController],
  providers: [CareerService],
})
export class CareerModule {}
