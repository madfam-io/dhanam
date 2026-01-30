import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

@Injectable()
export class WineSearcherAdapter implements CollectibleProviderAdapter {
  readonly provider = 'wine-searcher';
  readonly category = 'wine' as const;
  readonly supportedCurrencies = ['USD', 'EUR'];

  async search(_query: string, _limit?: number): Promise<CatalogItem[]> {
    throw new NotImplementedException(
      'Wine-Searcher adapter requires API key configuration. Set WINE_SEARCHER_API_KEY to enable.'
    );
  }

  async getValuation(_externalId: string): Promise<ValuationResult | null> {
    throw new NotImplementedException(
      'Wine-Searcher adapter requires API key configuration. Set WINE_SEARCHER_API_KEY to enable.'
    );
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
