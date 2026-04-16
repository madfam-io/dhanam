import crypto from 'crypto';

import { DhanamReferralClient } from '../referral';
import { DhanamReferralReporter } from '../referral-reporter';
import { DhanamApiError, DhanamAuthError } from '../errors';
import type { ReferralCodeInfo } from '../types';

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function mockFetch(status: number, body: unknown): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

// ────────────────────────────────────────────────
// DhanamReferralClient
// ────────────────────────────────────────────────

describe('DhanamReferralClient', () => {
  const baseUrl = 'https://api.dhan.am';
  const getAccessToken = jest.fn().mockResolvedValue('tok_referral');

  describe('validateCode', () => {
    it('sends GET without auth header', async () => {
      const responseBody: ReferralCodeInfo = {
        code: 'KRF-ABCD1234',
        isActive: true,
        sourceProduct: 'karafiel',
        targetProduct: null,
        referrerDisplayName: 'Alice',
      };
      const fetch = mockFetch(200, responseBody);
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      const result = await client.validateCode('KRF-ABCD1234');

      expect(fetch).toHaveBeenCalledWith('https://api.dhan.am/v1/referrals/validate/KRF-ABCD1234', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      });
      // Should NOT include Authorization header for public endpoint
      expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
      expect(getAccessToken).not.toHaveBeenCalled();
      expect(result).toEqual(responseBody);
    });

    it('returns parsed response for valid code', async () => {
      const responseBody: ReferralCodeInfo = {
        code: 'KRF-VALID001',
        isActive: true,
        sourceProduct: 'karafiel',
        targetProduct: null,
        referrerDisplayName: 'Referrer',
      };
      const fetch = mockFetch(200, responseBody);
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      const result = await client.validateCode('KRF-VALID001');

      expect(result.code).toBe('KRF-VALID001');
      expect(result.isActive).toBe(true);
      expect(result.sourceProduct).toBe('karafiel');
    });

    it('returns parsed response for inactive code', async () => {
      const responseBody: ReferralCodeInfo = {
        code: 'EXPIRED01',
        isActive: false,
        sourceProduct: 'dhanam',
        targetProduct: null,
        referrerDisplayName: null,
      };
      const fetch = mockFetch(200, responseBody);
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      const result = await client.validateCode('EXPIRED01');

      expect(result.isActive).toBe(false);
    });

    it('URL-encodes the code parameter', async () => {
      const fetch = mockFetch(200, { valid: false });
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      await client.validateCode('KRF-A+B/C');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('KRF-A%2BB%2FC'),
        expect.anything()
      );
    });
  });

  describe('applyCode', () => {
    it('sends POST with JWT Authorization header', async () => {
      const responseBody = { referralId: 'ref-001' };
      const fetch = mockFetch(200, responseBody);
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      const result = await client.applyCode('KRF-ABCD1234', 'karafiel');

      expect(getAccessToken).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith('https://api.dhan.am/v1/referrals/apply', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer tok_referral',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: 'KRF-ABCD1234', targetProduct: 'karafiel' }),
      });
      expect(result).toEqual(responseBody);
    });

    it('throws DhanamApiError on 400 (bad request)', async () => {
      const fetch = mockFetch(400, { message: 'Cannot use your own referral code' });
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      await expect(client.applyCode('KRF-SELF0001', 'karafiel')).rejects.toThrow(DhanamApiError);
      try {
        await client.applyCode('KRF-SELF0001', 'karafiel');
      } catch (err) {
        expect((err as DhanamApiError).status).toBe(400);
      }
    });

    it('throws DhanamApiError on 404 (code not found)', async () => {
      const fetch = mockFetch(404, { message: 'Referral code not found' });
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      await expect(client.applyCode('NONEXISTENT', 'karafiel')).rejects.toThrow(DhanamApiError);
      try {
        await client.applyCode('NONEXISTENT', 'karafiel');
      } catch (err) {
        expect((err as DhanamApiError).status).toBe(404);
      }
    });

    it('throws DhanamAuthError on 401', async () => {
      const fetch = mockFetch(401, { message: 'Unauthorized' });
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      await expect(client.applyCode('KRF-ABCD1234', 'karafiel')).rejects.toThrow(DhanamAuthError);
    });
  });

  describe('getMyCode', () => {
    it('sends GET with product query param', async () => {
      const fetch = mockFetch(200, { code: 'KRF-NEW00001', isNew: true });
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      await client.getMyCode('karafiel');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.dhan.am/v1/referrals/my-code?product=karafiel',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer tok_referral' }),
        })
      );
    });

    it('sends GET without product query param when not specified', async () => {
      const fetch = mockFetch(200, { code: 'MADFAM-GENERIC', isNew: false });
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      await client.getMyCode();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.dhan.am/v1/referrals/my-code',
        expect.anything()
      );
    });
  });

  describe('getStats', () => {
    it('sends authenticated GET to /v1/referrals/stats', async () => {
      const statsBody = {
        totalCodes: 2,
        totalReferrals: 10,
        pendingReferrals: 3,
        convertedReferrals: 5,
        rewardedReferrals: 2,
        conversionRate: 0.7,
      };
      const fetch = mockFetch(200, statsBody);
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      const result = await client.getStats();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.dhan.am/v1/referrals/stats',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer tok_referral' }),
        })
      );
      expect(result).toEqual(statsBody);
    });
  });

  describe('trailing slash handling', () => {
    it('strips trailing slashes from baseUrl', async () => {
      const fetch = mockFetch(200, { valid: true });
      const client = new DhanamReferralClient({
        baseUrl: 'https://api.dhan.am///',
        getAccessToken,
        fetch,
      });

      await client.validateCode('TEST');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.dhan.am/v1/'),
        expect.anything()
      );
    });
  });
});

