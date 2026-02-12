import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from './entities/user-subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private readonly userSubRepo: Repository<UserSubscription>,
  ) {}

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      where: { isActive: true },
      order: { pricePaise: 'ASC' },
    });
  }

  async getMySubscription(userId: string): Promise<{
    plan: SubscriptionPlan | null;
    subscription: UserSubscription | null;
    isActive: boolean;
  }> {
    const sub = await this.userSubRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { endAt: 'DESC' },
    });
    if (!sub) {
      return { plan: null, subscription: null, isActive: false };
    }
    const now = new Date();
    if (new Date(sub.endAt) < now) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.userSubRepo.save(sub);
      return { plan: null, subscription: null, isActive: false };
    }
    const plan = await this.planRepo.findOne({
      where: { slug: sub.planSlug },
    });
    return {
      plan: plan || null,
      subscription: sub,
      isActive: true,
    };
  }

  /** Check if user can access a feature (e.g. premium_reports, ai_unlimited). */
  async canAccessFeature(userId: string, featureKey: string): Promise<boolean> {
    const { isActive, plan } = await this.getMySubscription(userId);
    if (!isActive || !plan) return false;
    const features = (plan.features || '').split(',').map((f) => f.trim());
    return features.includes(featureKey);
  }

  /** Subscribe user to a plan (call after payment success). */
  async subscribe(
    userId: string,
    planSlug: string,
    durationMonths: number = 1,
  ): Promise<UserSubscription> {
    const plan = await this.planRepo.findOne({
      where: { slug: planSlug, isActive: true },
    });
    if (!plan) {
      throw new HttpException('Plan not found.', HttpStatus.NOT_FOUND);
    }
    const startAt = new Date();
    const endAt = new Date(startAt);
    endAt.setMonth(endAt.getMonth() + durationMonths);
    const sub = this.userSubRepo.create({
      userId,
      planSlug,
      startAt,
      endAt,
      status: SubscriptionStatus.ACTIVE,
    });
    return this.userSubRepo.save(sub);
  }
}
