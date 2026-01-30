import { Injectable, NotImplementedException } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

@Injectable()
export class HagertyAdapter implements CollectibleProviderAdapter {
  readonly provider = 'hagerty';
  readonly category = 'classic_car' as const;
  readonly supportedCurrencies = ['USD'];

  async search(_query: string, _limit?: number): Promise<CatalogItem[]> {
    throw new NotImplementedException(
      'Hagerty adapter requires membership configuration. Set HAGERTY_API_KEY to enable.'
    );
  }

  async getValuation(_externalId: string): Promise<ValuationResult | null> {
    throw new NotImplementedException(
      'Hagerty adapter requires membership configuration. Set HAGERTY_API_KEY to enable.'
    );
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
