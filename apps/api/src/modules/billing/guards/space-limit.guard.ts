import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { BillingService } from '../billing.service';
import { PaymentRequiredException } from '../exceptions';

/**
 * Guard that checks if a user can create a new space based on their tier's limit.
 * Apply to the createSpace endpoint.
 */
@Injectable()
export class SpaceLimitGuard implements CanActivate {
  private readonly logger = new Logger(SpaceLimitGuard.name);

  constructor(
    private readonly billing: BillingService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let auth guards handle this
    }

    const tierLimits = this.billing.getTierLimits(user.subscriptionTier || 'community');
    const currentSpaceCount = await this.prisma.userSpace.count({
      where: {
        userId: user.id,
        role: 'owner',
      },
    });

    if (currentSpaceCount >= tierLimits.maxSpaces) {
      this.logger.log(
        `User ${user.id} (${user.subscriptionTier}) hit space limit: ${currentSpaceCount}/${tierLimits.maxSpaces}`
      );
      throw new PaymentRequiredException(
        `Your ${user.subscriptionTier || 'community'} plan allows up to ${tierLimits.maxSpaces} space(s). Upgrade to create more.`
      );
    }

    return true;
  }
}
