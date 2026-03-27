import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  planSlug: string;

  @Column({ type: 'timestamp with time zone' })
  startAt: Date;

  @Column({ type: 'timestamp with time zone' })
  endAt: Date;

  @Column({ type: 'varchar', length: 32, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @CreateDateColumn()
  createdAt: Date;
}
