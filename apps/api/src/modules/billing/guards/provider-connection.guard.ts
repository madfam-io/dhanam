import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { BillingService } from '../billing.service';
import { PaymentRequiredException } from '../exceptions';

/**
 * Guard that checks if a user can create a new provider connection
 * based on their tier's maxProviderConnections and allowedProviders.
 *
 * Expects the request to have:
 * - user (from JwtAuthGuard)
 * - params.provider or body.provider — the provider type being connected
 */
@Injectable()
export class ProviderConnectionGuard implements CanActivate {
  private readonly logger = new Logger(ProviderConnectionGuard.name);

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

    // Check max connections
    if (tierLimits.maxProviderConnections === 0) {
      throw new PaymentRequiredException(
        'Provider connections are not available on the Community plan. Upgrade to Essentials or Pro.'
      );
    }

    if (tierLimits.maxProviderConnections !== Infinity) {
      const currentConnectionCount = await this.prisma.providerConnection.count({
        where: {
          userId: user.id,
        },
      });

      if (currentConnectionCount >= tierLimits.maxProviderConnections) {
        this.logger.log(
          `User ${user.id} (${user.subscriptionTier}) hit provider connection limit: ${currentConnectionCount}/${tierLimits.maxProviderConnections}`
        );
        throw new PaymentRequiredException(
          `Your plan allows up to ${tierLimits.maxProviderConnections} provider connection(s). Upgrade to Pro for unlimited.`
        );
      }
    }

    // Check allowed providers
    if (tierLimits.allowedProviders !== 'all') {
      // Determine provider from route or body
      const provider =
        request.params?.provider || request.body?.provider || this.inferProviderFromPath(request.path);

      if (provider && !(tierLimits.allowedProviders as string[]).includes(provider)) {
        this.logger.log(
          `User ${user.id} (${user.subscriptionTier}) attempted to connect disallowed provider: ${provider}`
        );
        throw new PaymentRequiredException(
          `The ${provider} provider is not available on your plan. Upgrade to Pro for access to all providers.`
        );
      }
    }

    return true;
  }

  /**
   * Infer provider type from the request path (e.g., /providers/plaid/connect → plaid)
   */
  private inferProviderFromPath(path: string): string | null {
    const match = path?.match(/\/providers\/(\w+)/);
    return match ? match[1] : null;
  }
}
