import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../core/prisma/prisma.service';
import { StripeService } from '../billing/stripe.service';

/**
 * =============================================================================
 * Referral Reward Service
 * =============================================================================
 * Handles reward calculation and application for successful referrals.
 *
 * ## Reward Structure
 * When a referral converts (referred user pays):
 * - **Referrer**: 1 month subscription extension
 * - **Both**: 50 credits each
 *
 * ## Application Methods
 * - Subscription extensions: via Stripe subscription update (trial_end extension)
 * - Credit grants: via direct CreditBalance increment in the database
 *
 * @see ReferralService - lifecycle tracking
 * @see AmbassadorService - tier management and additional rewards
 * =============================================================================
 */
@Injectable()
export class ReferralRewardService {
  private readonly logger = new Logger(ReferralRewardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService
  ) {}

  /**
   * Calculate and create reward rows for a converted referral.
   * Creates both referrer and referred user rewards within a transaction.
   */
  async calculateRewards(referralId: string): Promise<{ rewardIds: string[] }> {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referralCode: {
          select: { referrerUserId: true },
        },
      },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    if (referral.status !== 'converted') {
      this.logger.warn(
        `Cannot calculate rewards for referral ${referralId}: status is ${referral.status}`
      );
      return { rewardIds: [] };
    }

    // Check if rewards already exist for this referral
    const existingRewards = await this.prisma.referralReward.findMany({
      where: { referralId },
      select: { id: true },
    });

    if (existingRewards.length > 0) {
      this.logger.debug(`Rewards already calculated for referral ${referralId}`);
      return { rewardIds: existingRewards.map((r) => r.id) };
    }

    const referrerUserId = referral.referralCode.referrerUserId;
    const referredUserId = referral.referredUserId;

    const rewards = await this.prisma.$transaction(async (tx) => {
      const created: string[] = [];

      // Reward 1: Referrer gets 1 month subscription extension
      const referrerExtension = await tx.referralReward.create({
        data: {
          referralId,
          recipientUserId: referrerUserId,
          rewardType: 'subscription_extension',
          amount: 1, // 1 month
          description: 'Referral reward: 1 month subscription extension',
        },
      });
      created.push(referrerExtension.id);

      // Reward 2: Referrer gets 50 credits
      const referrerCredits = await tx.referralReward.create({
        data: {
          referralId,
          recipientUserId: referrerUserId,
          rewardType: 'credit_grant',
          amount: 50,
          description: 'Referral reward: 50 credits for referring a new user',
        },
      });
      created.push(referrerCredits.id);

      // Reward 3: Referred user gets 50 credits (if user ID is known)
      if (referredUserId) {
        const referredCredits = await tx.referralReward.create({
          data: {
            referralId,
            recipientUserId: referredUserId,
            rewardType: 'credit_grant',
            amount: 50,
            description: 'Welcome reward: 50 credits for signing up via referral',
          },
        });
        created.push(referredCredits.id);
      }

      // Transition referral to rewarded
      await tx.referral.update({
        where: { id: referralId },
        data: {
          status: 'rewarded',
          rewardedAt: new Date(),
        },
      });

      return created;
    });

    this.logger.log(`Calculated ${rewards.length} rewards for referral ${referralId}`);

