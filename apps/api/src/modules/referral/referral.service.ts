import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

import { AmbassadorService } from './ambassador.service';
import { ReferralConversionDataDto } from './dto/referral-event.dto';

/**
 * =============================================================================
 * Referral Service (Rewards-Only)
 * =============================================================================
 * Handles reward creation from PhyneCRM conversion webhooks and
 * reward history queries.
 *
 * Funnel tracking (code generation, validation, application, lifecycle
 * events, stats) has moved to PhyneCRM. Dhanam retains only:
 * - Reward creation on conversion
 * - Reward history retrieval
 * - Ambassador tier recalculation (delegated to AmbassadorService)
 *
 * @see ReferralRewardService - reward application (Stripe / credits)
 * @see AmbassadorService - tier management
 * =============================================================================
 */
@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ambassadorService: AmbassadorService
  ) {}

  /**
   * Handle a `referral.converted` webhook from PhyneCRM.
   *
   * Creates ReferralReward rows:
   * - Referrer: 1 month subscription extension
   * - Referrer: 50 credits
   * - Referred user: 50 credits
   *
   * Then recalculates the referrer's ambassador tier.
   *
   * The `referralId` stored in each reward is a cross-service reference
   * to the PhyneCRM referral record, not a local FK.
   */
  async handleConversionWebhook(data: ReferralConversionDataDto): Promise<{
    rewards_created: number;
    ambassador_tier: string;
  }> {
    const { referral_code, referrer_user_id, referred_user_id, source_product, target_product } =
      data;

    // Use the referral code as the cross-service reference ID.
    // PhyneCRM owns the referral record; we just store its code for traceability.
    const referralId = referral_code;

    // Check for duplicate: avoid double-rewarding the same conversion
    const existing = await this.prisma.referralReward.findFirst({
      where: {
        referralId,
        recipientUserId: referrer_user_id,
        rewardType: 'subscription_extension',
      },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate conversion webhook for code=${referral_code}, referrer=${referrer_user_id}. Skipping.`
      );
      const profile = await this.ambassadorService.getProfile(referrer_user_id);
      return { rewards_created: 0, ambassador_tier: profile.tier };
    }

    // Create rewards in a transaction
    const rewards = await this.prisma.referralReward.createMany({
      data: [
        {
          referralId,
          recipientUserId: referrer_user_id,
          rewardType: 'subscription_extension',
          amount: 1,
          description: 'Referral reward: 1 free month for successful referral',
          metadata: { source_product, target_product },
        },
        {
          referralId,
          recipientUserId: referrer_user_id,
          rewardType: 'credit_grant',
          amount: 50,
          description: 'Referral bonus: 50 credits for referrer',
          metadata: { source_product, target_product },
        },
        {
          referralId,
          recipientUserId: referred_user_id,
          rewardType: 'credit_grant',
          amount: 50,
          description: 'Welcome bonus: 50 credits for being referred',
          metadata: { source_product, target_product },
        },
      ],
    });

    this.logger.log(
      `Created ${rewards.count} rewards for conversion: code=${referral_code} referrer=${referrer_user_id} referred=${referred_user_id}`
    );

    // Recalculate ambassador tier
    const tierResult = await this.ambassadorService.recalculateTier(referrer_user_id);

    if (tierResult.promoted) {
      this.logger.log(
        `Ambassador promoted: ${referrer_user_id} ${tierResult.previousTier} -> ${tierResult.newTier}`
      );
    }

    return {
      rewards_created: rewards.count,
      ambassador_tier: tierResult.newTier,
    };
  }

  /**
   * Get reward history for a user (as recipient).
   */
  async getRewards(userId: string): Promise<
    Array<{
      id: string;
      rewardType: string;
      amount: number;
      description: string;
      applied: boolean;
      appliedAt: Date | null;
      createdAt: Date;
    }>
  > {
    return this.prisma.referralReward.findMany({
      where: { recipientUserId: userId },
      select: {
        id: true,
        rewardType: true,
        amount: true,
        description: true,
        applied: true,
        appliedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
