import { AmbassadorTier } from '@db';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Ambassador tier thresholds: minimum conversions required for each tier.
 */
const TIER_THRESHOLDS: Array<{ tier: AmbassadorTier; minConversions: number; discount: number }> = [
  { tier: 'platinum', minConversions: 25, discount: 20 },
  { tier: 'gold', minConversions: 10, discount: 15 },
  { tier: 'silver', minConversions: 5, discount: 10 },
  { tier: 'bronze', minConversions: 3, discount: 5 },
  { tier: 'none', minConversions: 0, discount: 0 },
];

/**
 * =============================================================================
 * Ambassador Service
 * =============================================================================
 * Manages the gamified referral tier system. Users earn ambassador status based
 * on their total referral conversions, unlocking subscription discounts.
 *
 * ## Tier Progression
 * - none:     0 conversions (default)
 * - bronze:   3+ conversions (5% discount)
 * - silver:   5+ conversions (10% discount)
 * - gold:    10+ conversions (15% discount)
 * - platinum: 25+ conversions (20% discount)
 *
 * @see ReferralRewardService - triggers tier recalculation after rewards
 * @see ReferralService - provides conversion counts
 * =============================================================================
 */
@Injectable()
export class AmbassadorService {
  private readonly logger = new Logger(AmbassadorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create the ambassador profile for a user.
   */
  async getProfile(userId: string): Promise<{
    id: string;
    tier: string;
    totalReferrals: number;
    totalConversions: number;
    lifetimeCreditsEarned: number;
    lifetimeMonthsEarned: number;
    discountPercent: number;
    publicProfile: boolean;
    displayName: string | null;
    nextTier: string | null;
    conversionsToNextTier: number | null;
  }> {
    let profile = await this.prisma.ambassadorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.ambassadorProfile.create({
        data: { userId },
      });
    }

    // Calculate progress to next tier
    const nextTierInfo = this.getNextTier(profile.tier as AmbassadorTier, profile.totalConversions);

    return {
      id: profile.id,
      tier: profile.tier,
      totalReferrals: profile.totalReferrals,
      totalConversions: profile.totalConversions,
      lifetimeCreditsEarned: profile.lifetimeCreditsEarned,
      lifetimeMonthsEarned: profile.lifetimeMonthsEarned,
      discountPercent: profile.discountPercent,
      publicProfile: profile.publicProfile,
      displayName: profile.displayName,
      nextTier: nextTierInfo.nextTier,
      conversionsToNextTier: nextTierInfo.conversionsNeeded,
    };
  }

  /**
   * Recalculate ambassador tier based on actual conversion count.
   * Called after a referral is rewarded.
   *
   * Also updates aggregate stats (totalReferrals, totalConversions,
   * lifetimeCreditsEarned, lifetimeMonthsEarned).
   */
  async recalculateTier(userId: string): Promise<{
    previousTier: string;
    newTier: string;
    promoted: boolean;
  }> {
    // Count actual conversions across all of the user's referral codes
    const codes = await this.prisma.referralCode.findMany({
      where: { referrerUserId: userId },
      select: { id: true },
    });

    const codeIds = codes.map((c) => c.id);

    const [totalReferrals, conversions] = await Promise.all([
      this.prisma.referral.count({
        where: { referralCodeId: { in: codeIds } },
      }),
      this.prisma.referral.count({
        where: {
          referralCodeId: { in: codeIds },
          status: { in: ['converted', 'rewarded'] },
        },
      }),
    ]);

    // Sum lifetime rewards
    const rewardAggregates = await this.prisma.referralReward.groupBy({
      by: ['rewardType'],
      where: {
        recipientUserId: userId,
        applied: true,
      },
      _sum: { amount: true },
    });

    let lifetimeCredits = 0;
    let lifetimeMonths = 0;
    for (const agg of rewardAggregates) {
      if (agg.rewardType === 'credit_grant') {
        lifetimeCredits = agg._sum.amount ?? 0;
      } else if (agg.rewardType === 'subscription_extension') {
        lifetimeMonths = agg._sum.amount ?? 0;
      }
    }

    // Determine the correct tier
    const newTier = this.calculateTier(conversions);
    const discount = TIER_THRESHOLDS.find((t) => t.tier === newTier)?.discount ?? 0;

    // Get or create the profile
    const profile = await this.prisma.ambassadorProfile.upsert({
      where: { userId },
      update: {
        tier: newTier,
        totalReferrals: totalReferrals,
        totalConversions: conversions,
        lifetimeCreditsEarned: lifetimeCredits,
        lifetimeMonthsEarned: lifetimeMonths,
        discountPercent: discount,
      },
      create: {
        userId,
        tier: newTier,
        totalReferrals: totalReferrals,
        totalConversions: conversions,
        lifetimeCreditsEarned: lifetimeCredits,
        lifetimeMonthsEarned: lifetimeMonths,
        discountPercent: discount,
      },
    });

    const previousTier = profile.tier;
    const promoted = this.tierRank(newTier) > this.tierRank(previousTier as AmbassadorTier);

    if (promoted) {
      this.logger.log(`Ambassador tier promoted for user ${userId}: ${previousTier} -> ${newTier}`);
    }

    return {
      previousTier,
      newTier,
      promoted,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────

  /**
   * Calculate the ambassador tier based on conversion count.
   */
  private calculateTier(conversions: number): AmbassadorTier {
    for (const threshold of TIER_THRESHOLDS) {
      if (conversions >= threshold.minConversions) {
        return threshold.tier;
      }
    }
    return 'none';
  }

  /**
   * Get numeric rank for tier comparison.
   */
  private tierRank(tier: AmbassadorTier): number {
    const ranks: Record<AmbassadorTier, number> = {
      none: 0,
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
    };
    return ranks[tier] ?? 0;
  }

  /**
   * Calculate progress to the next tier.
   */
  private getNextTier(
    currentTier: AmbassadorTier,
    currentConversions: number
  ): { nextTier: string | null; conversionsNeeded: number | null } {
    const currentRank = this.tierRank(currentTier);

    // Find the next tier above the current one
    const sortedByRank = [...TIER_THRESHOLDS].sort(
      (a, b) => this.tierRank(a.tier) - this.tierRank(b.tier)
    );

    const nextThreshold = sortedByRank.find((t) => this.tierRank(t.tier) > currentRank);

    if (!nextThreshold) {
      return { nextTier: null, conversionsNeeded: null }; // Already at platinum
    }

    return {
      nextTier: nextThreshold.tier,
      conversionsNeeded: Math.max(0, nextThreshold.minConversions - currentConversions),
    };
  }
}
