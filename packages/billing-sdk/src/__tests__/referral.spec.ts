import { DhanamReferralClient } from '../referral';
import { DhanamApiError, DhanamAuthError } from '../errors';

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function mockFetch(status: number, body: unknown): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

// ────────────────────────────────────────────────
// DhanamReferralClient (rewards-only after refactor)
// ────────────────────────────────────────────────

describe('DhanamReferralClient', () => {
  const baseUrl = 'https://api.dhan.am';
  const getAccessToken = jest.fn().mockResolvedValue('tok_referral');

  describe('getRewards', () => {
    it('sends authenticated GET to /v1/referral/rewards', async () => {
      const rewardsBody = [
        {
          id: 'rw-001',
          rewardType: 'subscription_extension',
          amount: 1,
          description: '1 free month for referral',
          applied: true,
          appliedAt: '2026-04-15T00:00:00Z',
          createdAt: '2026-04-15T00:00:00Z',
        },
      ];
      const fetch = mockFetch(200, rewardsBody);
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      const result = await client.getRewards();

      expect(getAccessToken).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        'https://api.dhan.am/v1/referral/rewards',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer tok_referral' }),
        })
      );
      expect(result).toEqual(rewardsBody);
    });

    it('throws DhanamAuthError on 401', async () => {
      const fetch = mockFetch(401, { message: 'Unauthorized' });
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      await expect(client.getRewards()).rejects.toThrow(DhanamAuthError);
    });
  });

  describe('getAmbassadorProfile', () => {
    it('sends authenticated GET to /v1/referral/ambassador', async () => {
      const profileBody = {
        tier: 'silver',
        totalReferrals: 8,
        totalConversions: 5,
        lifetimeCreditsEarned: 250,
        lifetimeMonthsEarned: 5,
        discountPercent: 10,
        publicProfile: false,
        displayName: null,
      };
      const fetch = mockFetch(200, profileBody);
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      const result = await client.getAmbassadorProfile();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.dhan.am/v1/referral/ambassador',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer tok_referral' }),
        })
      );
      expect(result).toEqual(profileBody);
      expect(result.tier).toBe('silver');
      expect(result.discountPercent).toBe(10);
    });

    it('throws DhanamApiError on 500', async () => {
      const fetch = mockFetch(500, { message: 'Internal error' });
      const client = new DhanamReferralClient({ baseUrl, getAccessToken, fetch });

      await expect(client.getAmbassadorProfile()).rejects.toThrow(DhanamApiError);
    });
  });

  describe('trailing slash handling', () => {
    it('strips trailing slashes from baseUrl', async () => {
      const fetch = mockFetch(200, []);
      const client = new DhanamReferralClient({
        baseUrl: 'https://api.dhan.am///',
        getAccessToken,
        fetch,
      });

      await client.getRewards();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.dhan.am/v1/'),
        expect.anything()
      );
    });
  });
});
