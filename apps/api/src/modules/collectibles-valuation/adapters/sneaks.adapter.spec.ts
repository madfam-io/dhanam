jest.mock('sneaks-api', () => {
  return jest.fn().mockImplementation(() => ({
    getProducts: jest.fn(),
    getProductPrices: jest.fn(),
  }));
});

import { SneaksAdapter } from './sneaks.adapter';

describe('SneaksAdapter', () => {
  let adapter: SneaksAdapter;
  let mockSneaksInstance: any;

  beforeEach(() => {
    adapter = new SneaksAdapter();
    // Access the internal sneaks instance
    mockSneaksInstance = (adapter as any).sneaks;
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should map sneaks-api products to CatalogItem format', async () => {
      const mockProducts = [
        {
          styleID: 'CW2288-111',
          shoeName: 'Air Jordan 1 Chicago',
          brand: 'Jordan',
          thumbnail: 'https://img.example.com/aj1.jpg',
          colorway: 'White/Red',
          retailPrice: 170,
          releaseDate: '2020-02-20',
          urlKey: 'air-jordan-1-retro-high-og-chicago',
          lowestResellPrice: { stockX: 320, goat: 310, flightClub: 350 },
        },
      ];

      mockSneaksInstance.getProducts.mockImplementation(
        (_q: string, _l: number, cb: Function) => cb(null, mockProducts),
      );

      const results = await adapter.search('jordan', 10);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          externalId: 'CW2288-111',
          provider: 'sneaks',
          category: 'sneaker',
          name: 'Air Jordan 1 Chicago',
          brand: 'Jordan',
          currentMarketValue: 310, // min of 320, 310, 350
          currency: 'USD',
        }),
      );
    });

    it('should return empty array on API error', async () => {
      mockSneaksInstance.getProducts.mockImplementation(
        (_q: string, _l: number, cb: Function) => cb(new Error('API error'), null),
      );

      const results = await adapter.search('jordan', 10);
      expect(results).toEqual([]);
    });

    it('should return empty array when sneaks-api is unavailable', async () => {
      (adapter as any).sneaks = null;

      const results = await adapter.search('jordan', 10);
      expect(results).toEqual([]);
    });
  });

  describe('getValuation', () => {
    it('should map product prices to ValuationResult', async () => {
      const mockProduct = {
        styleID: 'CW2288-111',
        lowestResellPrice: { stockX: 320, goat: 310, flightClub: 350 },
      };

      mockSneaksInstance.getProductPrices.mockImplementation(
        (_id: string, cb: Function) => cb(null, mockProduct),
      );

      const result = await adapter.getValuation('CW2288-111');

      expect(result).toBeDefined();
      expect(result!.marketValue).toBe(310);
      expect(result!.valueLow).toBe(310);
      expect(result!.valueHigh).toBe(350);
      expect(result!.provider).toBe('sneaks');
      expect(result!.currency).toBe('USD');
    });

    it('should return null when product not found', async () => {
      mockSneaksInstance.getProductPrices.mockImplementation(
        (_id: string, cb: Function) => cb(new Error('Not found'), null),
      );

      const result = await adapter.getValuation('UNKNOWN');
      expect(result).toBeNull();
    });

    it('should return null when no resell prices available', async () => {
      const mockProduct = {
        styleID: 'CW2288-111',
        lowestResellPrice: {},
      };

      mockSneaksInstance.getProductPrices.mockImplementation(
        (_id: string, cb: Function) => cb(null, mockProduct),
      );

      const result = await adapter.getValuation('CW2288-111');
      expect(result).toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('should return true when search succeeds', async () => {
      mockSneaksInstance.getProducts.mockImplementation(
        (_q: string, _l: number, cb: Function) =>
          cb(null, [{ styleID: 'X', shoeName: 'Test', lowestResellPrice: { stockX: 100 } }]),
      );

      const result = await adapter.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when sneaks-api is unavailable', async () => {
      (adapter as any).sneaks = null;

      const result = await adapter.healthCheck();
      expect(result).toBe(false);
    });
  });
});
