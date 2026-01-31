import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { BillingService } from '../billing.service';
import { FEATURE_KEY, GateableFeature } from '../decorators/requires-feature.decorator';
import { PaymentRequiredException } from '../exceptions';

/**
 * Guard that checks if a boolean feature flag is enabled for the user's tier.
 * Works with the @RequiresFeature() decorator.
 *
 * @example
 * @RequiresFeature('lifeBeat')
 * @UseGuards(FeatureGateGuard)
 * @Get('wills')
 * async getWills() { ... }
 */
@Injectable()
export class FeatureGateGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGateGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly billing: BillingService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<GateableFeature>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No feature requirement — allow access
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let auth guards handle this
    }

    const tierLimits = this.billing.getTierLimits(user.subscriptionTier || 'community');
    const featureEnabled = tierLimits[requiredFeature as keyof typeof tierLimits];

    if (!featureEnabled) {
      this.logger.log(
        `User ${user.id} (${user.subscriptionTier}) blocked from feature: ${requiredFeature}`
      );
      throw new PaymentRequiredException(
        `The ${requiredFeature} feature requires a Pro subscription. Upgrade at /billing/upgrade`
      );
    }

    return true;
  }
}
