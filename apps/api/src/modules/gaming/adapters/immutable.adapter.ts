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
export class ImmutableAdapter implements MetaversePlatformAdapter {
  private readonly logger = new Logger(ImmutableAdapter.name);
  readonly platform: MetaversePlatform = 'immutable';
  readonly chain: BlockchainNetwork = 'immutable-zkevm';
  readonly supportedTokens = ['IMX'];

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  async getPositions(_spaceId: string): Promise<MetaversePosition> {
    return {
      platform: this.platform,
      chain: this.chain,
      totalValueUsd: 2100,
      tokens: [{ symbol: 'IMX', balance: 3000, valueUsd: 1500, priceUsd: 0.5, change24h: 4.2 }],
      staking: [
        {
          token: 'IMX',
          amount: 2000,
          valueUsd: 1000,
          apy: 12,
          rewardToken: 'IMX',
          pendingRewards: 15,
        },
      ],
      land: [],
      nfts: [
        {
          id: 'imx-nft-1',
          name: 'Gods Unchained Genesis Card',
          collection: 'Gods Unchained',
          platform: 'immutable',
          chain: 'immutable-zkevm',
          currentValueUsd: 450,
          acquisitionCostUsd: 200,
        },
        {
          id: 'imx-nft-2',
          name: 'Guild of Guardians Hero',
          collection: 'Guild of Guardians',
          platform: 'immutable',
          chain: 'immutable-zkevm',
          currentValueUsd: 150,
          acquisitionCostUsd: 80,
        },
      ],
      earnings: [
        {
          source: 'staking',
          platform: 'immutable',
          monthlyAmountUsd: 10,
          token: 'IMX',
          description: 'IMX staking at 12% APY',
        },
        {
          source: 'marketplace',
          platform: 'immutable',
          monthlyAmountUsd: 65,
          token: 'IMX',
          description: 'NFT marketplace trading profits',
        },
      ],
    };
  }
}
