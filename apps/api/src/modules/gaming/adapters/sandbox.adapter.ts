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
export class SandboxAdapter implements MetaversePlatformAdapter {
  private readonly logger = new Logger(SandboxAdapter.name);
  readonly platform: MetaversePlatform = 'sandbox';
  readonly chain: BlockchainNetwork = 'polygon';
  readonly supportedTokens = ['SAND'];

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  async getPositions(_spaceId: string): Promise<MetaversePosition> {
    return {
      platform: this.platform,
      chain: this.chain,
      totalValueUsd: 14550,
      tokens: [{ symbol: 'SAND', balance: 15000, valueUsd: 6750, priceUsd: 0.45, change24h: 2.1 }],
      staking: [
        {
          token: 'SAND',
          amount: 15000,
          valueUsd: 6750,
          apy: 8.5,
          rewardToken: 'SAND',
          pendingRewards: 127.5,
        },
      ],
      land: [
        {
          id: 'sand-land-1',
          platform: 'sandbox',
          coordinates: '(-12, 45)',
          size: '3x3',
          valueUsd: 4350,
          rentalStatus: 'rented',
          monthlyRentalUsd: 150,
        },
        {
          id: 'sand-land-2',
          platform: 'sandbox',
          coordinates: '(8, -22)',
          size: '1x1',
          valueUsd: 1450,
          rentalStatus: 'rented',
          monthlyRentalUsd: 150,
        },
        {
          id: 'sand-land-3',
          platform: 'sandbox',
          coordinates: '(31, 17)',
          size: '1x1',
          valueUsd: 1450,
          rentalStatus: 'vacant',
        },
      ],
      nfts: [],
      earnings: [
        {
          source: 'staking',
          platform: 'sandbox',
          monthlyAmountUsd: 48,
          token: 'SAND',
          description: 'SAND staking at 8.5% APY',
        },
        {
          source: 'rental',
          platform: 'sandbox',
          monthlyAmountUsd: 135,
          token: 'SAND',
          description: 'LAND parcel rentals',
        },
        {
          source: 'creator',
          platform: 'sandbox',
          monthlyAmountUsd: 320,
          token: 'SAND',
          description: 'Game Maker revenue',
        },
      ],
    };
  }
}
