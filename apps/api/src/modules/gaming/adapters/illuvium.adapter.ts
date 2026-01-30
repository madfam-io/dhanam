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
export class IlluviumAdapter implements MetaversePlatformAdapter {
  private readonly logger = new Logger(IlluviumAdapter.name);
  readonly platform: MetaversePlatform = 'illuvium';
  readonly chain: BlockchainNetwork = 'immutable-zkevm';
  readonly supportedTokens = ['ILV'];

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  async getPositions(_spaceId: string): Promise<MetaversePosition> {
    return {
      platform: this.platform,
      chain: this.chain,
      totalValueUsd: 6200,
      tokens: [{ symbol: 'ILV', balance: 45, valueUsd: 3150, priceUsd: 70, change24h: 3.8 }],
      staking: [
        {
          token: 'ILV',
          amount: 30,
          valueUsd: 2100,
          apy: 18,
          rewardToken: 'sILV',
          pendingRewards: 1.2,
        },
      ],
      land: [
        {
          id: 'ilv-land-1',
          platform: 'illuvium',
          valueUsd: 950,
          tier: 'Tier 3',
          rentalStatus: 'self-use',
        },
      ],
      nfts: [
        {
          id: 'ilv-nft-1',
          name: 'Illuvial #2847',
          collection: 'Illuvium',
          platform: 'illuvium',
          chain: 'immutable-zkevm',
          currentValueUsd: 280,
          acquisitionCostUsd: 150,
        },
      ],
      earnings: [
        {
          source: 'staking',
          platform: 'illuvium',
          monthlyAmountUsd: 32,
          token: 'sILV',
          description: 'ILV revenue distribution staking at 18% APY',
        },
        {
          source: 'p2e',
          platform: 'illuvium',
          monthlyAmountUsd: 148,
          token: 'sILV',
          description: 'Illuvium gameplay and tournament earnings',
        },
      ],
    };
  }
}
