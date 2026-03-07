import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

/**
 * Adapter for WatchCharts luxury watch valuation API.
 *
 * Provides catalog search and market valuation for luxury watches using the
 * WatchCharts pricing database. When implemented, this adapter will query
 * historical sales data and current market listings to estimate fair market
 * value for timepieces from brands like Rolex, Patek Philippe, and Omega.
 *
 * @see https://watchcharts.com/api
 * @env WATCHCHARTS_API_KEY
 */
@Injectable()
export class WatchChartsAdapter implements CollectibleProviderAdapter {
  readonly provider = 'watchcharts';
  readonly category = 'watch' as const;
  readonly supportedCurrencies = ['USD', 'EUR'];

  private readonly logger = new Logger(WatchChartsAdapter.name);

  constructor() {
    this.logger.warn(
      'WatchChartsAdapter is not yet implemented. Set WATCHCHARTS_API_KEY to enable.'
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
