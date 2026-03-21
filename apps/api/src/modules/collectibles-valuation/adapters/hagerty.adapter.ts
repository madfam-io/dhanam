import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

interface HagertyVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  body_style?: string;
  image_url?: string;
  /** Hagerty condition grades: 1 (concours) to 4 (fair) */
  condition_grade?: number;
}

interface HagertySearchResponse {
  vehicles?: HagertyVehicle[];
}

interface HagertyValuationData {
  vehicle_id: string;
  year: number;
  make: string;
  model: string;
  /** Value at the requested (or default) condition grade */
  value: number;
  currency?: string;
  condition_grade: number;
  /** Hagerty provides values per condition tier */
  values_by_condition?: {
    condition_1?: number;
    condition_2?: number;
    condition_3?: number;
    condition_4?: number;
  };
  price_change_30d?: number;
  last_sale_price?: number;
  last_sale_date?: string;
}

@Injectable()
export class HagertyAdapter implements CollectibleProviderAdapter {
  readonly provider = 'hagerty';
  readonly category = 'classic_car' as const;
  readonly supportedCurrencies = ['USD'];

  private readonly logger = new Logger(HagertyAdapter.name);
  private readonly baseUrl = 'https://api.hagerty.com/v1';
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.HAGERTY_API_KEY;
    if (!this.apiKey) {
      this.logger.warn('HAGERTY_API_KEY not configured — adapter disabled');
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async search(query: string, limit = 10): Promise<CatalogItem[]> {
    if (!this.apiKey) return [];

    try {
      const params = new URLSearchParams({
        q: query,
        limit: String(limit),
      });

      const res = await fetch(`${this.baseUrl}/vehicles?${params}`, {
        headers: this.headers(),
      });

      if (!res.ok) {
        this.logger.warn(`Hagerty search failed: ${res.status} ${res.statusText}`);
        return [];
      }

      const data = (await res.json()) as HagertySearchResponse;
      const vehicles = data.vehicles ?? [];

      return vehicles.map((v) => ({
        externalId: v.id,
        provider: this.provider,
        category: this.category,
        name: `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ''}`,
        brand: v.make,
        imageUrl: v.image_url,
        currency: 'USD',
        metadata: {
          year: v.year,
          make: v.make,
          model: v.model,
          trim: v.trim,
          bodyStyle: v.body_style,
          conditionGrade: v.condition_grade,
        },
      }));
    } catch (error) {
      this.logger.warn(`Hagerty search error: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  async getValuation(externalId: string): Promise<ValuationResult | null> {
    if (!this.apiKey) return null;

    try {
      const res = await fetch(
        `${this.baseUrl}/vehicles/${encodeURIComponent(externalId)}/valuation`,
        { headers: this.headers() }
      );

      if (!res.ok) {
        this.logger.warn(`Hagerty valuation failed for ${externalId}: ${res.status}`);
        return null;
      }

      const data = (await res.json()) as HagertyValuationData;

      if (data.value == null) return null;

      // Derive low/high from condition tier values when available
      const valueLow = data.values_by_condition?.condition_4;
      const valueHigh = data.values_by_condition?.condition_1;

      return {
        externalId,
        provider: this.provider,
        marketValue: data.value,
        currency: data.currency ?? 'USD',
        valueLow,
        valueHigh,
        priceChange30d: data.price_change_30d,
        lastSalePrice: data.last_sale_price,
        lastSaleDate: data.last_sale_date ? new Date(data.last_sale_date) : undefined,
        source: 'hagerty',
        fetchedAt: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `Hagerty valuation error for ${externalId}: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const results = await this.search('Ford Mustang', 1);
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
