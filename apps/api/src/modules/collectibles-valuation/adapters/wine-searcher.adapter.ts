import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

/**
 * Adapter for Wine-Searcher wine valuation API.
 *
 * Provides catalog search and market valuation for fine wines and spirits
 * using the Wine-Searcher pricing database. When implemented, this adapter
 * will query merchant listings and auction results to estimate current
 * market value for collectible wines by vintage, region, and producer.
 *
 * @see https://api.wine-searcher.com
 * @env WINE_SEARCHER_API_KEY
 */
@Injectable()
export class WineSearcherAdapter implements CollectibleProviderAdapter {
  readonly provider = 'wine-searcher';
  readonly category = 'wine' as const;
  readonly supportedCurrencies = ['USD', 'EUR'];

  private readonly logger = new Logger(WineSearcherAdapter.name);

  constructor() {
    this.logger.warn(
      'WineSearcherAdapter is not yet implemented. Set WINE_SEARCHER_API_KEY to enable.'
    );
  }

  // NOT_IMPLEMENTED: Returns false until API credentials are configured
  isAvailable(): boolean {
    return false;
  }

  async search(_query: string, _limit?: number): Promise<CatalogItem[]> {
    return [];
  }

  async getValuation(_externalId: string): Promise<ValuationResult | null> {
    return null;
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
