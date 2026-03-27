import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum TransactionType {
  ORDER = 'order',
  WALLET_TOPUP = 'wallet_topup',
  WALLET_DEDUCT = 'wallet_deduct',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  type: TransactionType;

  @Column({ type: 'varchar', length: 32 })
  status: TransactionStatus;

  /** Amount in paise (INR) */
  @Column({ type: 'bigint' })
  amountPaise: string;

  /** Razorpay order ID or payment ID when applicable */
  @Column({ type: 'varchar', length: 128, nullable: true })
  razorpayOrderId: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  razorpayPaymentId: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
