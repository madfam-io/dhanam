import { DhanamApiError, DhanamAuthError } from './errors';
import type {
  AmbassadorProfile,
  ApplyResult,
  GenerateCodeOptions,
  ReferralCode,
  ReferralCodeInfo,
  ReferralLandingData,
  ReferralReward,
  ReferralStats,
} from './types';

/**
 * Configuration for the referral client.
 */
export interface ReferralClientConfig {
  /** Base URL of the Dhanam API (e.g. "https://api.dhan.am") */
  baseUrl: string;

  /**
   * Async function that returns a fresh JWT access token.
   * Required for authenticated endpoints (generateCode, applyCode, getStats, etc.).
   * Public endpoints (validateCode, getLandingData) work without a token.
   */
  getAccessToken: () => Promise<string>;

  /** Optional custom fetch implementation (defaults to globalThis.fetch) */
  fetch?: typeof globalThis.fetch;
}

/**
 * Typed HTTP client for the Dhanam referral API.
 *
 * Used by product frontends to manage referral codes, apply referrals,
 * and display ambassador profiles. Authenticates via JWT.
 *
 * @example
 * ```ts
 * const referrals = new DhanamReferralClient({
 *   baseUrl: 'https://api.dhan.am',
 *   getAccessToken: () => auth.getToken(),
 * });
 *
 * // Public — no auth needed
 * const info = await referrals.validateCode('FRIEND-ABC');
 *
 * // Authenticated
 * const myCode = await referrals.getMyCode('enclii');
 * const stats = await referrals.getStats();
 * ```
 */
export class DhanamReferralClient {
  private readonly baseUrl: string;
  private readonly getAccessToken: () => Promise<string>;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(config: ReferralClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.getAccessToken = config.getAccessToken;
    this._fetch = config.fetch ?? globalThis.fetch;
  }

  // ────────────────────────────────────────────
  // Public endpoints (no auth required)
  // ────────────────────────────────────────────

  /**
   * Validate a referral code and get its metadata.
   * Public endpoint — no authentication required.
   */
  async validateCode(code: string): Promise<ReferralCodeInfo> {
    return this.request<ReferralCodeInfo>(
      'GET',
      `/v1/referrals/validate/${encodeURIComponent(code)}`,
      undefined,
      false
    );
  }

  /**
   * Get landing page data for a referral code.
   * Public endpoint — no authentication required.
   */
  async getLandingData(code: string): Promise<ReferralLandingData> {
    return this.request<ReferralLandingData>(
      'GET',
      `/v1/referrals/landing/${encodeURIComponent(code)}`,
      undefined,
      false
    );
  }

  // ────────────────────────────────────────────
  // Authenticated endpoints
  // ────────────────────────────────────────────

  /**
   * Get the current user's referral code, optionally scoped to a product.
   * Creates one if none exists.
   */
  async getMyCode(product?: string): Promise<ReferralCode> {
    const params = new URLSearchParams();
    if (product) params.set('product', product);
    const query = params.toString();
    const path = `/v1/referrals/my-code${query ? `?${query}` : ''}`;
    return this.request<ReferralCode>('GET', path);
  }

  /**
   * Generate a new referral code with the given options.
   */
  async generateCode(opts: GenerateCodeOptions): Promise<ReferralCode> {
    return this.request<ReferralCode>('POST', '/v1/referrals/codes', opts);
  }

  /**
   * Apply a referral code to the current user for a target product.
   */
  async applyCode(code: string, targetProduct: string): Promise<ApplyResult> {
    return this.request<ApplyResult>('POST', '/v1/referrals/apply', {
      code,
      targetProduct,
    });
  }

  /**
   * Get referral statistics for the current user.
   */
  async getStats(): Promise<ReferralStats> {
    return this.request<ReferralStats>('GET', '/v1/referrals/stats');
  }

  /**
   * Get all rewards earned by the current user through referrals.
   */
  async getRewards(): Promise<ReferralReward[]> {
    return this.request<ReferralReward[]>('GET', '/v1/referrals/rewards');
  }

  /**
   * Get the current user's ambassador profile.
   */
  async getAmbassadorProfile(): Promise<AmbassadorProfile> {
    return this.request<AmbassadorProfile>('GET', '/v1/referrals/ambassador');
  }

  // ────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    authenticated = true
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authenticated) {
      const token = await this.getAccessToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await this._fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let parsed: unknown;
      try {
        parsed = await res.json();
      } catch {
        parsed = await res.text().catch(() => undefined);
      }

      if (res.status === 401) {
        throw new DhanamAuthError(`Authentication failed: ${res.statusText}`, parsed);
      }

      throw new DhanamApiError(
        `Dhanam referral API error: ${res.status} ${res.statusText}`,
        res.status,
        parsed
      );
    }

    return (await res.json()) as T;
  }
}
