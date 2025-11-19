import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsageMetricType } from '@prisma/client';
import Stripe from 'stripe';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';

import { StripeService } from './stripe.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  // Usage limits per tier
  private readonly usageLimits = {
    free: {
      esg_calculation: 10,
      monte_carlo_simulation: 3,
      goal_probability: 3,
      scenario_analysis: 1,
      portfolio_rebalance: 0, // Premium only
      api_request: 1000,
    },
    premium: {
      esg_calculation: Infinity,
      monte_carlo_simulation: Infinity,
      goal_probability: Infinity,
      scenario_analysis: Infinity,
      portfolio_rebalance: Infinity,
      api_request: Infinity,
    },
  };

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private audit: AuditService,
    private config: ConfigService
  ) {}

  /**
   * Initiate upgrade to premium subscription
   */
  async upgradeToPremium(userId: string): Promise<{ checkoutUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, stripeCustomerId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if already premium
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (currentUser?.subscriptionTier === 'premium') {
      throw new Error('User is already on premium tier');
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.createCustomer({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });

      customerId = customer.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const priceId = this.config.get<string>('STRIPE_PREMIUM_PRICE_ID');
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');

    const session = await this.stripe.createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${webUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${webUrl}/billing/cancel`,
      metadata: { userId },
    });

    await this.audit.log({
      userId,
      action: 'BILLING_UPGRADE_INITIATED',
      severity: 'medium',
      metadata: JSON.stringify({ sessionId: session.id }),
    });

    this.logger.log(`Upgrade initiated for user ${userId}, session: ${session.id}`);

    return { checkoutUrl: session.url };
  }

  /**
   * Create billing portal session for subscription management
   */
  async createPortalSession(userId: string): Promise<{ portalUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found for this user');
    }

    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');

    const session = await this.stripe.createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${webUrl}/billing`,
    });

    return { portalUrl: session.url };
  }

  /**
   * Handle Stripe webhook: subscription created
   */
  async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error(`User not found for Stripe customer: ${customerId}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'premium',
        subscriptionStartedAt: new Date(subscription.current_period_start * 1000),
        subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
        stripeSubscriptionId: subscription.id,
      },
    });

    await this.prisma.billingEvent.create({
      data: {
        userId: user.id,
        type: 'subscription_created',
        amount: (subscription.items.data[0].price.unit_amount || 0) / 100,
        currency: (subscription.currency.toUpperCase() as any) || 'USD',
        status: 'succeeded',
        stripeEventId: event.id,
        metadata: { subscriptionId: subscription.id },
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'SUBSCRIPTION_ACTIVATED',
      severity: 'high',
      metadata: JSON.stringify({
        tier: 'premium',
        subscriptionId: subscription.id,
      }),
    });

    this.logger.log(`Subscription created for user ${user.id}`);
  }

  /**
   * Handle Stripe webhook: subscription updated
   */
  async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error(`User not found for Stripe customer: ${customerId}`);
      return;
    }

    // Update subscription details
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
      },
    });

    this.logger.log(`Subscription updated for user ${user.id}`);
  }

  /**
   * Handle Stripe webhook: subscription cancelled
   */
  async handleSubscriptionCancelled(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error(`User not found for Stripe customer: ${customerId}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
        stripeSubscriptionId: null,
      },
    });

    await this.prisma.billingEvent.create({
      data: {
        userId: user.id,
        type: 'subscription_cancelled',
        amount: 0,
        currency: 'USD',
        status: 'succeeded',
        stripeEventId: event.id,
        metadata: { subscriptionId: subscription.id },
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'SUBSCRIPTION_CANCELLED',
      severity: 'medium',
      metadata: JSON.stringify({ subscriptionId: subscription.id }),
    });

    this.logger.log(`Subscription cancelled for user ${user.id}`);
  }

  /**
   * Handle Stripe webhook: payment succeeded
   */
  async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error(`User not found for Stripe customer: ${customerId}`);
      return;
    }

    await this.prisma.billingEvent.create({
      data: {
        userId: user.id,
        type: 'payment_succeeded',
        amount: (invoice.amount_paid || 0) / 100,
        currency: (invoice.currency.toUpperCase() as any) || 'USD',
        status: 'succeeded',
        stripeEventId: event.id,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription as string,
        },
      },
    });

    this.logger.log(`Payment succeeded for user ${user.id}, amount: ${invoice.amount_paid / 100}`);
  }

  /**
   * Handle Stripe webhook: payment failed
   */
  async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error(`User not found for Stripe customer: ${customerId}`);
      return;
    }

    await this.prisma.billingEvent.create({
      data: {
        userId: user.id,
        type: 'payment_failed',
        amount: (invoice.amount_due || 0) / 100,
        currency: (invoice.currency.toUpperCase() as any) || 'USD',
        status: 'failed',
        stripeEventId: event.id,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription as string,
        },
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'PAYMENT_FAILED',
      severity: 'high',
      metadata: JSON.stringify({
        amount: invoice.amount_due / 100,
        invoiceId: invoice.id,
      }),
    });

    this.logger.warn(`Payment failed for user ${user.id}, amount: ${invoice.amount_due / 100}`);
  }

  /**
   * Record usage metric for a user
   */
  async recordUsage(userId: string, metricType: UsageMetricType): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.usageMetric.upsert({
      where: {
        userId_metricType_date: {
          userId,
          metricType,
          date: today,
        },
      },
      create: {
        userId,
        metricType,
        date: today,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });
  }

  /**
   * Check if user has exceeded usage limit for a metric type
   */
  async checkUsageLimit(userId: string, metricType: UsageMetricType): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return false;
    }

    // Premium users have unlimited usage
    if (user.subscriptionTier === 'premium') {
      return true;
    }

    const limit = this.usageLimits.free[metricType];

    // Infinity limit means unlimited for this tier
    if (limit === Infinity) {
      return true;
    }

    // 0 limit means feature is not available for this tier
    if (limit === 0) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.usageMetric.findUnique({
      where: {
        userId_metricType_date: {
          userId,
          metricType,
          date: today,
        },
      },
    });

    const currentCount = usage?.count || 0;
    return currentCount < limit;
  }

  /**
   * Get usage limits configuration
   */
  getUsageLimits() {
    return this.usageLimits;
  }

  /**
   * Get user's current usage for today
   */
  async getUserUsage(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    const metrics = await this.prisma.usageMetric.findMany({
      where: {
        userId,
        date: today,
      },
    });

    const usageByType: Record<string, { used: number; limit: number }> = {};

    for (const metricType of Object.keys(this.usageLimits.free) as UsageMetricType[]) {
      const metric = metrics.find((m) => m.metricType === metricType);
      const limit = this.usageLimits[user?.subscriptionTier || 'free'][metricType];

      usageByType[metricType] = {
        used: metric?.count || 0,
        limit: limit === Infinity ? -1 : limit, // -1 represents unlimited
      };
    }

    return {
      date: today,
      tier: user?.subscriptionTier || 'free',
      usage: usageByType,
    };
  }

  /**
   * Get billing history for a user
   */
  async getBillingHistory(userId: string, limit = 20) {
    return this.prisma.billingEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
