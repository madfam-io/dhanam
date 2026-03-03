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