// ────────────────────────────────────────────────
// DhanamReferralReporter
// ────────────────────────────────────────────────

describe('DhanamReferralReporter', () => {
  const baseUrl = 'https://api.dhan.am';
  const hmacSecret = 'whsec_referral_test';
  const sourceProduct = 'karafiel';

  describe('reportEvent', () => {
    it('signs body with HMAC-SHA256 and sends X-Billing-Signature header', async () => {
      const fetch = mockFetch(200, { received: true });
      const reporter = new DhanamReferralReporter({
        baseUrl,
        hmacSecret,
        sourceProduct,
        fetch,
      });

      await reporter.reportEvent({
        type: 'signup',
        code: 'KRF-ABCD1234',
        email: 'new-user@example.com',
      });

      expect(fetch).toHaveBeenCalledTimes(1);

      const [url, opts] = fetch.mock.calls[0];
      expect(url).toBe('https://api.dhan.am/v1/referrals/events');
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(opts.headers['X-Billing-Signature']).toBeDefined();

      // Verify the HMAC signature matches
      const body = opts.body;
      const expectedSig = crypto.createHmac('sha256', hmacSecret).update(body).digest('hex');
      expect(opts.headers['X-Billing-Signature']).toBe(expectedSig);
    });

    it('includes sourceProduct and timestamp in the payload', async () => {
      const fetch = mockFetch(200, { received: true });
      const reporter = new DhanamReferralReporter({
        baseUrl,
        hmacSecret,
        sourceProduct,
        fetch,
      });

      await reporter.reportEvent({
        type: 'converted',
        code: 'KRF-CONV0001',
        email: 'converted@example.com',
        userId: 'user-conv-1',
      });

      const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(sentBody.sourceProduct).toBe('karafiel');
      expect(sentBody.timestamp).toBeDefined();
      expect(sentBody.type).toBe('converted');
      expect(sentBody.code).toBe('KRF-CONV0001');
      expect(sentBody.email).toBe('converted@example.com');
      expect(sentBody.userId).toBe('user-conv-1');
    });

    it('throws DhanamAuthError on 401 (HMAC verification failure)', async () => {
      const fetch = mockFetch(401, { error: 'Invalid signature' });
      const reporter = new DhanamReferralReporter({
        baseUrl,
        hmacSecret,
        sourceProduct,
        fetch,
      });

      await expect(reporter.reportEvent({ type: 'signup', code: 'KRF-BAD00001' })).rejects.toThrow(
        DhanamAuthError
      );
    });

    it('throws DhanamApiError on 500 server error', async () => {
      const fetch = mockFetch(500, { error: 'Internal server error' });
      const reporter = new DhanamReferralReporter({
        baseUrl,
        hmacSecret,
        sourceProduct,
        fetch,
      });

      await expect(reporter.reportEvent({ type: 'click', code: 'KRF-ERR00001' })).rejects.toThrow(
        DhanamApiError
      );
    });

    it('strips trailing slashes from baseUrl', async () => {
      const fetch = mockFetch(200, { received: true });
      const reporter = new DhanamReferralReporter({
        baseUrl: 'https://api.dhan.am///',
        hmacSecret,
        sourceProduct,
        fetch,
      });

      await reporter.reportEvent({ type: 'click', code: 'KRF-TRAIL001' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.dhan.am/v1/referrals/events',
        expect.anything()
      );
    });
  });
});
