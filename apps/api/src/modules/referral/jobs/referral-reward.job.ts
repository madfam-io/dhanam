import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { AmbassadorService } from '../ambassador.service';
import { ReferralRewardService } from '../referral-reward.service';

/**
 * =============================================================================
 * Referral Reward Job
 * =============================================================================
 * Processes converted referrals that have not yet been rewarded.
 *
 * Runs every 15 minutes to:
 * 1. Find referrals in "converted" status (not yet rewarded)
 * 2. Calculate rewards (subscription extensions + credit grants)
 * 3. Apply each reward (Stripe or credit balance)
 * 4. Recalculate ambassador tier for the referrer
 *
 * Designed to be idempotent: if a referral already has rewards, they are
 * not duplicated. If a reward is already applied, it is skipped.
 * =============================================================================
 */
@Injectable()
export class ReferralRewardJob {
  private readonly logger = new Logger(ReferralRewardJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardService: ReferralRewardService,
    private readonly ambassadorService: AmbassadorService
  ) {}

  /**
   * Process pending referral rewards every 15 minutes.
   */
  @Cron('*/15 * * * *', { name: 'referral-reward-processing' })
  async processRewards(): Promise<void> {
    this.logger.log('Starting referral reward processing');

    // Find converted referrals that have not been rewarded yet
    const convertedReferrals = await this.prisma.referral.findMany({
      where: { status: 'converted' },
      select: {
        id: true,
        referralCode: {
          select: { referrerUserId: true },
        },
      },
      take: 100, // Process in batches to avoid overload
    });

    if (convertedReferrals.length === 0) {
      this.logger.debug('No converted referrals to process');
      return;
    }

    this.logger.log(`Processing ${convertedReferrals.length} converted referrals`);

    let processed = 0;
    let failed = 0;
    const referrersToRecalculate = new Set<string>();

    for (const referral of convertedReferrals) {
      try {
        // Step 1: Calculate rewards
        const { rewardIds } = await this.rewardService.calculateRewards(referral.id);

        // Step 2: Apply each reward
        for (const rewardId of rewardIds) {
          try {
            await this.rewardService.applyReward(rewardId);
          } catch (rewardError) {
            this.logger.error(
              `Failed to apply reward ${rewardId}: ${(rewardError as Error).message}`
            );
          }
        }

        // Track referrer for tier recalculation
        referrersToRecalculate.add(referral.referralCode.referrerUserId);
        processed++;
      } catch (error) {
        this.logger.error(
          `Failed to process referral ${referral.id}: ${(error as Error).message}`,
          (error as Error).stack
        );
        failed++;
      }
    }

    // Step 3: Recalculate ambassador tiers for all affected referrers
    for (const referrerId of referrersToRecalculate) {
      try {
        await this.ambassadorService.recalculateTier(referrerId);
      } catch (error) {
        this.logger.error(
          `Failed to recalculate tier for ${referrerId}: ${(error as Error).message}`
        );
      }
    }

    this.logger.log(
      `Referral reward processing complete: ${processed} processed, ${failed} failed, ${referrersToRecalculate.size} tiers recalculated`
    );
  }
}
