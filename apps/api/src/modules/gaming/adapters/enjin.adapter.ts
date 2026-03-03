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
