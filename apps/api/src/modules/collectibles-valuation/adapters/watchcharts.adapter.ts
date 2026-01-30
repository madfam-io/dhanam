import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

@Injectable()
export class WatchChartsAdapter implements CollectibleProviderAdapter {
  readonly provider = 'watchcharts';
  readonly category = 'watch' as const;
  readonly supportedCurrencies = ['USD', 'EUR'];

  async search(_query: string, _limit?: number): Promise<CatalogItem[]> {
    throw new NotImplementedException(
      'WatchCharts adapter requires API key configuration. Set WATCHCHARTS_API_KEY to enable.'
    );
  }

  async getValuation(_externalId: string): Promise<ValuationResult | null> {
    throw new NotImplementedException(
      'WatchCharts adapter requires API key configuration. Set WATCHCHARTS_API_KEY to enable.'
    );
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
