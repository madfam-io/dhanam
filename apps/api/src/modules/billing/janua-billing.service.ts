import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Janua Billing Service
 *
 * Integrates with Janua's multi-provider billing system:
 * - Conekta for Mexico (SPEI, cards, CFDI)
 * - Polar.sh for international digital products
 * - Stripe as fallback
 *
 * This service handles provider routing based on geographic location.
 */
@Injectable()
export class JanuaBillingService {
  private readonly logger = new Logger(JanuaBillingService.name);
  private readonly januaApiUrl: string;
  private readonly januaApiKey: string;
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.januaApiUrl = this.config.get<string>('JANUA_API_URL', 'http://janua-api:8001');
    this.januaApiKey = this.config.get<string>('JANUA_API_KEY', '');
    this.enabled = this.config.get<boolean>('JANUA_BILLING_ENABLED', true);

    if (this.enabled && this.januaApiKey) {
      this.logger.log('Janua billing service initialized');
    } else {
      this.logger.warn('Janua billing disabled - falling back to direct Stripe');
    }
  }

  /**
   * Check if Janua billing is available
   */
  isEnabled(): boolean {
    return this.enabled && !!this.januaApiKey;
  }

  /**
   * Determine the best payment provider for a country
   */
  getProviderForCountry(countryCode: string): 'conekta' | 'polar' | 'stripe' {
    // Mexico → Conekta (supports SPEI, cards, CFDI)
    if (countryCode === 'MX') {
      return 'conekta';
    }

    // Digital products / International → Polar.sh
    // Polar handles tax compliance as MoR
    return 'polar';
  }

  /**
   * Create a customer via Janua's unified API
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    countryCode: string;
    metadata?: Record<string, string>;
  }): Promise<{ customerId: string; provider: string }> {
    if (!this.isEnabled()) {
      throw new Error('Janua billing not enabled');
    }

    const provider = this.getProviderForCountry(params.countryCode);

    const response = await fetch(`${this.januaApiUrl}/api/billing/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.januaApiKey}`,
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name,
        country_code: params.countryCode,
        provider,
        metadata: {
          ...params.metadata,
          product: 'dhanam',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Janua customer creation failed: ${error}`);
      throw new Error(`Failed to create customer: ${error}`);
    }

    const data = await response.json();
    this.logger.log(`Created customer via Janua (${provider}): ${data.customer_id}`);

    return {
      customerId: data.customer_id,
      provider,
    };
  }

  /**
   * Create a checkout session via Janua
   */
  async createCheckoutSession(params: {
    customerId: string;
    customerEmail: string;
    priceId: string;
    countryCode: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ checkoutUrl: string; sessionId: string; provider: string }> {
    if (!this.isEnabled()) {
      throw new Error('Janua billing not enabled');
    }

    const provider = this.getProviderForCountry(params.countryCode);

    const response = await fetch(`${this.januaApiUrl}/api/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.januaApiKey}`,
      },
      body: JSON.stringify({
        customer_id: params.customerId,
        customer_email: params.customerEmail,
        plan_id: `dhanam_${params.priceId}`,
        country_code: params.countryCode,
        provider,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          ...params.metadata,
          product: 'dhanam',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Janua checkout creation failed: ${error}`);
      throw new Error(`Failed to create checkout: ${error}`);
    }

    const data = await response.json();
    this.logger.log(`Created checkout session via Janua (${provider}): ${data.session_id}`);

    return {
      checkoutUrl: data.checkout_url,
      sessionId: data.session_id,
      provider,
    };
  }

  /**
   * Create a billing portal session via Janua
   */
  async createPortalSession(params: {
    customerId: string;
    countryCode: string;
    returnUrl: string;
  }): Promise<{ portalUrl: string }> {
    if (!this.isEnabled()) {
      throw new Error('Janua billing not enabled');
    }

    const provider = this.getProviderForCountry(params.countryCode);

    const response = await fetch(`${this.januaApiUrl}/api/billing/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.januaApiKey}`,
      },
      body: JSON.stringify({
        customer_id: params.customerId,
        provider,
        return_url: params.returnUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Janua portal creation failed: ${error}`);
      throw new Error(`Failed to create portal session: ${error}`);
    }

    const data = await response.json();
    return { portalUrl: data.portal_url };
  }

  /**
   * Cancel a subscription via Janua
   */
  async cancelSubscription(params: {
    subscriptionId: string;
    provider: string;
    immediate?: boolean;
  }): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('Janua billing not enabled');
    }

    const response = await fetch(`${this.januaApiUrl}/api/billing/subscriptions/${params.subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.januaApiKey}`,
      },
      body: JSON.stringify({
        provider: params.provider,
        immediate: params.immediate ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Janua subscription cancellation failed: ${error}`);
      throw new Error(`Failed to cancel subscription: ${error}`);
    }

    this.logger.log(`Cancelled subscription via Janua: ${params.subscriptionId}`);
  }

  /**
   * Get available plans with localized pricing
   */
  async getPlans(countryCode: string): Promise<Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
  }>> {
    const isMexico = countryCode === 'MX';

    // Dhanam plans
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: isMexico ? 'MXN' : 'USD',
        interval: 'month',
        features: [
          '10 ESG calculations/day',
          '3 Monte Carlo simulations/day',
          '3 Goal probability analyses/day',
          '1 Scenario analysis/day',
          '1,000 API requests/day',
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: isMexico ? 499 : 29,
        currency: isMexico ? 'MXN' : 'USD',
        interval: 'month',
        features: [
          'Unlimited ESG calculations',
          'Unlimited Monte Carlo simulations',
          'Unlimited Goal probability analyses',
          'Unlimited Scenario analyses',
          'Portfolio rebalancing',
          'Unlimited API requests',
          'Priority support',
        ],
      },
    ];
  }

  /**
   * Verify webhook signature from Janua
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = this.config.get<string>('JANUA_WEBHOOK_SECRET', '');

    if (!webhookSecret) {
      this.logger.warn('JANUA_WEBHOOK_SECRET not configured');
      return false;
    }

    // Janua uses HMAC-SHA256 for webhook signatures
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
