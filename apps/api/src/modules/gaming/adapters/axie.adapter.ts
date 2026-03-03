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

  isAvailable(): boolean {
    return false;
  }

  async getPositions(_spaceId: string): Promise<MetaversePosition> {
    return {
      platform: this.platform,
      chain: this.chain,
      totalValueUsd: 0,
      tokens: [],
      staking: [],
      land: [],
      nfts: [],
      earnings: [],
    };
  }
}
