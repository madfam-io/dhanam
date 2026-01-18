/**
 * =============================================================================
 * Paddle Service (Global Payments)
 * =============================================================================
 * Handles international payments as Merchant of Record:
 * - Credit/Debit Cards (worldwide)
 * - PayPal
 * - Apple Pay / Google Pay
 * - Automatic VAT/sales tax handling
 * - Multi-currency support (USD, EUR, GBP, etc.)
 *
 * Benefits of Paddle as MoR:
 * - Handles global tax compliance
 * - Invoicing and receipts
 * - Chargeback protection
 * - No need for local entities
 *
 * Credentials from dhanam-secrets K8s Secret:
 * - PADDLE_VENDOR_ID
 * - PADDLE_API_KEY
 * - PADDLE_CLIENT_TOKEN
 * - PADDLE_WEBHOOK_SECRET
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface PaddleCheckoutParams {
  customerId?: string;
  customerEmail: string;
  customerName?: string;
  priceId: string;
  successUrl: string;
  cancelUrl?: string;
  countryCode?: string;
  metadata?: Record<string, string>;
}

export interface PaddleCustomerParams {
  email: string;
  name?: string;
  countryCode?: string;
  metadata?: Record<string, string>;
}

export interface PaddleSubscription {
  id: string;
  status: 'active' | 'past_due' | 'paused' | 'canceled' | 'trialing';
  customerId: string;
  priceId: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

@Injectable()
export class PaddleService {
  private readonly logger = new Logger(PaddleService.name);
  private readonly apiUrl: string;
  private readonly vendorId: string;
  private readonly apiKey: string;
  private readonly clientToken: string;
  private readonly webhookSecret: string;
  private readonly environment: 'sandbox' | 'live';

  constructor(
    private config: ConfigService,
    private http: HttpService
  ) {
    this.vendorId = this.config.get<string>('PADDLE_VENDOR_ID', '');
    this.apiKey = this.config.get<string>('PADDLE_API_KEY', '');
    this.clientToken = this.config.get<string>('PADDLE_CLIENT_TOKEN', '');
    this.webhookSecret = this.config.get<string>('PADDLE_WEBHOOK_SECRET', '');
    this.environment = this.config.get<'sandbox' | 'live'>(
      'PADDLE_ENVIRONMENT',
      'sandbox'
    );

    // Paddle Billing API (v2)
    this.apiUrl =
      this.environment === 'live'
        ? 'https://api.paddle.com'
        : 'https://sandbox-api.paddle.com';

    if (!this.apiKey) {
      this.logger.warn('PADDLE_API_KEY not configured - Paddle integration disabled');
    } else {
      this.logger.log(
        `Paddle service initialized (${this.environment} environment)`
      );
    }
  }

  /**
   * Check if Paddle is configured and available
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.vendorId;
  }

  /**
   * Get client-side token for Paddle.js
   */
  getClientToken(): string {
    return this.clientToken;
  }

  /**
   * Get environment for frontend configuration
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * Create or retrieve a Paddle customer
   */
  async createCustomer(params: PaddleCustomerParams): Promise<{
    customerId: string;
    email: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Paddle not configured');
    }

    this.logger.log(`Creating Paddle customer: ${params.email}`);

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/customers`,
          {
            email: params.email,
            name: params.name,
            locale: params.countryCode
              ? this.getLocaleForCountry(params.countryCode)
              : 'en',
            custom_data: {
              ...params.metadata,
              source: 'dhanam',
            },
          },
          {
            headers: this.getHeaders(),
          }
        )
      );

      return {
        customerId: response.data.data.id,
        email: response.data.data.email,
      };
    } catch (error) {
      this.logger.error(`Failed to create Paddle customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a transaction (checkout) for subscription
   */
  async createTransaction(params: PaddleCheckoutParams): Promise<{
    transactionId: string;
    checkoutUrl: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Paddle not configured');
    }

    this.logger.log(`Creating Paddle transaction for: ${params.customerEmail}`);

    try {
      const transactionData: any = {
        items: [
          {
            price_id: params.priceId,
            quantity: 1,
          },
        ],
        checkout: {
          url: params.successUrl,
        },
        custom_data: {
          ...params.metadata,
          source: 'dhanam',
        },
      };

      // Add customer if we have an ID, otherwise use email
      if (params.customerId) {
        transactionData.customer_id = params.customerId;
      } else {
        transactionData.customer = {
          email: params.customerEmail,
          name: params.customerName,
        };
      }

      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/transactions`, transactionData, {
          headers: this.getHeaders(),
        })
      );

      const transaction = response.data.data;

      return {
        transactionId: transaction.id,
        checkoutUrl: transaction.checkout?.url || this.buildCheckoutUrl(transaction.id),
      };
    } catch (error) {
      this.logger.error(`Failed to create Paddle transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build checkout URL for client-side overlay
   */
  private buildCheckoutUrl(transactionId: string): string {
    const baseUrl =
      this.environment === 'live'
        ? 'https://checkout.paddle.com'
        : 'https://sandbox-checkout.paddle.com';
    return `${baseUrl}/checkout/${transactionId}`;
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<PaddleSubscription> {
    if (!this.isConfigured()) {
      throw new Error('Paddle not configured');
    }

    try {
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}/subscriptions/${subscriptionId}`, {
          headers: this.getHeaders(),
        })
      );

      const sub = response.data.data;

      return {
        id: sub.id,
        status: sub.status,
        customerId: sub.customer_id,
        priceId: sub.items?.[0]?.price?.id,
        currentPeriodEnd: new Date(sub.current_billing_period?.ends_at),
        cancelAtPeriodEnd: sub.scheduled_change?.action === 'cancel',
      };
    } catch (error) {
      this.logger.error(`Failed to get Paddle subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediate: boolean = false
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Paddle not configured');
    }

    this.logger.log(`Cancelling Paddle subscription: ${subscriptionId}`);

    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/subscriptions/${subscriptionId}/cancel`,
          {
            effective_from: immediate ? 'immediately' : 'next_billing_period',
          },
          {
            headers: this.getHeaders(),
          }
        )
      );
    } catch (error) {
      this.logger.error(
        `Failed to cancel Paddle subscription: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Paddle not configured');
    }

    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/subscriptions/${subscriptionId}/pause`,
        {},
        {
          headers: this.getHeaders(),
        }
      )
    );
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Paddle not configured');
    }

    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/subscriptions/${subscriptionId}/resume`,
        {
          effective_from: 'immediately',
        },
        {
          headers: this.getHeaders(),
        }
      )
    );
  }

  /**
   * Verify webhook signature (Paddle Billing v2)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('PADDLE_WEBHOOK_SECRET not configured');
      return false;
    }

    try {
      // Paddle uses ts;h1=signature format
      const parts = signature.split(';');
      const timestampPart = parts.find((p) => p.startsWith('ts='));
      const signaturePart = parts.find((p) => p.startsWith('h1='));

      if (!timestampPart || !signaturePart) {
        return false;
      }

      const timestamp = timestampPart.substring(3);
      const providedSignature = signaturePart.substring(3);

      // Rebuild the signed payload
      const signedPayload = `${timestamp}:${payload}`;

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      this.logger.error(`Webhook verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get API headers
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get locale for country code
   */
  private getLocaleForCountry(countryCode: string): string {
    const localeMap: Record<string, string> = {
      US: 'en',
      GB: 'en',
      DE: 'de',
      FR: 'fr',
      ES: 'es',
      IT: 'it',
      PT: 'pt',
      BR: 'pt',
      JP: 'ja',
      // Add more as needed
    };
    return localeMap[countryCode] || 'en';
  }
}
