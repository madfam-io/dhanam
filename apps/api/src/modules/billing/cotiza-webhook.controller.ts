import * as crypto from 'crypto';

import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuditService } from '../../core/audit/audit.service';
import { PostHogService } from '../analytics/posthog.service';

/**
 * Cotiza webhook event types forwarded by the DhanamRelayService
 * in digifab-quoting.
 */
export enum CotizaWebhookEventType {
  // Payment lifecycle
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Subscription lifecycle
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',

  // Quote-specific
  QUOTE_PAID = 'quote.paid',
  INVOICE_PAID = 'invoice.paid',
}

/**
 * Shape of the webhook payload sent by Cotiza's DhanamRelayService.
 * Matches the JSON structure produced by DhanamRelayService.relay().
 */
export interface CotizaWebhookPayload {
  id: string;
  type: CotizaWebhookEventType;
  timestamp: string;
  source_app: 'cotiza';
  data: {
    tenant_id?: string;
    quote_id?: string;
    invoice_id?: string;
    amount?: number;
    currency?: string;
    provider?: string;
    customer_id?: string;
    subscription_id?: string;
    plan_id?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * =============================================================================
 * Cotiza Webhook Controller
 * =============================================================================
 * Receives billing events relayed from Cotiza (digifab-quoting) and records
 * them in Dhanam's ledger for a unified financial view across the MADFAM
 * ecosystem.
 *
 * ## Security
 * - HMAC-SHA256 signature verification using COTIZA_WEBHOOK_SECRET
 * - Timing-safe comparison to prevent timing attacks
 * - No JWT required (service-to-service, signature-authenticated)
 *
 * ## Endpoint
 * POST /api/v1/webhooks/cotiza
 *
 * ## Headers
 * - `x-cotiza-signature`: HMAC-SHA256 hex digest of the raw request body
 *
 * ## Idempotency
 * - Each webhook carries a unique `id` field
 * - Recent webhook IDs are tracked in-memory to skip duplicates
 * - The AuditLog provides a persistent record of all processed events
 * =============================================================================
 */
@ApiTags('Webhooks')
@Controller('webhooks/cotiza')
export class CotizaWebhookController {
  private readonly logger = new Logger(CotizaWebhookController.name);
  private readonly webhookSecret: string;

  /**
   * In-memory deduplication set for recently processed webhook IDs.
   * Bounded to MAX_DEDUP_SIZE to prevent unbounded memory growth.
   * The AuditLog provides the persistent record.
   */
  private readonly processedIds = new Set<string>();
  private static readonly MAX_DEDUP_SIZE = 10_000;

  constructor(
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly posthog: PostHogService
  ) {
    this.webhookSecret = this.config.get<string>('COTIZA_WEBHOOK_SECRET', '');

    if (!this.webhookSecret) {
      this.logger.warn(
        'COTIZA_WEBHOOK_SECRET not configured -- Cotiza webhook endpoint will reject all requests'
      );
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive billing events from Cotiza (digifab-quoting)',
    description:
      'Webhook endpoint for cross-product billing relay. ' +
      'Authenticated via HMAC-SHA256 signature in x-cotiza-signature header.',
  })
  @ApiOkResponse({ description: 'Webhook processed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid payload structure' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing webhook signature' })
  async handleCotizaWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-cotiza-signature') signature: string,
    @Body() payload: CotizaWebhookPayload
  ): Promise<{ received: boolean; event?: string; error?: string }> {
    // ---------------------------------------------------------------
    // 1. Verify HMAC signature
    // ---------------------------------------------------------------
    const rawBody = req.rawBody?.toString() || JSON.stringify(payload);

    if (!this.verifySignature(rawBody, signature)) {
      this.logger.error('Cotiza webhook signature verification failed');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Received Cotiza webhook: ${payload.type} (id=${payload.id})`);

    // ---------------------------------------------------------------
    // 2. Idempotency check (in-memory, bounded)
    // ---------------------------------------------------------------
    if (this.processedIds.has(payload.id)) {
      this.logger.warn(`Duplicate Cotiza webhook skipped: ${payload.id}`);
      return { received: true, event: payload.type };
    }

    // Evict oldest entries when the set exceeds the size limit
    if (this.processedIds.size >= CotizaWebhookController.MAX_DEDUP_SIZE) {
      const first = this.processedIds.values().next().value;
      if (first !== undefined) {
        this.processedIds.delete(first);
      }
    }
    this.processedIds.add(payload.id);

    // ---------------------------------------------------------------
    // 3. Process event by type
    // ---------------------------------------------------------------
    try {
      switch (payload.type) {
        case CotizaWebhookEventType.PAYMENT_SUCCEEDED:
          await this.handlePaymentSucceeded(payload);
          break;

        case CotizaWebhookEventType.PAYMENT_FAILED:
          await this.handlePaymentFailed(payload);
          break;

        case CotizaWebhookEventType.PAYMENT_REFUNDED:
          await this.handlePaymentRefunded(payload);
          break;

        case CotizaWebhookEventType.QUOTE_PAID:
          await this.handleQuotePaid(payload);
          break;

        case CotizaWebhookEventType.INVOICE_PAID:
          await this.handleInvoicePaid(payload);
          break;

        case CotizaWebhookEventType.SUBSCRIPTION_CREATED:
        case CotizaWebhookEventType.SUBSCRIPTION_UPDATED:
        case CotizaWebhookEventType.SUBSCRIPTION_CANCELLED:
          await this.handleSubscriptionEvent(payload);
          break;

        default:
          this.logger.log(`Unhandled Cotiza event type: ${payload.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing Cotiza webhook ${payload.type}: ${error.message}`,
        error.stack
      );
      return { received: false, error: error.message };
    }

    return { received: true, event: payload.type };
  }

  // ===================================================================
  // Signature verification
  // ===================================================================

  /**
   * Verify HMAC-SHA256 signature using timing-safe comparison.
   */
  private verifySignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret || !signature) {
      return false;
    }

    const expected = crypto.createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');

    // Guard against length mismatch before timingSafeEqual
    if (signature.length !== expected.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature, 'utf-8'), Buffer.from(expected, 'utf-8'));
  }

  // ===================================================================
  // Event handlers
  // ===================================================================

  /**
   * Record a successful Cotiza payment as an ecosystem transaction
   * in the user's Dhanam ledger (if linked).
   */
  private async handlePaymentSucceeded(payload: CotizaWebhookPayload): Promise<void> {
    const { tenant_id, amount, currency, provider, quote_id } = payload.data;

    this.logger.log(
      `Cotiza payment succeeded: tenant=${tenant_id} amount=${currency} ${amount} provider=${provider}`
    );

    if (tenant_id) {
      await this.posthog.capture({
        distinctId: tenant_id,
        event: 'cotiza_payment_succeeded',
        properties: {
          product: 'cotiza',
          amount,
          currency,
          provider,
          quote_id,
        },
      });
    }

    await this.audit.log({
      action: 'cotiza.payment.succeeded',
      resource: 'billing',
      resourceId: payload.id,
      metadata: {
        tenantId: tenant_id,
        quoteId: quote_id,
        amount,
        currency,
        provider,
      },
    });
  }

  /**
   * Record a failed Cotiza payment for visibility in the admin panel.
   */
  private async handlePaymentFailed(payload: CotizaWebhookPayload): Promise<void> {
    const { tenant_id, amount, currency, provider } = payload.data;

    this.logger.warn(
      `Cotiza payment failed: tenant=${tenant_id} amount=${currency} ${amount} provider=${provider}`
    );

    await this.audit.log({
      action: 'cotiza.payment.failed',
      resource: 'billing',
      resourceId: payload.id,
      metadata: {
        tenantId: tenant_id,
        amount,
        currency,
        provider,
      },
    });
  }

  /**
   * Record a refunded Cotiza payment.
   */
  private async handlePaymentRefunded(payload: CotizaWebhookPayload): Promise<void> {
    const { tenant_id, amount, currency } = payload.data;

    this.logger.log(`Cotiza payment refunded: tenant=${tenant_id} amount=${currency} ${amount}`);

    await this.audit.log({
      action: 'cotiza.payment.refunded',
      resource: 'billing',
      resourceId: payload.id,
      metadata: {
        tenantId: tenant_id,
        amount,
        currency,
      },
    });
  }

  /**
   * Handle a quote-specific payment confirmation from Cotiza.
   */
  private async handleQuotePaid(payload: CotizaWebhookPayload): Promise<void> {
    const { tenant_id, quote_id, amount, currency } = payload.data;

    this.logger.log(
      `Cotiza quote paid: tenant=${tenant_id} quote=${quote_id} amount=${currency} ${amount}`
    );

    await this.audit.log({
      action: 'cotiza.quote.paid',
      resource: 'billing',
      resourceId: quote_id || payload.id,
      metadata: {
        tenantId: tenant_id,
        quoteId: quote_id,
        amount,
        currency,
      },
    });
  }

  /**
   * Handle an invoice payment confirmation from Cotiza.
   */
  private async handleInvoicePaid(payload: CotizaWebhookPayload): Promise<void> {
    const { tenant_id, invoice_id, amount, currency } = payload.data;

    this.logger.log(
      `Cotiza invoice paid: tenant=${tenant_id} invoice=${invoice_id} amount=${currency} ${amount}`
    );

    await this.audit.log({
      action: 'cotiza.invoice.paid',
      resource: 'billing',
      resourceId: invoice_id || payload.id,
      metadata: {
        tenantId: tenant_id,
        invoiceId: invoice_id,
        amount,
        currency,
      },
    });
  }

  /**
   * Handle Cotiza subscription lifecycle events.
   */
  private async handleSubscriptionEvent(payload: CotizaWebhookPayload): Promise<void> {
    const { tenant_id, subscription_id, plan_id, status } = payload.data;

    this.logger.log(
      `Cotiza subscription event: type=${payload.type} tenant=${tenant_id} sub=${subscription_id} plan=${plan_id} status=${status}`
    );

    if (tenant_id) {
      await this.posthog.capture({
        distinctId: tenant_id,
        event: `cotiza_${payload.type.replace('.', '_')}`,
        properties: {
          product: 'cotiza',
          subscription_id,
          plan_id,
          status,
        },
      });
    }

    await this.audit.log({
      action: `cotiza.${payload.type}`,
      resource: 'billing',
      resourceId: subscription_id || payload.id,
      metadata: {
        tenantId: tenant_id,
        subscriptionId: subscription_id,
        planId: plan_id,
        status,
      },
    });
  }
}
