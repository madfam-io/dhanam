import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

interface KicksDbProduct {
  id: string;
  name: string;
  brand?: string;
  sku?: string;
  image_url?: string;
  colorway?: string;
  retail_price?: number;
  release_date?: string;
  estimated_market_value?: number;
}

interface KicksDbPriceData {
  estimated_market_value: number;
  price_low?: number;
  price_high?: number;
  last_sale_price?: number;
  last_sale_date?: string;
  price_change_30d?: number;
}

@Injectable()
export class KicksDbAdapter implements CollectibleProviderAdapter {
  readonly provider = 'kicksdb';
  readonly category = 'sneaker' as const;
  readonly supportedCurrencies = ['USD'];

  private readonly logger = new Logger(KicksDbAdapter.name);
  private readonly baseUrl = 'https://api.kicks.dev/v1';
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.KICKSDB_API_KEY;
    if (!this.apiKey) {
      this.logger.warn('KICKSDB_API_KEY not configured — adapter disabled');
    }
  }

  async search(query: string, limit = 10): Promise<CatalogItem[]> {
    if (!this.apiKey) return [];

    try {
      const params = new URLSearchParams({ query, limit: String(limit) });
      const res = await fetch(`${this.baseUrl}/products?${params}`, {
        headers: this.headers(),
      });

      if (!res.ok) {
        this.logger.warn(`KicksDB search failed: ${res.status} ${res.statusText}`);
        return [];
      }

      const data = (await res.json()) as { products?: KicksDbProduct[] };
      const products = data.products ?? [];

      return products.map((p) => ({
        externalId: p.id,
        provider: this.provider,
        category: this.category,
        name: p.name,
        brand: p.brand,
        referenceNumber: p.sku,
        imageUrl: p.image_url,
        currentMarketValue: p.estimated_market_value,
        currency: 'USD',
        metadata: {
          colorway: p.colorway,
          retailPrice: p.retail_price,
          releaseDate: p.release_date,
        },
      }));
    } catch (error) {
      this.logger.warn(`KicksDB search error: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  async getValuation(externalId: string): Promise<ValuationResult | null> {
    if (!this.apiKey) return null;

    try {
      const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(externalId)}/prices`, {
        headers: this.headers(),
      });

      if (!res.ok) {
        this.logger.warn(`KicksDB valuation failed for ${externalId}: ${res.status}`);
        return null;
      }

      const data = (await res.json()) as KicksDbPriceData;

      if (data.estimated_market_value == null) return null;

      return {
        externalId,
        provider: this.provider,
        marketValue: data.estimated_market_value,
        currency: 'USD',
        valueLow: data.price_low,
        valueHigh: data.price_high,
        lastSalePrice: data.last_sale_price,
        lastSaleDate: data.last_sale_date ? new Date(data.last_sale_date) : undefined,
        priceChange30d: data.price_change_30d,
        source: 'kicksdb',
        fetchedAt: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `KicksDB valuation error for ${externalId}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const results = await this.search('Air Jordan 1', 1);
      return results.length > 0;
    } catch {
      return false;
    }
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }
}
