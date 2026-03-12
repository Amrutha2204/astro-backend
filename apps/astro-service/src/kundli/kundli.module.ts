import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KundliController } from './kundli.controller';
import { KundliService } from './kundli.service';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';
import { AuthClientModule } from '../common/auth-client.module';

@Module({
  imports: [ConfigModule, AstrologyEngineModule, AuthClientModule],
  controllers: [KundliController],
  providers: [KundliService],
  exports: [KundliService],
})
export class KundliModule {}

