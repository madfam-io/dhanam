import * as crypto from 'crypto';

import { DhanamApiError, DhanamAuthError } from './errors';
import type { CreditBalance, CreditUsageResult, UsageBreakdown } from './types';

/**
 * Configuration for the usage reporting client.
 *
 * Unlike DhanamClient (which uses JWT for user-facing endpoints),
 * this client authenticates via HMAC signatures for service-to-service
 * communication.
 */
export interface UsageClientConfig {
  /** Base URL of the Dhanam API (e.g. "https://api.dhan.am") */
  baseUrl: string;

  /** Shared secret for HMAC-SHA256 signing (BILLING_WEBHOOK_SECRET) */
  signingSecret: string;

  /**
   * Optional JWT token or async resolver for balance/usage query endpoints.
   * Required only if calling getBalance() or getUsage() from a service context.
   */
  token?: string | (() => string | Promise<string>);

  /** Optional custom fetch implementation (defaults to globalThis.fetch) */
  fetch?: typeof globalThis.fetch;
}

/**
 * Client for credit-based usage metering in the MADFAM ecosystem.
 *
 * Used by services (Karafiel, Selva, Fortuna, etc.) to report credit
 * consumption to Dhanam's billing system.
 *
 * @example
 * ```ts
 * const usage = new DhanamUsageClient({
 *   baseUrl: 'https://api.dhan.am',
 *   signingSecret: process.env.BILLING_WEBHOOK_SECRET!,
 * });
 *
 * const result = await usage.reportUsage(
 *   'org-123',
 *   'karafiel',
 *   'cfdi_stamp',
 *   1,
 *   `cfdi-stamp-${invoiceId}`
 * );
 *
 * if (result.creditsRemaining <= 0) {
 *   console.warn('Credits exhausted — overage billing active');
 * }
 * ```
 */
export class DhanamUsageClient {
  private readonly baseUrl: string;
  private readonly signingSecret: string;
  private readonly tokenOrFn: string | (() => string | Promise<string>) | undefined;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(config: UsageClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.signingSecret = config.signingSecret;
    this.tokenOrFn = config.token;
    this._fetch = config.fetch ?? globalThis.fetch;
  }

  /**
   * Report credit usage for an org.
   *
   * Sends an HMAC-signed POST request to the Dhanam usage endpoint.
   * The idempotency key ensures duplicate calls are safely ignored.
   *
   * @param orgId - Organization consuming the credits
   * @param service - Reporting service name (e.g. "karafiel")
   * @param operation - Operation type (e.g. "cfdi_stamp")
   * @param credits - Number of credits consumed
   * @param idempotencyKey - Unique key for deduplication
   */
  async reportUsage(
    orgId: string,
    service: string,
    operation: string,
    credits: number,
    idempotencyKey: string
  ): Promise<CreditUsageResult> {
    const body = JSON.stringify({
      orgId,
      service,
      operation,
      credits,
      idempotencyKey,
    });

    const signature = crypto.createHmac('sha256', this.signingSecret).update(body).digest('hex');

    const res = await this._fetch(`${this.baseUrl}/v1/billing/credits/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Billing-Signature': signature,
      },
      body,
    });

    if (!res.ok) {
      let parsed: unknown;
      try {
        parsed = await res.json();
      } catch {
        parsed = await res.text().catch(() => undefined);
      }

      if (res.status === 401) {
        throw new DhanamAuthError('HMAC signature verification failed', parsed);
      }

      throw new DhanamApiError(
        `Dhanam usage API error: ${res.status} ${res.statusText}`,
        res.status,
        parsed
      );
    }

    return (await res.json()) as CreditUsageResult;
  }

  /**
   * Check the credit balance for an org.
   *
   * Requires JWT authentication (set via the `token` config option).
   */
  async checkBalance(_orgId: string): Promise<CreditBalance> {
    const token = await this.resolveToken();

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await this._fetch(`${this.baseUrl}/v1/billing/credits/balance`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      let parsed: unknown;
      try {
        parsed = await res.json();
      } catch {
        parsed = await res.text().catch(() => undefined);
      }

      if (res.status === 401) {
        throw new DhanamAuthError('Authentication failed', parsed);
      }

      throw new DhanamApiError(
        `Dhanam balance API error: ${res.status} ${res.statusText}`,
        res.status,
        parsed
      );
    }

    return (await res.json()) as CreditBalance;
  }

  /**
   * Get usage breakdown for an org.
   *
   * Requires JWT authentication (set via the `token` config option).
   */
  async getUsage(
    _orgId: string,
    options?: { start?: string; end?: string; service?: string }
  ): Promise<UsageBreakdown> {
    const token = await this.resolveToken();

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (options?.start) params.set('start', options.start);
    if (options?.end) params.set('end', options.end);
    if (options?.service) params.set('service', options.service);

    const query = params.toString();
    const url = `${this.baseUrl}/v1/billing/credits/usage${query ? `?${query}` : ''}`;

    const res = await this._fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      let parsed: unknown;
      try {
        parsed = await res.json();
      } catch {
        parsed = await res.text().catch(() => undefined);
      }

      if (res.status === 401) {
        throw new DhanamAuthError('Authentication failed', parsed);
      }

      throw new DhanamApiError(
        `Dhanam usage API error: ${res.status} ${res.statusText}`,
        res.status,
        parsed
      );
    }

    return (await res.json()) as UsageBreakdown;
  }

  private async resolveToken(): Promise<string | undefined> {
    if (typeof this.tokenOrFn === 'function') {
      return this.tokenOrFn();
    }
    return this.tokenOrFn;
  }
}
