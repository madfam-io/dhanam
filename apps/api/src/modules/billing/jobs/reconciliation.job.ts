import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import Stripe from 'stripe';

@Injectable()
export class ReconciliationJob {
  private readonly logger = new Logger(ReconciliationJob.name);
  private readonly stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    });
  }

  /**
   * Nightly reconciliation: compare local subscription state with Stripe's
   * source of truth. Flags discrepancies as BillingEvent records and logs
   * warnings for manual review.
   *
   * Runs daily at 3:00 AM UTC.
   */
  @Cron('0 3 * * *', { name: 'billing-reconciliation' })
  async reconcile(): Promise<void> {
    this.logger.log('Starting nightly billing reconciliation');

    const subscribedUsers = await this.prisma.user.findMany({
      where: {
        subscriptionTier: { not: null },
        stripeCustomerId: { not: null },
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        stripeCustomerId: true,
        subscriptionExpiresAt: true,
      },
    });

    let checked = 0;
    let mismatches = 0;

    for (const user of subscribedUsers) {
      try {
        const subscriptions = await this.stripe.subscriptions.list({
          customer: user.stripeCustomerId!,
          status: 'active',
          limit: 1,
        });

        const activeStripe = subscriptions.data[0];

        if (!activeStripe && user.subscriptionTier) {
          // Local says subscribed, Stripe says no active subscription
          await this.flagMismatch(user.id, {
            type: 'local_active_stripe_inactive',
            localTier: user.subscriptionTier,
            stripeStatus: 'no_active_subscription',
          });
          mismatches++;
        } else if (activeStripe && !user.subscriptionTier) {
          // Stripe says active, local says no subscription
          await this.flagMismatch(user.id, {
            type: 'stripe_active_local_inactive',
            stripeStatus: activeStripe.status,
            stripePlan: activeStripe.items.data[0]?.price?.id ?? 'unknown',
          });
          mismatches++;
        }

        checked++;
      } catch (error) {
        this.logger.error(`Reconciliation failed for user ${user.id}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Reconciliation complete: ${checked} checked, ${mismatches} mismatches`);
  }

  private async flagMismatch(userId: string, details: Record<string, unknown>): Promise<void> {
    this.logger.warn(`Billing mismatch for user ${userId}: ${JSON.stringify(details)}`);

    await this.prisma.billingEvent.create({
      data: {
        userId,
        type: 'reconciliation_mismatch',
        amount: 0,
        currency: 'USD',
        status: 'flagged',
        metadata: details,
      },
    });
  }
}
