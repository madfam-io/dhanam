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
export class GalaAdapter implements MetaversePlatformAdapter {
  private readonly logger = new Logger(GalaAdapter.name);
  readonly platform: MetaversePlatform = 'gala';
  readonly chain: BlockchainNetwork = 'galachain';
  readonly supportedTokens = ['GALA'];

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  async getPositions(_spaceId: string): Promise<MetaversePosition> {
    return {
      platform: this.platform,
      chain: this.chain,
      totalValueUsd: 3400,
      tokens: [{ symbol: 'GALA', balance: 120000, valueUsd: 2400, priceUsd: 0.02, change24h: 0.5 }],
      staking: [],
      land: [{ id: 'gala-land-1', platform: 'gala', valueUsd: 400, rentalStatus: 'self-use' }],
      nfts: [
        {
          id: 'gala-node-1',
          name: 'Gala Node License',
          collection: 'Gala Nodes',
          platform: 'gala',
          chain: 'galachain',
          currentValueUsd: 600,
          acquisitionCostUsd: 1200,
        },
      ],
      earnings: [
        {
          source: 'node_rewards',
          platform: 'gala',
          monthlyAmountUsd: 150,
          token: 'GALA',
          description: 'Gala Node operator rewards',
        },
        {
          source: 'p2e',
          platform: 'gala',
          monthlyAmountUsd: 40,
          token: 'GALA',
          description: 'Town Star and Spider Tanks earnings',
        },
      ],
    };
  }
}
