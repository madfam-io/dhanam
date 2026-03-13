import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@core/prisma/prisma.service';

import { TrialService } from '../services/trial.service';

@Injectable()
export class SubscriptionLifecycleJob {
  private readonly logger = new Logger(SubscriptionLifecycleJob.name);

  constructor(
    private prisma: PrismaService,
    private trialService: TrialService
  ) {}

  /**
   * Hourly job to handle trial expirations and promo transitions.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleSubscriptionLifecycle(): Promise<void> {
    const now = new Date();

    // 1. Find expired trials
    const expiredTrials = await this.prisma.user.findMany({
      where: {
        trialTier: { not: null },
        trialEndsAt: { lte: now },
      },
      select: { id: true },
    });

    for (const user of expiredTrials) {
      try {
        await this.trialService.endTrial(user.id);
      } catch (error) {
        this.logger.error(`Failed to end trial for user ${user.id}: ${(error as Error).message}`);
      }
    }

    if (expiredTrials.length > 0) {
      this.logger.log(`Processed ${expiredTrials.length} expired trials`);
    }

    // 2. Find expired promos — transition to regular pricing
    const expiredPromos = await this.prisma.user.findMany({
      where: {
        promoStartedAt: { not: null },
        promoEndsAt: { lte: now },
      },
      select: { id: true },
    });

    for (const user of expiredPromos) {
      try {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            promoStartedAt: null,
            promoEndsAt: null,
          },
        });
      } catch (error) {
        this.logger.error(`Failed to end promo for user ${user.id}: ${(error as Error).message}`);
      }
    }

    if (expiredPromos.length > 0) {
      this.logger.log(`Processed ${expiredPromos.length} expired promos`);
    }
  }
}
