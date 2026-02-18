import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { AuthClientModule } from '../common/auth-client.module';
import { PremiumReportsService } from './premium-reports.service';
import { PremiumReportsController } from './premium-reports.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { KundliModule } from '../kundli/kundli.module';
import { PaymentModule } from '../payment/payment.module';
import { CompatibilityModule } from '../compatibility/compatibility.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    AuthClientModule,
    SubscriptionModule,
    KundliModule,
    PaymentModule,
    CompatibilityModule,
  ],
  controllers: [PremiumReportsController],
  providers: [PremiumReportsService],
  exports: [PremiumReportsService],
})
export class PremiumReportsModule {}
