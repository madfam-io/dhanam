import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuditService } from '../../../core/audit/audit.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PostHogService } from '../../analytics/posthog.service';
import { CancelReasonEnum } from '../dto/cancel-intent.dto';
import { StripeService } from '../stripe.service';

import { SubscriptionLifecycleService } from './subscription-lifecycle.service';

/**
 * Cancellation-Intent Reengagement Service
 *
 * Implements a 3-step cancellation pipeline:
 *   1. Collect reason → return tailored save offer
 *   2. User accepts offer (discount/pause) or proceeds to cancel
 *   3. Execute cancellation at period end (never immediate)
 *
 * Designed to be subtle and inviting — no guilt-tripping.
 * Tracks every attempt (even abandoned ones) for retention analytics.
 */

interface SaveOffer {
  type: 'discount' | 'pause' | 'roadmap' | 'support' | 'loss_aversion';
  intentId: string;
  discountPercent?: number;
  discountMonths?: number;
  suggestedPauseMonths?: number[];
  message?: string;
  features?: string[];
  supportUrl?: string;
}

@Injectable()
export class CancellationService {
  private readonly logger = new Logger(CancellationService.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private audit: AuditService,
    private config: ConfigService,
    private posthog: PostHogService,
    private lifecycle: SubscriptionLifecycleService
  ) {}

  /**
   * Step 1: Start a cancellation intent. Records the reason and
   * returns a tailored save offer based on the reason category.
   */
  async startCancelIntent(
    userId: string,
    reason: CancelReasonEnum,
    reasonText?: string
  ): Promise<{ intentId: string; saveOffer: SaveOffer }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, subscriptionTier: true, stripeSubscriptionId: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (!user.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription to cancel');
    }

    const intent = await this.prisma.cancellationIntent.create({
      data: {
        userId,
        reason: reason as any,
        reasonText,
      },
    });

    const saveOffer = this.buildSaveOffer(intent.id, reason, user.subscriptionTier);

    await this.prisma.cancellationIntent.update({
      where: { id: intent.id },
      data: { saveOfferType: saveOffer.type },
    });

    await this.posthog.capture({
      distinctId: userId,
      event: 'cancel_reason_selected',
      properties: {
        reason,
        reason_text: reasonText,
        tier: user.subscriptionTier,
        save_offer_type: saveOffer.type,
      },
    });

    this.logger.log(
      `Cancel intent started: user=${userId} reason=${reason} offer=${saveOffer.type}`
    );

