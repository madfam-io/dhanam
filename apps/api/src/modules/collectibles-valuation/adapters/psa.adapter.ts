import { Injectable } from '@nestjs/common';

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
