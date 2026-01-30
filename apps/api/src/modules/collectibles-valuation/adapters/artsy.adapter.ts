import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

@Injectable()
export class ArtsyAdapter implements CollectibleProviderAdapter {
  readonly provider = 'artsy';
  readonly category = 'art' as const;
  readonly supportedCurrencies = ['USD'];

  async search(_query: string, _limit?: number): Promise<CatalogItem[]> {
    throw new NotImplementedException(
      'Artsy adapter requires API key configuration. Set ARTSY_CLIENT_ID and ARTSY_CLIENT_SECRET to enable.'
    );
  }

  async getValuation(_externalId: string): Promise<ValuationResult | null> {
    throw new NotImplementedException(
      'Artsy adapter requires API key configuration. Set ARTSY_CLIENT_ID and ARTSY_CLIENT_SECRET to enable.'
    );
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
