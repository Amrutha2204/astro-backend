import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../payment/entities/transaction.entity';
import { Report } from '../premium-reports/entities/report.entity';
import { UserSubscription, SubscriptionStatus } from '../subscription/entities/user-subscription.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepo: Repository<UserSubscription>,
  ) {}

  async getStats(): Promise<{
    reportCount: number;
    transactionCount: number;
    successPaymentCount: number;
    activeSubscriptionCount: number;
    totalRevenuePaise: number;
  }> {
    const [reportCount, transactionCount, successPaymentCount, activeSubscriptionCount, revenueResult] =
      await Promise.all([
        this.reportRepo.count(),
        this.transactionRepo.count(),
        this.transactionRepo.count({
          where: { type: TransactionType.ORDER, status: TransactionStatus.SUCCESS },
        }),
        this.subscriptionRepo.count({
          where: { status: SubscriptionStatus.ACTIVE },
        }),
        this.transactionRepo
          .createQueryBuilder('t')
          .select('COALESCE(SUM(CAST(t.amountPaise AS BIGINT)), 0)', 'total')
          .where('t.type = :type', { type: TransactionType.ORDER })
          .andWhere('t.status = :status', { status: TransactionStatus.SUCCESS })
          .getRawOne<{ total: string }>(),
      ]);

    const totalRevenuePaise = Number(revenueResult?.total ?? 0);

    return {
      reportCount,
      transactionCount,
      successPaymentCount,
      activeSubscriptionCount,
      totalRevenuePaise,
    };
  }

  async getTransactions(limit = 50, offset = 0): Promise<{
    items: Array<{
      id: string;
      userId: string;
      type: string;
      status: string;
      amountPaise: string;
      description: string | null;
      createdAt: string;
    }>;
    total: number;
  }> {
    const [items, total] = await this.transactionRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
    return {
      items: items.map((t) => ({
        id: t.id,
        userId: t.userId,
        type: t.type,
        status: t.status,
        amountPaise: t.amountPaise,
        description: t.description ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
      total,
    };
  }

  async getReports(limit = 50, offset = 0): Promise<{
    items: Array<{
      id: string;
      userId: string;
      reportType: string;
      filename: string;
      createdAt: string;
    }>;
    total: number;
  }> {
    const [items, total] = await this.reportRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
    return {
      items: items.map((r) => ({
        id: r.id,
        userId: r.userId,
        reportType: r.reportType,
        filename: r.filename,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
    };
  }
}
