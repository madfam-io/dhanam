import { createHmac, timingSafeEqual } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * =============================================================================
 * MetaMap Identity Verification Provider
 * =============================================================================
 * Client for the MetaMap (formerly Mati) API used for CNBV-compliant KYC/AML
 * identity verification in Mexico.
 *
 * Handles:
 * - Verification flow creation
 * - Verification result retrieval
 * - Webhook signature verification (HMAC-SHA256)
 *
 * Required env vars:
 * - METAMAP_CLIENT_ID
 * - METAMAP_CLIENT_SECRET
 * - METAMAP_WEBHOOK_SECRET
 * - METAMAP_FLOW_ID (the configured verification flow template ID)
 * - METAMAP_API_URL (defaults to https://api.getmati.com)
 * =============================================================================
 */

interface MetaMapAccessToken {
  accessToken: string;
  expiresAt: number;
}

export interface MetaMapFlowResult {
  flowId: string;
  verificationUrl: string;
}

export interface MetaMapVerificationResult {
  flowId: string;
  status: string;
  pepMatch: boolean;
  sanctionsMatch: boolean;
  curpValidated: boolean;
  ineValidated: boolean;
  details: Record<string, unknown>;
}

@Injectable()
export class MetaMapProvider {
  private readonly logger = new Logger(MetaMapProvider.name);
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly webhookSecret: string;
  private readonly flowTemplateId: string;
  private cachedToken: MetaMapAccessToken | null = null;

  constructor(private config: ConfigService) {
    this.apiUrl = this.config.get<string>('METAMAP_API_URL') || 'https://api.getmati.com';
    this.clientId = this.config.get<string>('METAMAP_CLIENT_ID') || '';
    this.clientSecret = this.config.get<string>('METAMAP_CLIENT_SECRET') || '';
    this.webhookSecret = this.config.get<string>('METAMAP_WEBHOOK_SECRET') || '';
    this.flowTemplateId = this.config.get<string>('METAMAP_FLOW_ID') || '';
  }

  /**
   * Obtain a short-lived access token from MetaMap using client credentials.
   * Tokens are cached until expiry.
   */
  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.accessToken;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.apiUrl}/oauth`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`MetaMap auth failed: ${response.status} — ${body}`);
      throw new Error(`MetaMap authentication failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };

    this.cachedToken = {
      accessToken: data.access_token,
      // Expire 60 seconds early to avoid edge-case clock drift
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return this.cachedToken.accessToken;
  }

  /**
   * Create a new identity verification flow for a user.
   *
   * @param userId    Internal Dhanam user ID (stored as metadata for webhook correlation)
   * @param redirectUrl  Where MetaMap redirects the user after completing the flow
   * @returns         The MetaMap flow ID and the URL to send the user to
   */
  async createVerificationFlow(userId: string, redirectUrl: string): Promise<MetaMapFlowResult> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}/v2/verifications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flowId: this.flowTemplateId,
        metadata: { userId },
        redirectUrl,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`MetaMap create flow failed: ${response.status} — ${body}`);
      throw new Error(`MetaMap verification flow creation failed: ${response.status}`);
    }

    const data = (await response.json()) as { identity: string; url: string };

    this.logger.log(`MetaMap flow created for user ${userId}: ${data.identity}`);

    return {
      flowId: data.identity,
      verificationUrl: data.url,
    };
  }

  /**
   * Retrieve the full verification result for a completed flow.
   *
   * @param flowId  The MetaMap flow run ID
   * @returns       Parsed verification result with PEP, sanctions, CURP, and INE flags
   */
  async getVerificationResult(flowId: string): Promise<MetaMapVerificationResult> {
    // MetaMap flow IDs are MongoDB ObjectIds (24 hex chars). Reject anything
    // else so a poisoned flowId can't pivot the request to a different host
    // or path (request-forgery).
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(flowId)) {
      throw new Error('Invalid MetaMap flow ID');
    }

    const token = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}/v2/verifications/${encodeURIComponent(flowId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`MetaMap get result failed: ${response.status} — ${body}`);
      throw new Error(`MetaMap verification result retrieval failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      identity: string;
      status: string;
      steps: Array<{
        id: string;
        status: number;
        data?: Record<string, unknown>;
      }>;
      [key: string]: unknown;
    };

    // Parse the MetaMap steps to extract CNBV-relevant verification flags
    const pepStep = data.steps?.find((s) => s.id === 'pep-check');
    const sanctionsStep = data.steps?.find((s) => s.id === 'sanctions-check');
    const curpStep = data.steps?.find((s) => s.id === 'curp-validation');
    const ineStep = data.steps?.find((s) => s.id === 'document-reading');

    return {
      flowId: data.identity,
      status: data.status,
      pepMatch: pepStep?.status === 200 && (pepStep?.data?.match as boolean) === true,
      sanctionsMatch:
        sanctionsStep?.status === 200 && (sanctionsStep?.data?.match as boolean) === true,
      curpValidated: curpStep?.status === 200,
      ineValidated: ineStep?.status === 200,
      details: data as unknown as Record<string, unknown>,
    };
  }

  /**
   * Verify the HMAC-SHA256 signature of a MetaMap webhook payload.
   * Uses constant-time comparison to prevent timing attacks.
   *
   * @param payload   Raw request body (string or Buffer)
   * @param signature The `x-signature` header value from MetaMap
   * @returns         true if the signature is valid
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.error('METAMAP_WEBHOOK_SECRET is not configured — rejecting webhook');
      return false;
    }

    if (!signature) {
      return false;
    }

    try {
      const expected = createHmac('sha256', this.webhookSecret)
        .update(typeof payload === 'string' ? payload : payload.toString('utf-8'))
        .digest('hex');

      const expectedBuf = Buffer.from(expected, 'hex');
      const signatureBuf = Buffer.from(signature, 'hex');

      if (expectedBuf.length !== signatureBuf.length) {
        return false;
      }

      return timingSafeEqual(expectedBuf, signatureBuf);
    } catch (error) {
      this.logger.error(`Webhook signature verification error: ${(error as Error).message}`);
      return false;
    }
  }
}
