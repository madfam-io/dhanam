import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

@Injectable()
export class PsaAdapter implements CollectibleProviderAdapter {
  readonly provider = 'psa';
  readonly category = 'trading_card' as const;
  readonly supportedCurrencies = ['USD'];

  async search(_query: string, _limit?: number): Promise<CatalogItem[]> {
    throw new NotImplementedException(
      'PSA adapter requires partnership configuration. Set PSA_API_KEY to enable.'
    );
  }

  async getValuation(_externalId: string): Promise<ValuationResult | null> {
    throw new NotImplementedException(
      'PSA adapter requires partnership configuration. Set PSA_API_KEY to enable.'
    );
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
