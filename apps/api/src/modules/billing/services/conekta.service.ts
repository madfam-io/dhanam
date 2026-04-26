/**
 * =============================================================================
 * Conekta Service (LATAM card + SPEI gateway)
 * =============================================================================
 * Handles payments for the Mexican market via Conekta's REST API:
 * - Credit/Debit Cards (MX issuers, 3DS supported)
 * - SPEI bank transfer orders
 * - OXXO cash vouchers (chargeable via order line items)
 *
 * Why a direct Conekta integration alongside the Janua-routed Conekta path?
 * - The existing `JanuaBillingService` proxies subscription lifecycle through
 *   Janua's unified billing API. This service is the *direct* card+SPEI charge
 *   path used by the ecosystem invoice flow (Cotiza → Dhanam invoices) where
 *   Janua-mediated subscription semantics don't apply.
 * - Future Wave A milestones (CFDI fan-out via Karafiel, MXN refund parity
 *   with Stripe MX) need the raw Conekta event stream, not Janua's
 *   normalized envelope.
 *
 * No actual Conekta API calls are made until `CONEKTA_PRIVATE_KEY` is provided
 * in the environment (operator runbook handles the rotation).
 *
 * Conekta API reference: https://developers.conekta.com/v2.1.0/reference
 * Webhook signature reference:
 *   https://developers.conekta.com/docs/webhooks-on-conekta#webhook-signature
 *
 * Credentials (from `dhanam-secrets` K8s Secret, see operator runbook
 * `internal-devops/runbooks/2026-04-25-wave-a-stripe-conekta-provisioning.md`):
 * - CONEKTA_PRIVATE_KEY        — HTTP Basic auth username (password is empty)
 * - CONEKTA_PUBLIC_KEY         — Client-side tokenization (Conekta.js)
 * - CONEKTA_WEBHOOK_SIGNING_KEY — HMAC-SHA256 secret for webhook verification
 * - CONEKTA_API_VERSION        — Defaults to "2.1.0"
 * =============================================================================
 */

import * as crypto from 'crypto';

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { InfrastructureException } from '../../../core/exceptions/domain-exceptions';

/**
 * Subset of Conekta webhook event types we care about today.
 * Conekta emits ~40 event types; we only decode the four that drive
 * payment-status transitions in the Dhanam BillingEvent ledger.
 *
 * Full list: https://developers.conekta.com/docs/webhooks-on-conekta
 */
export type ConektaWebhookEventType =
  | 'charge.paid'
  | 'charge.declined'
  | 'charge.refunded'
  | 'order.expired'
  | string; // forward-compat: unknown types are logged + ack'd, never throw

export interface ConektaCreateChargeParams {
  /** Amount in cents/centavos. Conekta requires integer minor units. */
  amount: number;
  /** ISO-4217. Conekta natively supports 'MXN' and 'USD'. */
  currency: string;
  /** Customer info — required by Conekta even for one-shot charges. */
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  /**
   * Conekta payment source. For card: a tokenized id from Conekta.js
   * (`tok_xxx`). For SPEI: pass `{ type: 'spei' }`. For OXXO:
   * `{ type: 'oxxo_cash' }`.
   */
  paymentSource:
    | { type: 'card'; tokenId: string }
    | { type: 'spei' }
    | { type: 'oxxo_cash'; expiresAt?: number };
  /** Free-form metadata stored on the order. Surfaces in webhooks. */
  metadata?: Record<string, string>;
  /** Human description shown on receipts and in the Conekta dashboard. */
  description?: string;
}

export interface ConektaChargeResult {
  orderId: string;
  chargeId: string;
  status: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  /**
   * Present for SPEI/OXXO orders — the CLABE/reference + barcode info the
   * customer needs to complete the cash-out leg. Caller forwards to UI.
   */
  paymentInstructions?: {
    type: string;
    reference?: string;
    clabe?: string;
    bank?: string;
    barcodeUrl?: string;
    expiresAt?: number;
  };
}

export interface ConektaVerifiedEvent {
  id: string;
  type: ConektaWebhookEventType;
  livemode: boolean;
  createdAt: number;
  data: {
    object: Record<string, unknown>;
  };
}

/**
 * Conekta gateway service.
 *
 * Mirrors the shape of `PaddleService` / `StripeMxService`:
 * - `isConfigured()` for graceful "no key, no boom" startup
 * - `createCharge()` for one-shot orders
 * - `verifyWebhookSignature()` returning a strongly-typed event
 *   (or throwing for invalid signatures — caller maps to BadRequest)
 * - `handleWebhookEvent()` for downstream dispatch (idempotency
 *   handled by the controller via `BillingEvent.stripeEventId` unique
 *   constraint, same pattern as Stripe MX SPEI relay)
 */
