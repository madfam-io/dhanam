import { ArtsyAdapter } from './artsy.adapter';

describe('ArtsyAdapter', () => {
  let adapter: ArtsyAdapter;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ARTSY_CLIENT_ID: 'test-client-id',
      ARTSY_CLIENT_SECRET: 'test-client-secret',
    };
    adapter = new ArtsyAdapter();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  const mockTokenResponse = {
    type: 'xapp_token',
    token: 'xapp-test-token-123',
    expires_at: new Date(Date.now() + 86_400_000).toISOString(), // +24h
  };

  /** Helper: mock token + subsequent API call */
  function mockFetchSequence(...responses: Array<Partial<Response>>) {
    const mocked = jest.spyOn(globalThis, 'fetch');
    // First call is always the token exchange
    mocked.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTokenResponse,
    } as Response);
    // Subsequent calls are the actual API requests
    for (const r of responses) {
      mocked.mockResolvedValueOnce(r as Response);
    }
    return mocked;
  }

  describe('getCategory / provider', () => {
    it('should return correct provider and category', () => {
      expect(adapter.provider).toBe('artsy');
      expect(adapter.category).toBe('art');
    });
  });

  describe('isAvailable', () => {
    it('should return true when both env vars are set', () => {
      expect(adapter.isAvailable()).toBe(true);
    });

    it('should return false when ARTSY_CLIENT_ID is missing', () => {
      delete process.env.ARTSY_CLIENT_ID;
      const a = new ArtsyAdapter();
      expect(a.isAvailable()).toBe(false);
    });

    it('should return false when ARTSY_CLIENT_SECRET is missing', () => {
      delete process.env.ARTSY_CLIENT_SECRET;
      const a = new ArtsyAdapter();
      expect(a.isAvailable()).toBe(false);
    });

    it('should return false when both env vars are missing', () => {
      delete process.env.ARTSY_CLIENT_ID;
      delete process.env.ARTSY_CLIENT_SECRET;
      const a = new ArtsyAdapter();
      expect(a.isAvailable()).toBe(false);
    });
  });

  describe('search', () => {
    it('should search artworks and return CatalogItem array', async () => {
      const searchResponse = {
        _embedded: {
          results: [
            {
              type: 'artwork',
              title: 'Guernica',
              og_image: 'https://img.artsy.net/guernica.jpg',
              _links: {
                self: {
                  href: 'https://api.artsy.net/api/artworks/pablo-picasso-guernica',
                },
              },
            },
          ],
        },
      };

      const artworksResponse = {
        _embedded: {
          artworks: [
            {
              id: 'pablo-picasso-guernica',
              title: 'Guernica',
              date: '1937',
              medium: 'Oil on canvas',
              image_url: 'https://img.artsy.net/guernica-large.jpg',
              dimensions: { in: '137.4 x 305.5 in' },
              collecting_institution: 'Museo Reina Sofia',
            },
          ],
        },
      };

      mockFetchSequence(
        { ok: true, json: async () => searchResponse } as Response,
        { ok: true, json: async () => artworksResponse } as Response
      );

      const results = await adapter.search('Picasso', 5);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          externalId: 'pablo-picasso-guernica',
          provider: 'artsy',
          category: 'art',
          name: 'Guernica',
          currency: 'USD',
        })
      );

      // Verify token request
      expect(fetch).toHaveBeenCalledWith(
        'https://api.artsy.net/api/tokens/xapp_token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
          }),
        })
      );

      // Verify search request uses X-XAPP-Token header
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-XAPP-Token': 'xapp-test-token-123',
          }),
        })
      );
    });

    it('should fall back to search results when artwork IDs cannot be resolved', async () => {
      const searchResponse = {
        _embedded: {
          results: [
            {
              type: 'artwork',
              title: 'Starry Night',
              og_image: 'https://img.artsy.net/starry.jpg',
              _links: { self: { href: 'https://api.artsy.net/api/artworks/vg-starry' } },
            },
          ],
        },
      };

      mockFetchSequence(
        { ok: true, json: async () => searchResponse } as Response,
        { ok: false, status: 500, statusText: 'Internal Server Error' } as Response
      );

      const results = await adapter.search('starry night', 5);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          provider: 'artsy',
          category: 'art',
          name: 'Starry Night',
        })
      );
    });

    it('should return empty array on API error', async () => {
      mockFetchSequence({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const results = await adapter.search('Picasso', 5);
      expect(results).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const results = await adapter.search('Picasso', 5);
      expect(results).toEqual([]);
    });

    it('should return empty array when env vars are not configured', async () => {
      delete process.env.ARTSY_CLIENT_ID;
      delete process.env.ARTSY_CLIENT_SECRET;
      const noCredsAdapter = new ArtsyAdapter();

      const results = await noCredsAdapter.search('Picasso', 5);
      expect(results).toEqual([]);
    });
  });

  describe('getValuation', () => {
    it('should map artwork with price_listed to ValuationResult', async () => {
      const artworkDetail = {
        id: 'pablo-picasso-guernica',
        title: 'Guernica',
        price_listed: 25000,
        price_currency: 'USD',
        sale_message: '$25,000',
      };

      mockFetchSequence({
        ok: true,
        json: async () => artworkDetail,
      } as Response);

      const result = await adapter.getValuation('pablo-picasso-guernica');

      expect(result).toBeDefined();
      expect(result!.marketValue).toBe(25000);
      expect(result!.currency).toBe('USD');
      expect(result!.provider).toBe('artsy');
      expect(result!.source).toBe('artsy');
      expect(result!.fetchedAt).toBeInstanceOf(Date);
    });

    it('should parse sale_message when price_listed is absent', async () => {
      const artworkDetail = {
        id: 'art-123',
        title: 'Abstract #1',
        sale_message: '$12,000',
        price_currency: 'EUR',
      };

      mockFetchSequence({
        ok: true,
        json: async () => artworkDetail,
      } as Response);

      const result = await adapter.getValuation('art-123');

      expect(result).toBeDefined();
      expect(result!.marketValue).toBe(12000);
      expect(result!.currency).toBe('EUR');
    });

    it('should use auction estimate midpoint as fallback', async () => {
      const artworkDetail = {
        id: 'art-456',
        title: 'Auction Piece',
        estimate_low_cents: 500_000, // $5,000
        estimate_high_cents: 1_000_000, // $10,000
      };

      mockFetchSequence({
        ok: true,
        json: async () => artworkDetail,
      } as Response);

      const result = await adapter.getValuation('art-456');

      expect(result).toBeDefined();
      expect(result!.marketValue).toBe(7500); // midpoint of $5k-$10k
      expect(result!.valueLow).toBe(5000);
      expect(result!.valueHigh).toBe(10000);
    });

    it('should return null when no pricing info is available', async () => {
      const artworkDetail = {
        id: 'art-789',
        title: 'Museum Piece',
        sale_message: 'Contact for price',
      };

      mockFetchSequence({
        ok: true,
        json: async () => artworkDetail,
      } as Response);

      const result = await adapter.getValuation('art-789');
      expect(result).toBeNull();
    });

    it('should return null when artwork not found', async () => {
      mockFetchSequence({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await adapter.getValuation('UNKNOWN');
      expect(result).toBeNull();
    });

    it('should return null when env vars are not configured', async () => {
      delete process.env.ARTSY_CLIENT_ID;
      delete process.env.ARTSY_CLIENT_SECRET;
      const noCredsAdapter = new ArtsyAdapter();

      const result = await noCredsAdapter.getValuation('art-123');
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await adapter.getValuation('art-123');
      expect(result).toBeNull();
    });
  });

  describe('OAuth token caching', () => {
    it('should reuse cached token within TTL', async () => {
      const searchResponse = {
        _embedded: { results: [] },
      };

      const fetchSpy = jest.spyOn(globalThis, 'fetch');

      // First call: token + search
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => searchResponse,
      } as Response);

      await adapter.search('test1');

      // Second call: should reuse cached token, only search call
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => searchResponse,
      } as Response);

      await adapter.search('test2');

      // Token endpoint should have been called only once
      const tokenCalls = fetchSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('tokens/xapp_token')
      );
      expect(tokenCalls).toHaveLength(1);
    });

    it('should refresh token when expired', async () => {
      const searchResponse = {
        _embedded: { results: [] },
      };

      const expiredTokenResponse = {
        type: 'xapp_token',
        token: 'expired-token',
        expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
      };

      const freshTokenResponse = {
        type: 'xapp_token',
        token: 'fresh-token',
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      };

      const fetchSpy = jest.spyOn(globalThis, 'fetch');

      // First call: expired token + search
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => expiredTokenResponse,
      } as Response);
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => searchResponse,
      } as Response);

      await adapter.search('test1');

      // Second call: token is expired, so should request new one
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => freshTokenResponse,
      } as Response);
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => searchResponse,
      } as Response);

      await adapter.search('test2');

      // Token endpoint should have been called twice
      const tokenCalls = fetchSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('tokens/xapp_token')
      );
      expect(tokenCalls).toHaveLength(2);
    });

    it('should return empty results when token exchange fails', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const results = await adapter.search('test');
      expect(results).toEqual([]);
    });
  });

  describe('healthCheck', () => {
    it('should return true when search succeeds', async () => {
      const searchResponse = {
        _embedded: {
          results: [
            {
              type: 'artwork',
              title: 'Picasso Piece',
              _links: {
                self: {
                  href: 'https://api.artsy.net/api/artworks/picasso-1',
                },
              },
            },
          ],
        },
      };

      const artworksResponse = {
        _embedded: {
          artworks: [
            {
              id: 'picasso-1',
              title: 'Picasso Piece',
            },
          ],
        },
      };

      mockFetchSequence(
        { ok: true, json: async () => searchResponse } as Response,
        { ok: true, json: async () => artworksResponse } as Response
      );

      const result = await adapter.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when env vars are not configured', async () => {
      delete process.env.ARTSY_CLIENT_ID;
      delete process.env.ARTSY_CLIENT_SECRET;
      const noCredsAdapter = new ArtsyAdapter();

      const result = await noCredsAdapter.healthCheck();
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));

      const result = await adapter.healthCheck();
      expect(result).toBe(false);
    });
  });
});
