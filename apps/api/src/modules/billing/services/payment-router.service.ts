/**
 * =============================================================================
 * Payment Router Service (Hybrid Strategy)
 * =============================================================================
 * Routes payments to the optimal provider based on customer geography:
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    HYBRID PAYMENT ROUTER                        │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                  │
 * │    Customer Country                                             │
 * │           │                                                      │
 * │           ▼                                                      │
 * │    ┌──────┴──────┐                                              │
 * │    │   Mexico?   │                                              │
 * │    └──────┬──────┘                                              │
 * │       YES │  NO                                                  │
 * │           │                                                      │
 * │     ┌─────▼─────┐    ┌──────────────┐                          │
 * │     │ Stripe MX │    │   Paddle     │                          │
 * │     │  (MXN)    │    │  (MoR/USD)   │                          │
 * │     └───────────┘    └──────────────┘                          │
 * │                                                                  │
 * │  Payment Methods:     Payment Methods:                          │
 * │  - Cards              - Cards (global)                          │
 * │  - OXXO               - PayPal                                  │
 * │  - SPEI               - Apple Pay                               │
 * │                       - Google Pay                              │
 * │                                                                  │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Benefits:
 * - Native MXN pricing for Mexican customers (no FX fees)
 * - Local payment methods (OXXO cash, SPEI bank transfer)
 * - Paddle as Merchant of Record for global (tax compliance)
 * - Automatic routing based on geography
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@core/prisma/prisma.service';

import { StripeMxService } from './stripe-mx.service';
import { PaddleService } from './paddle.service';

export type PaymentProvider = 'stripe_mx' | 'paddle';

export interface CreateCheckoutParams {
  userId: string;
  priceId: string;
  countryCode: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
  provider: PaymentProvider;
  currency: string;
}

export interface ProviderConfig {
  provider: PaymentProvider;
  currency: string;
  paymentMethods: string[];
  taxHandling: 'automatic' | 'manual';
}

@Injectable()
export class PaymentRouterService {
  private readonly logger = new Logger(PaymentRouterService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private stripeMx: StripeMxService,
    private paddle: PaddleService
  ) {
    this.logger.log('Payment Router initialized (Hybrid Strategy: Stripe MX + Paddle)');
  }

  /**
   * Determine the best payment provider for a country
   */
  getProviderForCountry(countryCode: string): ProviderConfig {
    // Mexico → Stripe MX (native MXN, OXXO, SPEI)
    if (countryCode === 'MX') {
      return {
        provider: 'stripe_mx',
        currency: 'MXN',
        paymentMethods: ['card', 'oxxo', 'spei'],
        taxHandling: 'automatic', // Stripe Tax handles Mexican IVA
      };
    }

    // All other countries → Paddle (Merchant of Record)
    return {
      provider: 'paddle',
      currency: 'USD', // Paddle converts to local currency at checkout
      paymentMethods: ['card', 'paypal', 'apple_pay', 'google_pay'],
      taxHandling: 'automatic', // Paddle handles global tax compliance
    };
  }

  /**
   * Create a checkout session using the appropriate provider
   */
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const { userId, priceId, countryCode, successUrl, cancelUrl, metadata } = params;

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
        paddleCustomerId: true,
        billingCountry: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Determine provider based on country
    const providerConfig = this.getProviderForCountry(countryCode);

    this.logger.log(
      `Routing checkout for ${user.email} to ${providerConfig.provider} (${countryCode})`
    );

    // Route to appropriate provider
    if (providerConfig.provider === 'stripe_mx') {
      return this.createStripeCheckout(user, priceId, successUrl, cancelUrl, metadata);
    } else {
      return this.createPaddleCheckout(user, priceId, countryCode, successUrl, cancelUrl, metadata);
    }
  }

  /**
   * Create Stripe MX checkout session
   */
  private async createStripeCheckout(
    user: { id: string; email: string; name: string | null; stripeCustomerId: string | null },
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<CheckoutResult> {
    if (!this.stripeMx.isConfigured()) {
      throw new Error('Stripe MX not configured');
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeMx.createCustomer({
        email: user.email,
        name: user.name || undefined,
        metadata: { dhanam_user_id: user.id },
      });

      customerId = customer.id;

      // Save customer ID
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId: customerId,
          billingProvider: 'stripe_mx',
          billingCountry: 'MX',
        },
      });
    }

    // Create checkout session
    const session = await this.stripeMx.createCheckoutSession({
      customerId,
      customerEmail: user.email,
      customerName: user.name || undefined,
      priceId,
      successUrl: `${successUrl}?provider=stripe_mx&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl,
      metadata: {
        ...metadata,
        dhanam_user_id: user.id,
      },
      paymentMethods: ['card', 'oxxo'],
    });

    return {
      checkoutUrl: session.url!,
      sessionId: session.id,
      provider: 'stripe_mx',
      currency: 'MXN',
    };
  }

  /**
   * Create Paddle checkout transaction
   */
  private async createPaddleCheckout(
    user: { id: string; email: string; name: string | null; paddleCustomerId: string | null },
    priceId: string,
    countryCode: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<CheckoutResult> {
    if (!this.paddle.isConfigured()) {
      throw new Error('Paddle not configured');
    }

    // Create or retrieve Paddle customer
    let customerId = user.paddleCustomerId;
    if (!customerId) {
      const customer = await this.paddle.createCustomer({
        email: user.email,
        name: user.name || undefined,
        countryCode,
        metadata: { dhanam_user_id: user.id },
      });

      customerId = customer.customerId;

      // Save customer ID
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          paddleCustomerId: customerId,
          billingProvider: 'paddle',
          billingCountry: countryCode,
        },
      });
    }

    // Create transaction
    const transaction = await this.paddle.createTransaction({
      customerId,
      customerEmail: user.email,
      customerName: user.name || undefined,
      priceId,
      successUrl: `${successUrl}?provider=paddle&transaction_id={transaction_id}`,
      cancelUrl,
      countryCode,
      metadata: {
        ...metadata,
        dhanam_user_id: user.id,
      },
    });

    return {
      checkoutUrl: transaction.checkoutUrl,
      sessionId: transaction.transactionId,
      provider: 'paddle',
      currency: 'USD',
    };
  }

  /**
   * Create billing portal session for subscription management
   */
  async createPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<{ portalUrl: string; provider: PaymentProvider }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        paddleCustomerId: true,
        billingProvider: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Route to the provider the user is subscribed with
    if (user.billingProvider === 'stripe_mx' && user.stripeCustomerId) {
      const session = await this.stripeMx.createPortalSession({
        customerId: user.stripeCustomerId,
        returnUrl,
      });
      return { portalUrl: session.url, provider: 'stripe_mx' };
    }

    if (user.billingProvider === 'paddle' && user.paddleCustomerId) {
      // Paddle doesn't have a portal - redirect to subscription page
      const portalUrl = `${returnUrl}?manage=paddle`;
      return { portalUrl, provider: 'paddle' };
    }

    throw new Error('User has no active billing provider');
  }

  /**
   * Cancel subscription via the appropriate provider
   */
  async cancelSubscription(
    userId: string,
    immediate: boolean = false
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeSubscriptionId: true,
        paddleSubscriptionId: true,
        billingProvider: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.billingProvider === 'stripe_mx' && user.stripeSubscriptionId) {
      await this.stripeMx.cancelSubscription(user.stripeSubscriptionId, immediate);
    } else if (user.billingProvider === 'paddle' && user.paddleSubscriptionId) {
      await this.paddle.cancelSubscription(user.paddleSubscriptionId, immediate);
    } else {
      throw new Error('No active subscription found');
    }

    this.logger.log(`Cancelled subscription for user ${userId} via ${user.billingProvider}`);
  }

  /**
   * Get available plans with localized pricing
   */
  getPlans(countryCode: string): Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
    provider: PaymentProvider;
  }> {
    const isMexico = countryCode === 'MX';
    const provider = this.getProviderForCountry(countryCode).provider;

    return [
      {
        id: 'free',
        name: isMexico ? 'Gratis' : 'Free',
        price: 0,
        currency: isMexico ? 'MXN' : 'USD',
        interval: 'month',
        features: isMexico
          ? [
              '10 cálculos ESG por día',
              '3 simulaciones Monte Carlo por día',
              '3 análisis de probabilidad de metas por día',
              '1 análisis de escenarios por día',
              '1,000 peticiones API por día',
            ]
          : [
              '10 ESG calculations per day',
              '3 Monte Carlo simulations per day',
              '3 Goal probability analyses per day',
              '1 Scenario analysis per day',
              '1,000 API requests per day',
            ],
        provider,
      },
      {
        id: 'premium_monthly',
        name: 'Premium',
        price: isMexico ? 499 : 29,
        currency: isMexico ? 'MXN' : 'USD',
        interval: 'month',
        features: isMexico
          ? [
              'Cálculos ESG ilimitados',
              'Simulaciones Monte Carlo ilimitadas',
              'Análisis de probabilidad de metas ilimitados',
              'Análisis de escenarios ilimitados',
              'Rebalanceo de portafolio',
              'Peticiones API ilimitadas',
              'Soporte prioritario',
            ]
          : [
              'Unlimited ESG calculations',
              'Unlimited Monte Carlo simulations',
              'Unlimited Goal probability analyses',
              'Unlimited Scenario analyses',
              'Portfolio rebalancing',
              'Unlimited API requests',
              'Priority support',
            ],
        provider,
      },
      {
        id: 'premium_yearly',
        name: isMexico ? 'Premium Anual' : 'Premium Annual',
        price: isMexico ? 4990 : 290, // ~2 months free
        currency: isMexico ? 'MXN' : 'USD',
        interval: 'year',
        features: isMexico
          ? [
              'Todo lo de Premium mensual',
              '2 meses gratis',
              'Acceso anticipado a nuevas funciones',
            ]
          : [
              'Everything in Premium monthly',
              '2 months free',
              'Early access to new features',
            ],
        provider,
      },
    ];
  }

  /**
   * Get Paddle client configuration for frontend
   */
  getPaddleClientConfig(): {
    clientToken: string;
    environment: string;
  } | null {
    if (!this.paddle.isConfigured()) {
      return null;
    }

    return {
      clientToken: this.paddle.getClientToken(),
      environment: this.paddle.getEnvironment(),
    };
  }
}
