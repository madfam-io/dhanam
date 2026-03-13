import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { AuditService } from '@core/audit/audit.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { SubscriptionTier } from '@db';

@Injectable()
export class TrialService {
  private readonly logger = new Logger(TrialService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  /**
   * Start a free trial for a user.
   * - Without CC: 3 days
   * - With CC: 21 days
   */
  async startTrial(userId: string, tier: SubscriptionTier, hasCreditCard: boolean): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trialTier: true, subscriptionTier: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.trialTier) {
      throw new BadRequestException('User already has an active trial');
    }

    if (user.subscriptionTier !== 'community') {
      throw new BadRequestException('User already has an active subscription');
    }

    const trialDays = hasCreditCard ? 21 : 3;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        trialTier: tier,
        trialEndsAt,
        trialHasCreditCard: hasCreditCard,
        subscriptionTier: tier,
      },
    });

    await this.audit.log({
      userId,
      action: 'TRIAL_STARTED',
      severity: 'medium',
      metadata: { tier, trialDays, hasCreditCard },
    });

    this.logger.log(`Trial started for user ${userId}: ${tier} tier, ${trialDays} days`);
  }

  /**
   * Extend a trial by adding credit card (3 days -> 21 days from trial start).
   */
  async extendTrialWithCC(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        trialTier: true,
        trialEndsAt: true,
        trialHasCreditCard: true,
      },
    });

    if (!user?.trialTier || !user.trialEndsAt) {
      throw new BadRequestException('No active trial found');
    }

    if (user.trialHasCreditCard) {
      throw new BadRequestException('Trial already extended with credit card');
    }

    // Extend to 21 days from when the trial effectively started
    // (trial start = trialEndsAt minus original 3 days)
    const trialStartDate = new Date(user.trialEndsAt);
    trialStartDate.setDate(trialStartDate.getDate() - 3);

    const newTrialEndsAt = new Date(trialStartDate);
    newTrialEndsAt.setDate(newTrialEndsAt.getDate() + 21);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        trialHasCreditCard: true,
        trialEndsAt: newTrialEndsAt,
      },
    });

    await this.audit.log({
      userId,
      action: 'TRIAL_EXTENDED',
      severity: 'medium',
      metadata: { newTrialEndsAt },
    });

    this.logger.log(`Trial extended for user ${userId} to ${newTrialEndsAt}`);
  }

  /**
   * End a user's trial.
   * - With CC: start promo billing
   * - Without CC: downgrade to community
   */
  async endTrial(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        trialTier: true,
        trialHasCreditCard: true,
      },
    });

    if (!user?.trialTier) {
      return; // No active trial, nothing to do
    }

    if (user.trialHasCreditCard) {
      // Start promo period
      await this.startPromo(userId, user.trialTier);
    } else {
      // Downgrade to community
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: 'community',
          trialTier: null,
          trialEndsAt: null,
        },
      });

      await this.audit.log({
        userId,
        action: 'TRIAL_EXPIRED',
        severity: 'low',
        metadata: { hadCreditCard: false },
      });
    }

    this.logger.log(`Trial ended for user ${userId}`);
  }

  /**
   * Start the 3-month promo period after trial.
   */
  async startPromo(userId: string, tier: SubscriptionTier): Promise<void> {
    const now = new Date();
    const promoEndsAt = new Date(now);
    promoEndsAt.setMonth(promoEndsAt.getMonth() + 3);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        promoStartedAt: now,
        promoEndsAt,
        trialTier: null,
        trialEndsAt: null,
        subscriptionTier: tier,
      },
    });

    await this.audit.log({
      userId,
      action: 'PROMO_STARTED',
      severity: 'medium',
      metadata: { tier, promoEndsAt },
    });

    this.logger.log(`Promo started for user ${userId}: ${tier} tier, ends ${promoEndsAt}`);
  }

  /**
   * Check if a user is currently in a trial.
   */
  isInTrial(user: { trialTier: string | null; trialEndsAt: Date | null }): boolean {
    return !!(user.trialTier && user.trialEndsAt && new Date(user.trialEndsAt) > new Date());
  }

  /**
   * Check if a user is currently in promo period.
   */
  isInPromo(user: { promoStartedAt: Date | null; promoEndsAt: Date | null }): boolean {
    return !!(user.promoStartedAt && user.promoEndsAt && new Date(user.promoEndsAt) > new Date());
  }

  /**
   * Get the effective tier a user should experience right now.
   */
  getEffectiveTier(user: {
    subscriptionTier: SubscriptionTier;
    trialTier: SubscriptionTier | null;
    trialEndsAt: Date | null;
  }): SubscriptionTier {
    if (
      this.isInTrial({
        trialTier: user.trialTier,
        trialEndsAt: user.trialEndsAt,
      })
    ) {
      return user.trialTier!;
    }
    return user.subscriptionTier;
  }
}
