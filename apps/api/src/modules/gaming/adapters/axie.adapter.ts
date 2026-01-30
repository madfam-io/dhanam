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
export class AxieAdapter implements MetaversePlatformAdapter {
  private readonly logger = new Logger(AxieAdapter.name);
  readonly platform: MetaversePlatform = 'axie';
  readonly chain: BlockchainNetwork = 'ronin';
  readonly supportedTokens = ['AXS', 'SLP', 'RONIN'];

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  async getPositions(_spaceId: string): Promise<MetaversePosition> {
    return {
      platform: this.platform,
      chain: this.chain,
      totalValueUsd: 4850,
      tokens: [
        { symbol: 'AXS', balance: 320, valueUsd: 2240, priceUsd: 7.0, change24h: -1.5 },
        { symbol: 'SLP', balance: 85000, valueUsd: 255, priceUsd: 0.003, change24h: 0.8 },
      ],
      staking: [
        {
          token: 'AXS',
          amount: 200,
          valueUsd: 1400,
          apy: 42,
          rewardToken: 'AXS',
          pendingRewards: 4.2,
        },
      ],
      land: [],
      nfts: [
        {
          id: 'axie-1',
          name: 'Axie #12451 (Aqua)',
          collection: 'Axie Infinity',
          platform: 'axie',
          chain: 'ronin',
          currentValueUsd: 120,
          acquisitionCostUsd: 250,
        },
        {
          id: 'axie-2',
          name: 'Axie #8923 (Plant)',
          collection: 'Axie Infinity',
          platform: 'axie',
          chain: 'ronin',
          currentValueUsd: 85,
          acquisitionCostUsd: 180,
        },
        {
          id: 'axie-3',
          name: 'Axie #31020 (Beast)',
          collection: 'Axie Infinity',
          platform: 'axie',
          chain: 'ronin',
          currentValueUsd: 750,
          acquisitionCostUsd: 400,
        },
      ],
      earnings: [
        {
          source: 'scholarship',
          platform: 'axie',
          monthlyAmountUsd: 200,
          token: 'SLP',
          description: 'Scholarship manager — 5 scholars at 70/30 split',
        },
        {
          source: 'staking',
          platform: 'axie',
          monthlyAmountUsd: 49,
          token: 'AXS',
          description: 'AXS staking at 42% APY',
        },
        {
          source: 'p2e',
          platform: 'axie',
          monthlyAmountUsd: 35,
          token: 'SLP',
          description: 'Personal gameplay earnings',
        },
      ],
      guild: {
        guildName: 'Ronin Raiders',
        role: 'manager',
        scholarCount: 5,
        revenueSharePercent: 30,
        monthlyGuildIncomeUsd: 200,
      },
    };
  }
}
