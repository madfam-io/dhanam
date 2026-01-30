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
export class StarAtlasAdapter implements MetaversePlatformAdapter {
  private readonly logger = new Logger(StarAtlasAdapter.name);
  readonly platform: MetaversePlatform = 'star-atlas';
  readonly chain: BlockchainNetwork = 'solana';
  readonly supportedTokens = ['ATLAS', 'POLIS'];

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  async getPositions(_spaceId: string): Promise<MetaversePosition> {
    return {
      platform: this.platform,
      chain: this.chain,
      totalValueUsd: 2800,
      tokens: [
        { symbol: 'ATLAS', balance: 250000, valueUsd: 750, priceUsd: 0.003, change24h: -2.4 },
        { symbol: 'POLIS', balance: 1200, valueUsd: 480, priceUsd: 0.4, change24h: 1.1 },
      ],
      staking: [
        {
          token: 'POLIS',
          amount: 800,
          valueUsd: 320,
          apy: 15,
          rewardToken: 'ATLAS',
          pendingRewards: 12500,
        },
      ],
      land: [],
      nfts: [
        {
          id: 'sa-ship-1',
          name: 'Pearce X5 Fighter',
          collection: 'Star Atlas Ships',
          platform: 'star-atlas',
          chain: 'solana',
          currentValueUsd: 650,
          acquisitionCostUsd: 400,
        },
        {
          id: 'sa-ship-2',
          name: 'Opal Jet',
          collection: 'Star Atlas Ships',
          platform: 'star-atlas',
          chain: 'solana',
          currentValueUsd: 600,
          acquisitionCostUsd: 350,
        },
      ],
      earnings: [
        {
          source: 'staking',
          platform: 'star-atlas',
          monthlyAmountUsd: 4,
          token: 'ATLAS',
          description: 'POLIS fleet staking',
        },
        {
          source: 'p2e',
          platform: 'star-atlas',
          monthlyAmountUsd: 25,
          token: 'ATLAS',
          description: 'Fleet mission rewards',
        },
      ],
    };
  }
}
