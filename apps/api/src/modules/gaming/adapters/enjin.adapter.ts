import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';
import {
  MetaversePlatform,
  BlockchainNetwork,
  MetaversePosition,
  MetaversePlatformAdapter,
} from '../interfaces/platform.interface';

@Injectable()
export class EnjinAdapter implements MetaversePlatformAdapter {
  private readonly logger = new Logger(EnjinAdapter.name);
  readonly platform: MetaversePlatform = 'enjin';
  readonly chain: BlockchainNetwork = 'ethereum';
  readonly supportedTokens = ['ENJ'];

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  async getPositions(_spaceId: string): Promise<MetaversePosition> {
    return {
      platform: this.platform,
      chain: this.chain,
      totalValueUsd: 1850,
      tokens: [{ symbol: 'ENJ', balance: 5000, valueUsd: 1250, priceUsd: 0.25, change24h: -0.8 }],
      staking: [],
      land: [],
      nfts: [
        {
          id: 'enj-item-1',
          name: 'Enjin Legendary Sword',
          collection: 'Lost Relics',
          platform: 'enjin',
          chain: 'ethereum',
          currentValueUsd: 320,
          acquisitionCostUsd: 200,
          meltValue: 50,
        },
        {
          id: 'enj-item-2',
          name: 'Enjin Epic Shield',
          collection: 'Age of Rust',
          platform: 'enjin',
          chain: 'ethereum',
          currentValueUsd: 280,
          acquisitionCostUsd: 150,
          meltValue: 35,
        },
      ],
      earnings: [
        {
          source: 'marketplace',
          platform: 'enjin',
          monthlyAmountUsd: 45,
          token: 'ENJ',
          description: 'Cross-game item marketplace sales',
        },
      ],
    };
  }
}
