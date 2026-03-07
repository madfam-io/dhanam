import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

/**
 * Adapter for Artsy art valuation API.
 *
 * Provides catalog search and market valuation for fine art, prints, and
 * sculptures using the Artsy public API. When implemented, this adapter will
 * query auction results and gallery pricing to estimate current market value.
 *
 * @see https://developers.artsy.net
 * @env ARTSY_API_KEY
 */
@Injectable()
export class ArtsyAdapter implements CollectibleProviderAdapter {
  readonly provider = 'artsy';
  readonly category = 'art' as const;
  readonly supportedCurrencies = ['USD'];

  private readonly logger = new Logger(ArtsyAdapter.name);

  constructor() {
    this.logger.warn('ArtsyAdapter is not yet implemented. Set ARTSY_API_KEY to enable.');
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
