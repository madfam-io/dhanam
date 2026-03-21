import { HagertyAdapter } from './hagerty.adapter';

describe('HagertyAdapter', () => {
  let adapter: HagertyAdapter;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, HAGERTY_API_KEY: 'test-hagerty-key' };
    adapter = new HagertyAdapter();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('getCategory / provider', () => {
    it('should return correct provider and category', () => {
      expect(adapter.provider).toBe('hagerty');
      expect(adapter.category).toBe('classic_car');
    });
  });

  describe('isAvailable', () => {
    it('should return true when HAGERTY_API_KEY is set', () => {
      expect(adapter.isAvailable()).toBe(true);
    });

    it('should return false when HAGERTY_API_KEY is missing', () => {
      delete process.env.HAGERTY_API_KEY;
      const a = new HagertyAdapter();
      expect(a.isAvailable()).toBe(false);
    });
  });

  describe('search', () => {
    it('should map Hagerty vehicles to CatalogItem format', async () => {
      const mockResponse = {
        vehicles: [
          {
            id: 'hag-1967-mustang',
            year: 1967,
            make: 'Ford',
            model: 'Mustang',
            trim: 'Fastback',
            body_style: 'Coupe',
            image_url: 'https://img.hagerty.com/mustang67.jpg',
            condition_grade: 2,
          },
        ],
      };

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await adapter.search('Ford Mustang', 10);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          externalId: 'hag-1967-mustang',
          provider: 'hagerty',
          category: 'classic_car',
          name: '1967 Ford Mustang Fastback',
          brand: 'Ford',
          imageUrl: 'https://img.hagerty.com/mustang67.jpg',
          currency: 'USD',
        })
      );
      expect(results[0].metadata).toEqual(
        expect.objectContaining({
          year: 1967,
          make: 'Ford',
          model: 'Mustang',
          trim: 'Fastback',
          bodyStyle: 'Coupe',
          conditionGrade: 2,
        })
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/vehicles?q=Ford+Mustang&limit=10'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-hagerty-key',
          }),
        })
      );
    });

    it('should build name without trim when trim is absent', async () => {
      const mockResponse = {
        vehicles: [
          {
            id: 'hag-1963-corvette',
            year: 1963,
            make: 'Chevrolet',
            model: 'Corvette',
          },
        ],
      };

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await adapter.search('Corvette', 5);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('1963 Chevrolet Corvette');
    });

    it('should return empty array on API error', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const results = await adapter.search('Mustang', 10);
      expect(results).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const results = await adapter.search('Mustang', 10);
      expect(results).toEqual([]);
    });

    it('should return empty array when API key is not configured', async () => {
      delete process.env.HAGERTY_API_KEY;
      const noKeyAdapter = new HagertyAdapter();

      const results = await noKeyAdapter.search('Mustang', 10);
      expect(results).toEqual([]);
    });

    it('should handle empty vehicles array', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ vehicles: [] }),
      } as Response);

      const results = await adapter.search('nonexistent', 10);
      expect(results).toEqual([]);
    });

    it('should handle missing vehicles key in response', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const results = await adapter.search('test', 10);
      expect(results).toEqual([]);
    });
  });

  describe('getValuation', () => {
    it('should map valuation data to ValuationResult', async () => {
      const mockValuation = {
        vehicle_id: 'hag-1967-mustang',
        year: 1967,
        make: 'Ford',
        model: 'Mustang',
        value: 85000,
        currency: 'USD',
        condition_grade: 2,
        values_by_condition: {
          condition_1: 150000,
          condition_2: 85000,
          condition_3: 55000,
          condition_4: 32000,
        },
        price_change_30d: 3.2,
        last_sale_price: 82000,
        last_sale_date: '2025-11-15',
      };

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockValuation,
      } as Response);

      const result = await adapter.getValuation('hag-1967-mustang');

      expect(result).toBeDefined();
      expect(result!.marketValue).toBe(85000);
      expect(result!.currency).toBe('USD');
      expect(result!.valueLow).toBe(32000); // condition 4
      expect(result!.valueHigh).toBe(150000); // condition 1
      expect(result!.priceChange30d).toBe(3.2);
      expect(result!.lastSalePrice).toBe(82000);
      expect(result!.lastSaleDate).toEqual(new Date('2025-11-15'));
      expect(result!.provider).toBe('hagerty');
      expect(result!.source).toBe('hagerty');
      expect(result!.fetchedAt).toBeInstanceOf(Date);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/vehicles/hag-1967-mustang/valuation'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-hagerty-key',
          }),
        })
      );
    });

    it('should handle valuation without condition breakdown', async () => {
      const mockValuation = {
        vehicle_id: 'hag-simple',
        year: 1970,
        make: 'Dodge',
        model: 'Challenger',
        value: 120000,
        condition_grade: 3,
      };

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockValuation,
      } as Response);

      const result = await adapter.getValuation('hag-simple');

      expect(result).toBeDefined();
      expect(result!.marketValue).toBe(120000);
      expect(result!.valueLow).toBeUndefined();
      expect(result!.valueHigh).toBeUndefined();
      expect(result!.currency).toBe('USD'); // default
    });

    it('should return null when value is null', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          vehicle_id: 'hag-unknown',
          value: null,
          condition_grade: 3,
        }),
      } as Response);

      const result = await adapter.getValuation('hag-unknown');
      expect(result).toBeNull();
    });

    it('should return null when vehicle not found', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await adapter.getValuation('UNKNOWN');
      expect(result).toBeNull();
    });

    it('should return null when API key is not configured', async () => {
      delete process.env.HAGERTY_API_KEY;
      const noKeyAdapter = new HagertyAdapter();

      const result = await noKeyAdapter.getValuation('hag-123');
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await adapter.getValuation('hag-123');
      expect(result).toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('should return true when search succeeds', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          vehicles: [{ id: 'x', year: 1965, make: 'Ford', model: 'Mustang' }],
        }),
      } as Response);

      const result = await adapter.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when API key is not configured', async () => {
      delete process.env.HAGERTY_API_KEY;
      const noKeyAdapter = new HagertyAdapter();

      const result = await noKeyAdapter.healthCheck();
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));

      const result = await adapter.healthCheck();
      expect(result).toBe(false);
    });

    it('should return false when search returns empty results', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ vehicles: [] }),
      } as Response);

      const result = await adapter.healthCheck();
      expect(result).toBe(false);
    });
  });
});