    return { intentId: intent.id, saveOffer };
  }

  /**
   * Step 2a: Accept a save offer (discount). Applies a coupon to the subscription.
   */
  async applySaveDiscount(userId: string, intentId: string): Promise<{ saved: true }> {
    const intent = await this.validateIntent(userId, intentId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true, subscriptionTier: true },
    });

    if (!user?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription');
    }

    const couponId = this.config.get<string>('STRIPE_RETENTION_COUPON_ID');
    if (!couponId) {
      this.logger.warn('STRIPE_RETENTION_COUPON_ID not configured, cannot apply save discount');
      throw new BadRequestException('Save discount not available');
    }

    await this.stripe.applyCouponToSubscription(user.stripeSubscriptionId, couponId);

    await this.prisma.cancellationIntent.update({
      where: { id: intentId },
      data: {
        outcome: 'retained_discount',
        discountPercent: 30,
        discountMonths: 3,
        completedAt: new Date(),
      },
    });

    await this.posthog.capture({
      distinctId: userId,
      event: 'save_offer_accepted',
      properties: {
        offer_type: 'discount',
        reason: intent.reason,
        tier: user.subscriptionTier,
      },
    });

    this.logger.log(`Save offer accepted (discount): user=${userId}`);
    return { saved: true };
  }

  /**
   * Step 2b: Pause subscription for N months instead of cancelling.
   */
  async pauseSubscription(
    userId: string,
    months: number,
    intentId?: string
  ): Promise<{ pausedUntil: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true, subscriptionTier: true },
    });

    if (!user?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription to pause');
    }

    const resumesAt = new Date();
    resumesAt.setMonth(resumesAt.getMonth() + months);
    const resumesAtUnix = Math.floor(resumesAt.getTime() / 1000);

    await this.stripe.pauseSubscription(user.stripeSubscriptionId, resumesAtUnix);

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionPausedUntil: resumesAt },
    });

    if (intentId) {
      await this.prisma.cancellationIntent.update({
        where: { id: intentId },
        data: {
          outcome: 'retained_pause',
          pauseMonths: months,
          completedAt: new Date(),
        },
      });
    }

    await this.prisma.billingEvent.create({
      data: {
        userId,
        type: 'subscription_paused',
        amount: 0,
        currency: 'USD',
        status: 'succeeded',
        metadata: { pause_months: months, resumes_at: resumesAt.toISOString() },
      },
    });

    await this.posthog.capture({
      distinctId: userId,
      event: 'pause_accepted',
      properties: {
        months,
        resumes_at: resumesAt.toISOString(),
        tier: user.subscriptionTier,
      },
    });

    this.logger.log(`Subscription paused: user=${userId} months=${months}`);
    return { pausedUntil: resumesAt.toISOString() };
  }

  /**
   * Step 3: Confirm cancellation at period end.
   * This is the final step — user has seen the reason form and save offer.
   */
  async confirmCancellation(userId: string, intentId: string): Promise<{ periodEnd: string }> {
    const intent = await this.validateIntent(userId, intentId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeSubscriptionId: true,
        subscriptionTier: true,
      },
    });

    if (!user?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription');
    }

    // Cancel at period end (never immediate)
    const subscription = await this.stripe.cancelAtPeriodEnd(user.stripeSubscriptionId);
    const periodEnd = new Date((subscription as any).current_period_end * 1000);

    // Update user fields
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        cancelledAt: new Date(),
        cancellationReason: `${intent.reason}${intent.reasonText ? `: ${intent.reasonText}` : ''}`,
      },
    });

    // Update intent
    await this.prisma.cancellationIntent.update({
      where: { id: intentId },
      data: { outcome: 'cancelled', completedAt: new Date() },
    });

    // Audit + billing event
    await this.audit.log({
      userId,
      action: 'SUBSCRIPTION_CANCEL_CONFIRMED',
      severity: 'high',
      metadata: {
        reason: intent.reason,
        reasonText: intent.reasonText,
        periodEnd: periodEnd.toISOString(),
      },
    });

    await this.prisma.billingEvent.create({
      data: {
        userId,
        type: 'subscription_cancelled',
        amount: 0,
        currency: 'USD',
        status: 'succeeded',
        metadata: {
          reason: intent.reason,
          reason_text: intent.reasonText,
          period_end: periodEnd.toISOString(),
          intent_id: intentId,
        },
      },
    });

    // PostHog
    await this.posthog.capture({
      distinctId: userId,
      event: 'cancel_confirmed',
      properties: {
        reason: intent.reason,
        tier: user.subscriptionTier,
        period_end: periodEnd.toISOString(),
      },
    });

    // Enroll in retention drip campaign
    try {
      await this.prisma.dripEvent.create({
        data: {
          userId,
          campaign: 'cancellation-retention',
          step: 'enrolled',
        },
      });
    } catch {
      // Non-critical — drip enrollment failure shouldn't block cancellation
      this.logger.warn(`Failed to enroll user ${userId} in retention drip`);
    }

    // Notify product webhooks (Karafiel, etc.)
    this.lifecycle
      .notifyProductWebhooks('', '', '', 'subscription.cancelled')
      .catch((err) => this.logger.warn(`Product webhook failed: ${err.message}`));

    this.logger.log(
      `Subscription cancelled: user=${userId} reason=${intent.reason} period_end=${periodEnd.toISOString()}`
    );
    return { periodEnd: periodEnd.toISOString() };
  }

  // ────────────────────────────────────────────
  // Private helpers
  // ────────────────────────────────────────────

  private async validateIntent(userId: string, intentId: string) {
    const intent = await this.prisma.cancellationIntent.findUnique({
      where: { id: intentId },
    });

    if (!intent) throw new NotFoundException('Cancellation intent not found');
    if (intent.userId !== userId)
      throw new BadRequestException('Intent does not belong to this user');
    if (intent.outcome !== 'abandoned') {
      throw new BadRequestException(`Intent already resolved with outcome: ${intent.outcome}`);
    }

    return intent;
  }

  private buildSaveOffer(intentId: string, reason: CancelReasonEnum, tier: string): SaveOffer {
    switch (reason) {
      case CancelReasonEnum.TOO_EXPENSIVE:
        return {
          type: 'discount',
          intentId,
          discountPercent: 30,
          discountMonths: 3,
          message: 'How about 30% off for the next 3 months? We want to make it work for you.',
        };

      case CancelReasonEnum.MISSING_FEATURES:
        return {
          type: 'roadmap',
          intentId,
          message:
            this.config.get<string>('RETENTION_ROADMAP_MESSAGE') ||
            "We're actively building new features based on user feedback. Your input helps shape what comes next.",
        };

      case CancelReasonEnum.SWITCHED_SERVICE:
        return {
          type: 'loss_aversion',
          intentId,
          message: "We respect your decision. Here's what you'd lose access to:",
          features: this.getTierFeatures(tier),
        };

      case CancelReasonEnum.TECHNICAL_ISSUES:
        return {
          type: 'support',
          intentId,
          message: "We're sorry you've had trouble. Our team can help fix this.",
          supportUrl: this.config.get<string>('SUPPORT_URL') || 'mailto:soporte@madfam.io',
        };

      case CancelReasonEnum.UNUSED:
      case CancelReasonEnum.OTHER:
      default:
        return {
          type: 'pause',
          intentId,
          suggestedPauseMonths: [1, 2, 3],
          message:
            'Take a break instead? Pause your subscription and come back when you are ready — no charge while paused.',
        };
    }
  }

  private getTierFeatures(tier: string): string[] {
    const features: Record<string, string[]> = {
      essentials: ['AI categorization', 'Bank sync', 'Cashflow forecast', 'ESG scoring'],
      pro: [
        'Everything in Essentials',
        'Unlimited simulations',
        'DeFi tracking',
        'Estate planning',
        'Household views',
      ],
      premium: ['Everything in Pro', 'Advanced analytics', 'Priority support', '25 GB storage'],
    };
    return features[tier] || features.essentials || [];
  }
}
