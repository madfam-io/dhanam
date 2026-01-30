import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

@Injectable()
export class SneaksAdapter implements CollectibleProviderAdapter {
  readonly provider = 'sneaks';
  readonly category = 'sneaker' as const;
  readonly supportedCurrencies = ['USD'];

  private readonly logger = new Logger(SneaksAdapter.name);
  private sneaks: any;

  constructor() {
    // Lazy-load sneaks-api to avoid blocking startup
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SneaksAPI = require('sneaks-api');
      this.sneaks = new SneaksAPI();
    } catch {
      this.logger.warn('sneaks-api package not available — adapter disabled');
    }
  }

  async search(query: string, limit = 10): Promise<CatalogItem[]> {
    if (!this.sneaks) return [];

    return new Promise((resolve) => {
      this.sneaks.getProducts(query, limit, (err: any, products: any[]) => {
        if (err || !products) {
          this.logger.warn(`Sneaks search failed: ${err?.message || 'no results'}`);
          resolve([]);
          return;
        }

        resolve(
          products.map((p) => ({
            externalId: p.styleID || p.urlKey || p.shoeName,
            provider: this.provider,
            category: this.category,
            name: p.shoeName,
            brand: p.brand,
            referenceNumber: p.styleID,
            imageUrl: p.thumbnail,
            currentMarketValue: this.extractLowestPrice(p),
            currency: 'USD',
            metadata: {
              colorway: p.colorway,
              retailPrice: p.retailPrice,
              releaseDate: p.releaseDate,
              urlKey: p.urlKey,
            },
          }))
        );
      });
    });
  }

  async getValuation(externalId: string): Promise<ValuationResult | null> {
    if (!this.sneaks) return null;

    return new Promise((resolve) => {
      this.sneaks.getProductPrices(externalId, (err: any, product: any) => {
        if (err || !product) {
          this.logger.warn(
            `Sneaks valuation failed for ${externalId}: ${err?.message || 'not found'}`
          );
          resolve(null);
          return;
        }

        const lowestResell = this.extractLowestPrice(product);
        if (lowestResell == null) {
          resolve(null);
          return;
        }

        const prices = this.extractAllPrices(product);

        resolve({
          externalId,
          provider: this.provider,
          marketValue: lowestResell,
          currency: 'USD',
          valueLow: prices.length > 0 ? Math.min(...prices) : undefined,
          valueHigh: prices.length > 0 ? Math.max(...prices) : undefined,
          source: 'sneaks',
          fetchedAt: new Date(),
        });
      });
    });
  }

  async healthCheck(): Promise<boolean> {
    if (!this.sneaks) return false;

    try {
      const results = await this.search('Air Jordan 1', 1);
      return results.length > 0;
    } catch {
      return false;
    }
  }

  private extractLowestPrice(product: any): number | undefined {
    const resellPrices = product.lowestResellPrice;
    if (!resellPrices || typeof resellPrices !== 'object') return undefined;

    const values = Object.values(resellPrices).filter(
      (v): v is number => typeof v === 'number' && v > 0
    );
    return values.length > 0 ? Math.min(...values) : undefined;
  }

  private extractAllPrices(product: any): number[] {
    const resellPrices = product.lowestResellPrice;
    if (!resellPrices || typeof resellPrices !== 'object') return [];

    return Object.values(resellPrices).filter((v): v is number => typeof v === 'number' && v > 0);
  }
}
