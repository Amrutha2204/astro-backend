import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Price in paise (INR) per billing period */
  @Column({ type: 'bigint', default: 0 })
  pricePaise: string;

  /** Billing period: month, year */
  @Column({ type: 'varchar', length: 16, default: 'month' })
  billingPeriod: string;

  /** Comma-separated feature keys this plan can access, e.g. premium_reports,ai_unlimited */
  @Column({ type: 'varchar', length: 512, default: '' })
  features: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
