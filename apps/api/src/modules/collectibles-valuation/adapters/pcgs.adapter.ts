import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

@Injectable()
export class PcgsAdapter implements CollectibleProviderAdapter {
  readonly provider = 'pcgs';
  readonly category = 'coin' as const;
  readonly supportedCurrencies = ['USD'];

  async search(_query: string, _limit?: number): Promise<CatalogItem[]> {
    throw new NotImplementedException(
      'PCGS adapter requires API key configuration. Set PCGS_API_KEY to enable.'
    );
  }

  async getValuation(_externalId: string): Promise<ValuationResult | null> {
    throw new NotImplementedException(
      'PCGS adapter requires API key configuration. Set PCGS_API_KEY to enable.'
    );
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
