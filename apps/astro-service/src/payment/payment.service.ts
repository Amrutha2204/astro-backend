import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private razorpay: Razorpay | null = null;
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  /** Create Razorpay order for given amount (INR). */
  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!this.razorpay) {
      throw new HttpException(
        'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const amountPaise = Math.round(dto.amountRupees * 100);
    const receipt = dto.receipt || `ord_${Date.now()}_${userId.slice(0, 8)}`;
    const order = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { userId, description: dto.description || 'Astro service payment' },
    });
    await this.transactionRepo.save(
      this.transactionRepo.create({
        userId,
        type: TransactionType.ORDER,
        status: TransactionStatus.PENDING,
        amountPaise: String(amountPaise),
        razorpayOrderId: order.id,
        description: dto.description || null,
      }),
    );
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.configService.get<string>('RAZORPAY_KEY_ID'),
    };
  }

  /** Verify payment signature (client sends paymentId + signature after success). */
  async verifyPayment(userId: string, orderId: string, paymentId: string, signature: string) {
    if (!this.razorpay) {
      throw new HttpException('Payment gateway not configured.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const expected = crypto
      .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET')!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    if (expected !== signature) {
      throw new HttpException('Invalid payment signature.', HttpStatus.BAD_REQUEST);
    }
    const tx = await this.transactionRepo.findOne({
      where: { userId, razorpayOrderId: orderId, type: TransactionType.ORDER },
    });
    if (!tx) {
      throw new HttpException('Order not found.', HttpStatus.NOT_FOUND);
    }
    if (tx.status === TransactionStatus.SUCCESS) {
      return { status: 'already_captured', transactionId: tx.id };
    }
    tx.status = TransactionStatus.SUCCESS;
    tx.razorpayPaymentId = paymentId;
    await this.transactionRepo.save(tx);
    return { status: 'captured', transactionId: tx.id };
  }

  /** Handle Razorpay webhook (payment.captured etc.). */
  async handleWebhook(body: string, signature: string) {
    if (!this.webhookSecret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET not set; skipping webhook verification');
      return { received: true };
    }
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');
    if (expected !== signature) {
      throw new HttpException('Invalid webhook signature.', HttpStatus.BAD_REQUEST);
    }
    const payload = JSON.parse(body);
    const event = payload.event;
    if (event === 'payment.captured') {
      const payment = payload.payload?.payment?.entity;
      if (payment) {
        const orderId = payment.order_id;
        const amountPaise = payment.amount;
        const tx = await this.transactionRepo.findOne({
          where: { razorpayOrderId: orderId, type: TransactionType.ORDER },
        });
        if (tx && tx.status !== TransactionStatus.SUCCESS) {
          tx.status = TransactionStatus.SUCCESS;
          tx.razorpayPaymentId = payment.id;
          await this.transactionRepo.save(tx);
          await this.creditWallet(tx.userId, Number(amountPaise), `Payment ${payment.id}`);
        }
      }
    }
    return { received: true };
  }

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let w = await this.walletRepo.findOne({ where: { userId } });
    if (!w) {
      w = this.walletRepo.create({ userId, balancePaise: '0' });
      await this.walletRepo.save(w);
    }
    return w;
  }

  async getBalance(userId: string): Promise<{ balancePaise: number; balanceRupees: number }> {
    const w = await this.getOrCreateWallet(userId);
    const paise = Number(w.balancePaise);
    return { balancePaise: paise, balanceRupees: paise / 100 };
  }

  async creditWallet(userId: string, amountPaise: number, description: string) {
    const w = await this.getOrCreateWallet(userId);
    const prev = Number(w.balancePaise);
    w.balancePaise = String(prev + amountPaise);
    await this.walletRepo.save(w);
    await this.transactionRepo.save(
      this.transactionRepo.create({
        userId,
        type: TransactionType.WALLET_TOPUP,
        status: TransactionStatus.SUCCESS,
        amountPaise: String(amountPaise),
        description,
      }),
    );
  }

  async debitWallet(userId: string, amountPaise: number, description: string): Promise<boolean> {
    const w = await this.getOrCreateWallet(userId);
    const prev = Number(w.balancePaise);
    if (prev < amountPaise) return false;
    w.balancePaise = String(prev - amountPaise);
    await this.walletRepo.save(w);
    await this.transactionRepo.save(
      this.transactionRepo.create({
        userId,
        type: TransactionType.WALLET_DEDUCT,
        status: TransactionStatus.SUCCESS,
        amountPaise: String(amountPaise),
        description,
      }),
    );
    return true;
  }

  /** Get current user's transactions (for "My transactions" / wallet history). */
  async getMyTransactions(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<{
    items: Array<{
      id: string;
      type: string;
      status: string;
      amountPaise: string;
      description: string | null;
      createdAt: string;
    }>;
    total: number;
  }> {
    const [items, total] = await this.transactionRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
    return {
      items: items.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amountPaise: t.amountPaise,
        description: t.description ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
      total,
    };
  }
}
