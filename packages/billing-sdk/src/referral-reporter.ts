import * as crypto from 'crypto';

import { DhanamApiError, DhanamAuthError } from './errors';
import type { ReferralEvent } from './types';

/**
 * Configuration for the referral event reporter.
 *
 * Unlike DhanamReferralClient (which uses JWT for user-facing endpoints),
 * this client authenticates via HMAC signatures for service-to-service
 * communication — same pattern as DhanamUsageClient.
 */
export interface ReferralReporterConfig {
  /** Base URL of the Dhanam API (e.g. "https://api.dhan.am") */
  baseUrl: string;

  /** Shared secret for HMAC-SHA256 signing (BILLING_WEBHOOK_SECRET) */
  hmacSecret: string;

  /** Product identifier for the reporting service (e.g. "enclii", "tezca") */
  sourceProduct: string;

  /** Optional custom fetch implementation (defaults to globalThis.fetch) */
  fetch?: typeof globalThis.fetch;
}

/**
 * HMAC-signed client for reporting referral funnel events from ecosystem services.
 *
 * Used by product backends (Enclii, Tezca, Karafiel, etc.) to report
 * referral-driven events (clicks, signups, trial starts, conversions)
 * back to Dhanam's referral tracking system.
 *
 * @example
 * ```ts
 * const reporter = new DhanamReferralReporter({
 *   baseUrl: 'https://api.dhan.am',
 *   hmacSecret: process.env.BILLING_WEBHOOK_SECRET!,
 *   sourceProduct: 'enclii',
 * });
 *
 * await reporter.reportEvent({
 *   type: 'signup',
 *   code: 'FRIEND-ABC',
 *   email: 'new-user@example.com',
 *   utmSource: 'twitter',
 *   utmMedium: 'social',
 * });
 * ```
 */
export class DhanamReferralReporter {
  private readonly baseUrl: string;
  private readonly hmacSecret: string;
  private readonly sourceProduct: string;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(config: ReferralReporterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.hmacSecret = config.hmacSecret;
    this.sourceProduct = config.sourceProduct;
    this._fetch = config.fetch ?? globalThis.fetch;
  }

  /**
   * Report a referral funnel event.
   *
   * Sends an HMAC-signed POST request to the Dhanam referral event endpoint.
   * The source product is automatically injected from the client configuration.
   *
   * @param event - The referral event to report
   */
  async reportEvent(event: ReferralEvent): Promise<void> {
    const payload = {
      ...event,
      sourceProduct: this.sourceProduct,
      timestamp: new Date().toISOString(),
    };

    const body = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', this.hmacSecret).update(body).digest('hex');

    const res = await this._fetch(`${this.baseUrl}/v1/referrals/events`, {
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
        `Dhanam referral event API error: ${res.status} ${res.statusText}`,
        res.status,
        parsed
      );
    }
  }
}
