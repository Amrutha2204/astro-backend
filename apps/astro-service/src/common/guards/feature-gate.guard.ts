import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../../subscription/subscription.service';

export const FEATURE_GATE_KEY = 'featureGate';

/** Use @RequireFeature('premium_reports') on controller or method to gate by subscription. */
@Injectable()
export class FeatureGateGuard implements CanActivate {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<string>(FEATURE_GATE_KEY, context.getHandler())
      ?? this.reflector.get<string>(FEATURE_GATE_KEY, context.getClass());
    if (!feature) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.userId) {
      throw new HttpException('Authentication required.', HttpStatus.UNAUTHORIZED);
    }
    const canAccess = await this.subscriptionService.canAccessFeature(user.userId, feature);
    if (!canAccess) {
      throw new HttpException(
        `This feature requires an active subscription. Please upgrade.`,
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
