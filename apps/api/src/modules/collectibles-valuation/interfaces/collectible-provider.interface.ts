export type CollectibleCategory =
  | 'watch'
  | 'sneaker'
  | 'art'
  | 'wine'
  | 'coin'
  | 'trading_card'
  | 'classic_car';

export interface CatalogItem {
  externalId: string;
  provider: string;
  category: CollectibleCategory;
  name: string;
  brand?: string;
  referenceNumber?: string;
  imageUrl?: string;
  currentMarketValue?: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface ValuationResult {
  externalId: string;
  provider: string;
  marketValue: number;
  currency: string;
  valueLow?: number;
  valueHigh?: number;
  priceChange30d?: number;
  lastSalePrice?: number;
  lastSaleDate?: Date;
  source: string;
  fetchedAt: Date;
}

export interface CollectibleProviderAdapter {
  readonly provider: string;
  readonly category: CollectibleCategory;
  readonly supportedCurrencies: string[];
  search(query: string, limit?: number): Promise<CatalogItem[]>;
  getValuation(externalId: string): Promise<ValuationResult | null>;
  healthCheck(): Promise<boolean>;
}
