import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

/**
 * Adapter for PSA trading card valuation API.
 *
 * Provides catalog search and market valuation for graded trading cards using
 * the PSA (Professional Sports Authenticator) public API. When implemented,
 * this adapter will query the PSA population report and sales history to
 * estimate current market value for sports, Pokemon, and other collectible
 * cards by certification number, set, and grade.
 *
 * @see https://www.psacard.com/services/publicapi
 * @env PSA_API_KEY
 */
@Injectable()
export class PsaAdapter implements CollectibleProviderAdapter {
  readonly provider = 'psa';
  readonly category = 'trading_card' as const;
  readonly supportedCurrencies = ['USD'];

  private readonly logger = new Logger(PsaAdapter.name);

  constructor() {
    this.logger.warn('PsaAdapter is not yet implemented. Set PSA_API_KEY to enable.');
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
