import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

/**
 * Adapter for Hagerty classic car valuation API.
 *
 * Provides catalog search and market valuation for classic and collector
 * vehicles using the Hagerty Valuation Tools. When implemented, this adapter
 * will query the Hagerty price guide and auction results to estimate current
 * market value for classic cars by year, make, model, and condition grade.
 *
 * @see https://www.hagerty.com/apps/valuationtools
 * @env HAGERTY_API_KEY
 */
@Injectable()
export class HagertyAdapter implements CollectibleProviderAdapter {
  readonly provider = 'hagerty';
  readonly category = 'classic_car' as const;
  readonly supportedCurrencies = ['USD'];

  private readonly logger = new Logger(HagertyAdapter.name);

  constructor() {
    this.logger.warn('HagertyAdapter is not yet implemented. Set HAGERTY_API_KEY to enable.');
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