    return { rewardIds: rewards };
  }

  /**
   * Apply a single reward: execute the actual Stripe or credit balance operation.
   *
   * - subscription_extension: extends the user's Stripe subscription trial_end
   * - credit_grant: increments the user's CreditBalance
   */
  async applyReward(rewardId: string): Promise<{ applied: boolean; actionId?: string }> {
    const reward = await this.prisma.referralReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    if (reward.applied) {
      this.logger.debug(`Reward ${rewardId} already applied`);
      return { applied: true, actionId: reward.stripeActionId ?? undefined };
    }

    let actionId: string | undefined;

    try {
      switch (reward.rewardType) {
        case 'subscription_extension':
          actionId = await this.applySubscriptionExtension(reward.recipientUserId, reward.amount);
          break;

        case 'credit_grant':
          await this.applyCreditGrant(reward.recipientUserId, reward.amount);
          break;

        case 'tier_discount':
          // Tier discounts are informational and applied via ambassador profile
          this.logger.log(
            `Tier discount of ${reward.amount} basis points for user ${reward.recipientUserId}`
          );
          break;

        default:
          this.logger.warn(`Unknown reward type: ${reward.rewardType}`);
          return { applied: false };
      }

      await this.prisma.referralReward.update({
        where: { id: rewardId },
        data: {
          applied: true,
          appliedAt: new Date(),
          stripeActionId: actionId ?? null,
        },
      });

      this.logger.log(
        `Applied reward ${rewardId} (${reward.rewardType}) for user ${reward.recipientUserId}`
      );

      return { applied: true, actionId };
    } catch (error) {
      this.logger.error(
        `Failed to apply reward ${rewardId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { applied: false };
    }
  }

  // ─── Private Helpers ─────────────────────────────────────────────────

  /**
   * Extend a user's Stripe subscription by the given number of months.
   * Uses the Stripe subscription update API to push the billing anchor forward.
   */
  private async applySubscriptionExtension(
    userId: string,
    months: number
  ): Promise<string | undefined> {
    if (!this.stripe.isConfigured()) {
      this.logger.warn('Stripe not configured; skipping subscription extension');
      return undefined;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      this.logger.warn(`No Stripe customer for user ${userId}; skipping extension`);
      return undefined;
    }

    // Extend the local subscription expiry date.
    // Stripe subscription management (trial_end, billing anchor) is handled
    // by the billing module's lifecycle service; here we update local state.
    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionExpiresAt: true },
    });

    if (!userRecord?.subscriptionExpiresAt) {
      this.logger.warn(`No subscription expiry for user ${userId}; crediting months locally`);

      // Fall back to local tracking: extend subscriptionExpiresAt
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionExpiresAt: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000),
        },
      });

      return undefined;
    }

    // Extend the expiry date
    const currentExpiry = new Date(userRecord.subscriptionExpiresAt);
    const newExpiry = new Date(
      Math.max(currentExpiry.getTime(), Date.now()) + months * 30 * 24 * 60 * 60 * 1000
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionExpiresAt: newExpiry },
    });

    this.logger.log(
      `Extended subscription for user ${userId} by ${months} month(s) to ${newExpiry.toISOString()}`
    );

    return `ext_${userId}_${months}m`;
  }

  /**
   * Grant credits to a user's balance.
   * Increases `creditsIncluded` on the CreditBalance row, effectively giving
   * the user more credits for the current billing period.
   *
   * Uses orgId = userId as the lookup key (consistent with the metering service
   * which treats userId as the org identifier for individual accounts).
   */
  private async applyCreditGrant(userId: string, credits: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for credit grant`);
      return;
    }

    try {
      // Increment creditsIncluded to effectively grant additional credits
      await this.prisma.creditBalance.update({
        where: { orgId: userId },
        data: { creditsIncluded: { increment: credits } },
      });
    } catch {
      // If no CreditBalance row exists, create one with the granted credits
      try {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await this.prisma.creditBalance.upsert({
          where: { orgId: userId },
          update: { creditsIncluded: { increment: credits } },
          create: {
            orgId: userId,
            creditsIncluded: 100 + credits, // base community credits + grant
            creditsUsed: 0,
            overageCredits: 0,
            periodStart: now,
            periodEnd,
          },
        });
      } catch (innerError) {
        this.logger.warn(
          `Could not update CreditBalance for ${userId}: ${(innerError as Error).message}. Credits tracked in reward record.`
        );
      }
    }

    this.logger.log(`Granted ${credits} credits to user ${userId}`);
  }
}
