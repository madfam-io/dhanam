import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

/**
 * Adapter for PCGS coin valuation API.
 *
 * Provides catalog search and market valuation for numismatic coins using the
 * PCGS (Professional Coin Grading Service) public API. When implemented, this
 * adapter will query the PCGS price guide and census data to estimate current
 * market value for graded coins by certification number, type, and grade.
 *
 * @see https://www.pcgs.com/publicapi
 * @env PCGS_API_KEY
 */
@Injectable()
export class PcgsAdapter implements CollectibleProviderAdapter {
  readonly provider = 'pcgs';
  readonly category = 'coin' as const;
  readonly supportedCurrencies = ['USD'];

  private readonly logger = new Logger(PcgsAdapter.name);

  constructor() {
    this.logger.warn('PcgsAdapter is not yet implemented. Set PCGS_API_KEY to enable.');
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
