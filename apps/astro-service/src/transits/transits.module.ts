import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransitsController } from './transits.controller';
import { TransitsService } from './transits.service';
import { ProkeralaService } from '../common/services/prokerala.service';

@Module({
  imports: [ConfigModule],
  controllers: [TransitsController],
  providers: [TransitsService, ProkeralaService],
  exports: [TransitsService],
})
export class TransitsModule {}

