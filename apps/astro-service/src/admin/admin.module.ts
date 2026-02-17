import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../payment/entities/transaction.entity';
import { Report } from '../premium-reports/entities/report.entity';
import { UserSubscription } from '../subscription/entities/user-subscription.entity';
import { AppConfigModule } from '../config/config.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Report, UserSubscription]),
    AppConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