@Injectable()
export class ConektaService {
  private readonly logger = new Logger(ConektaService.name);
  private readonly apiUrl = 'https://api.conekta.io';
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly webhookSigningKey: string;
  private readonly apiVersion: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService
  ) {
    this.privateKey = this.config.get<string>('CONEKTA_PRIVATE_KEY', '');
    this.publicKey = this.config.get<string>('CONEKTA_PUBLIC_KEY', '');
    this.webhookSigningKey = this.config.get<string>('CONEKTA_WEBHOOK_SIGNING_KEY', '');
    this.apiVersion = this.config.get<string>('CONEKTA_API_VERSION', '2.1.0');

    if (!this.privateKey) {
      this.logger.warn(
        'CONEKTA_PRIVATE_KEY not configured — Conekta gateway disabled (operator must provision via Wave A runbook)'
      );
    } else {
      this.logger.log(`Conekta service initialized (API v${this.apiVersion})`);
    }
  }

  /**
   * Conekta is "configured" when we have a private key. Webhook verification
   * additionally requires the signing key but we don't gate `isConfigured()`
   * on it because outbound charges work without it (you just can't safely
   * accept inbound events).
   */
  isConfigured(): boolean {
    return !!this.privateKey;
  }

  /** Public key for Conekta.js client-side tokenization. */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Create a Conekta order with a single line item + charge.
   *
   * Conekta's data model: an Order has line_items + charges + customer_info.
   * For our flows we always create amount-based single-charge orders (the
   * line_item is a synthetic "subscription/invoice" line — Conekta requires
   * at least one).
   *
   * Idempotency: Conekta supports an `Idempotency-Key` header. Caller is
   * responsible for supplying a stable id via metadata.idempotency_key (we
   * forward it to the header, not the order body).
   */
  async createCharge(params: ConektaCreateChargeParams): Promise<ConektaChargeResult> {
    if (!this.isConfigured()) {
      throw InfrastructureException.configurationError('CONEKTA_PRIVATE_KEY');
    }

    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw InfrastructureException.configurationError(
        'Conekta charge amount must be a positive integer (minor units)'
      );
    }

    const currency = params.currency.toUpperCase();
    if (currency !== 'MXN' && currency !== 'USD') {
      throw InfrastructureException.configurationError(
        `Conekta charge currency must be MXN or USD (got "${params.currency}")`
      );
    }

    const orderBody: Record<string, unknown> = {
      currency,
      customer_info: {
        name: params.customerInfo.name,
        email: params.customerInfo.email,
        ...(params.customerInfo.phone ? { phone: params.customerInfo.phone } : {}),
      },
      line_items: [
        {
          name: params.description ?? 'Dhanam invoice',
          unit_price: params.amount,
          quantity: 1,
        },
      ],
      charges: [this.serializeChargeSource(params.paymentSource, params.amount)],
      metadata: params.metadata ?? {},
    };

    const headers = this.buildHeaders(params.metadata?.idempotency_key);

    try {
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/orders`, orderBody, { headers })
      );
      const order = response.data;
      const charge = order.charges?.data?.[0] ?? {};

      return {
        orderId: order.id,
        chargeId: charge.id,
        status: order.payment_status ?? charge.status ?? 'unknown',
        paymentStatus: charge.status ?? 'unknown',
        amount: order.amount,
        currency: order.currency,
        paymentInstructions: this.extractInstructions(charge),
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`Conekta createCharge failed: ${message}`);
      throw InfrastructureException.externalServiceError('conekta', err as Error);
    }
  }

  /**
   * Verify a Conekta webhook signature.
   *
   * Conekta signs webhook bodies with HMAC-SHA256 using the webhook signing
   * key configured per endpoint. The signature is delivered in the
   * `digest` header as `sha256=<hex>`. Some legacy Conekta deployments use
   * the `conekta-signature` header — we accept both and prefer `digest`.
   *
   * Throws on:
   * - Missing/empty signature header
   * - Webhook signing key not configured (server misconfiguration)
   * - Signature mismatch
   * - Body parse failure (Conekta always sends JSON)
   *
   * The controller catches these and returns 400 (matching the
   * Stripe-MX/Janua/Paddle convention used elsewhere in this module —
   * see PR description for why we don't use 401).
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string): ConektaVerifiedEvent {
    if (!signatureHeader || signatureHeader.trim().length === 0) {
      throw new Error('Missing Conekta signature header');
    }

    if (!this.webhookSigningKey) {
      throw new Error('CONEKTA_WEBHOOK_SIGNING_KEY not configured');
    }

    if (!rawBody || rawBody.length === 0) {
      throw new Error('Empty webhook body');
    }

    const provided = this.parseSignatureHeader(signatureHeader);

    const expected = crypto
      .createHmac('sha256', this.webhookSigningKey)
      .update(rawBody, 'utf8')
      .digest('hex');

    // Length-check before timingSafeEqual — RangeError surfaces as a
    // confusing 500 if buffers differ in size.
    if (provided.length !== expected.length) {
      throw new Error('Conekta signature length mismatch');
    }

    const matches = crypto.timingSafeEqual(
      Buffer.from(provided, 'hex'),
      Buffer.from(expected, 'hex')
    );

    if (!matches) {
      throw new Error('Conekta signature verification failed');
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody);
    } catch (err) {
      throw new Error(`Conekta webhook body is not valid JSON: ${(err as Error).message}`, {
        cause: err,
      });
    }

    return {
      id: String(parsed.id ?? ''),
      type: String(parsed.type ?? '') as ConektaWebhookEventType,
      livemode: Boolean(parsed.livemode),
      createdAt: Number(parsed.created_at ?? 0),
      data: (parsed.data as { object: Record<string, unknown> }) ?? { object: {} },
    };
  }

  /**
   * Dispatch a verified Conekta event to its handler.
   *
   * Stays intentionally side-effect-light: this layer logs + classifies, and
   * downstream services (BillingEvent writer, Karafiel CFDI fan-out, etc.)
   * subscribe via the existing webhook-processor pipeline once the Cotiza →
   * Dhanam invoice flow is live (tracked separately).
   *
   * Returns a stable shape so the controller can persist the right
   * BillingEvent type without re-decoding the payload.
   */
  async handleWebhookEvent(event: ConektaVerifiedEvent): Promise<{
    handled: boolean;
    classification: 'paid' | 'declined' | 'refunded' | 'expired' | 'ignored';
    chargeId?: string;
    orderId?: string;
  }> {
    const obj = (event.data?.object ?? {}) as Record<string, unknown>;
    const chargeId = (obj.id as string) ?? undefined;
    const orderId = (obj.order_id as string) ?? undefined;

    switch (event.type) {
      case 'charge.paid':
        this.logger.log(`Conekta charge.paid id=${chargeId} order=${orderId}`);
        return { handled: true, classification: 'paid', chargeId, orderId };

      case 'charge.declined':
        this.logger.warn(`Conekta charge.declined id=${chargeId} order=${orderId}`);
        return { handled: true, classification: 'declined', chargeId, orderId };

      case 'charge.refunded':
        this.logger.log(`Conekta charge.refunded id=${chargeId} order=${orderId}`);
        return { handled: true, classification: 'refunded', chargeId, orderId };

      case 'order.expired':
        this.logger.log(`Conekta order.expired order=${orderId}`);
        return { handled: true, classification: 'expired', chargeId, orderId };

      default:
        this.logger.log(`Conekta event ignored (no handler): type=${event.type} id=${event.id}`);
        return { handled: false, classification: 'ignored', chargeId, orderId };
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private buildHeaders(idempotencyKey?: string): Record<string, string> {
    const basicAuth = Buffer.from(`${this.privateKey}:`).toString('base64');
    const headers: Record<string, string> = {
      Authorization: `Basic ${basicAuth}`,
      Accept: `application/vnd.conekta-v${this.apiVersion}+json`,
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return headers;
  }

  private serializeChargeSource(
    source: ConektaCreateChargeParams['paymentSource'],
    amount: number
  ): Record<string, unknown> {
    if (source.type === 'card') {
      return {
        amount,
        payment_method: {
          type: 'card',
          token_id: source.tokenId,
        },
      };
    }
    if (source.type === 'spei') {
      return {
        amount,
        payment_method: {
          type: 'spei',
        },
      };
    }
    // oxxo_cash
    return {
      amount,
      payment_method: {
        type: 'oxxo_cash',
        ...(source.expiresAt ? { expires_at: source.expiresAt } : {}),
      },
    };
  }

  private extractInstructions(
    charge: Record<string, unknown>
  ): ConektaChargeResult['paymentInstructions'] | undefined {
    const pm = charge.payment_method as Record<string, unknown> | undefined;
    if (!pm) return undefined;

    const type = String(pm.type ?? '');
    if (type !== 'spei' && type !== 'oxxo_cash' && type !== 'banorte' && type !== 'cash') {
      return undefined;
    }

    return {
      type,
      reference: pm.reference as string | undefined,
      clabe: pm.clabe as string | undefined,
      bank: pm.bank as string | undefined,
      barcodeUrl: pm.barcode_url as string | undefined,
      expiresAt: pm.expires_at as number | undefined,
    };
  }

  /**
   * Conekta sends signatures in one of these forms:
   *   - `digest: sha256=<hex>`
   *   - `conekta-signature: t=<ts>,v1=<hex>` (newer accounts)
   *   - bare hex (rare; some test fixtures)
   *
   * We accept all three. The HMAC payload is the raw body either way; the
   * `t=` timestamp prefix is informational and not part of the signed
   * material per Conekta's signing-key model (vs. Stripe's t.body model).
   */
  private parseSignatureHeader(header: string): string {
    const trimmed = header.trim();

    // Form 1: "sha256=<hex>"
    if (trimmed.toLowerCase().startsWith('sha256=')) {
      return trimmed.slice('sha256='.length);
    }

    // Form 2: "t=...,v1=<hex>"
    if (trimmed.includes('v1=')) {
      const v1Part = trimmed.split(',').find((p) => p.trim().startsWith('v1='));
      if (!v1Part) {
        throw new Error('Conekta signature header missing v1= component');
      }
      return v1Part.trim().slice('v1='.length);
    }

    // Form 3: bare hex (validated by length check + timingSafeEqual upstream)
    if (/^[a-f0-9]+$/i.test(trimmed)) {
      return trimmed.toLowerCase();
    }

    throw new Error('Conekta signature header is not in a recognized format');
  }
}
