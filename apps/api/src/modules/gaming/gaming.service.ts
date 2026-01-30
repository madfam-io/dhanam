import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../core/redis/redis.service';

import { AxieAdapter } from './adapters/axie.adapter';
import { EnjinAdapter } from './adapters/enjin.adapter';
import { GalaAdapter } from './adapters/gala.adapter';
import { IlluviumAdapter } from './adapters/illuvium.adapter';
import { ImmutableAdapter } from './adapters/immutable.adapter';
import { SandboxAdapter } from './adapters/sandbox.adapter';
import { StarAtlasAdapter } from './adapters/star-atlas.adapter';
import {
  MetaversePlatform,
  MetaversePosition,
  AggregatedGamingPortfolio,
  EarningsStream,
  BlockchainNetwork,
  MetaversePlatformAdapter,
} from './interfaces/platform.interface';

@Injectable()
export class GamingService {
  private readonly logger = new Logger(GamingService.name);
  private readonly CACHE_TTL = 900; // 15 minutes
  private readonly adapters: MetaversePlatformAdapter[];

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly sandboxAdapter: SandboxAdapter,
    private readonly axieAdapter: AxieAdapter,
    private readonly illuviumAdapter: IlluviumAdapter,
    private readonly starAtlasAdapter: StarAtlasAdapter,
    private readonly galaAdapter: GalaAdapter,
    private readonly enjinAdapter: EnjinAdapter,
    private readonly immutableAdapter: ImmutableAdapter
  ) {
    this.adapters = [
      sandboxAdapter,
      axieAdapter,
      illuviumAdapter,
      starAtlasAdapter,
      galaAdapter,
      enjinAdapter,
      immutableAdapter,
    ];
  }

  async getAggregatedPortfolio(spaceId: string): Promise<AggregatedGamingPortfolio> {
    const cacheKey = `gaming:portfolio:${spaceId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const positions = await Promise.allSettled(
      this.adapters.map((adapter) => adapter.getPositions(spaceId))
    );

    const resolved = positions
      .filter(
        (r): r is PromiseFulfilledResult<MetaversePosition> =>
          r.status === 'fulfilled' && r.value.totalValueUsd > 0
      )
      .map((r) => r.value);

    const portfolio = this.aggregatePositions(resolved);

    await this.redis.set(cacheKey, JSON.stringify(portfolio), this.CACHE_TTL);
    return portfolio;
  }

  async getPlatformPositions(
    platform: MetaversePlatform,
    spaceId: string
  ): Promise<MetaversePosition> {
    const adapter = this.adapters.find((a) => a.platform === platform);
    if (!adapter) {
      return {
        platform,
        chain: 'ethereum',
        totalValueUsd: 0,
        tokens: [],
        staking: [],
        land: [],
        nfts: [],
        earnings: [],
      };
    }
    return adapter.getPositions(spaceId);
  }

  getSupportedPlatforms(): Array<{
    platform: MetaversePlatform;
    chain: BlockchainNetwork;
    tokens: string[];
  }> {
    return this.adapters.map((a) => ({
      platform: a.platform,
      chain: a.chain,
      tokens: a.supportedTokens,
    }));
  }

  async getEarnings(
    spaceId: string,
    _period?: string
  ): Promise<{
    totalMonthlyUsd: number;
    byPlatform: Record<string, number>;
    bySource: Record<string, number>;
    streams: EarningsStream[];
  }> {
    const portfolio = await this.getAggregatedPortfolio(spaceId);
    const streams = portfolio.positions.flatMap((p) => p.earnings);

    return {
      totalMonthlyUsd: portfolio.totalMonthlyIncomeUsd,
      byPlatform: portfolio.earningsByPlatform as Record<string, number>,
      bySource: portfolio.earningsBySource as Record<string, number>,
      streams,
    };
  }

  async getNftInventory(spaceId: string): Promise<{
    totalValueUsd: number;
    totalCount: number;
    items: Array<{
      platform: MetaversePlatform;
      name: string;
      collection: string;
      valueUsd: number;
      chain: BlockchainNetwork;
    }>;
  }> {
    const portfolio = await this.getAggregatedPortfolio(spaceId);
    const items = portfolio.positions.flatMap((p) =>
      p.nfts.map((nft) => ({
        platform: p.platform,
        name: nft.name,
        collection: nft.collection,
        valueUsd: nft.currentValueUsd,
        chain: p.chain,
      }))
    );

    return {
      totalValueUsd: items.reduce((sum, i) => sum + i.valueUsd, 0),
      totalCount: items.length,
      items,
    };
  }

  private aggregatePositions(positions: MetaversePosition[]): AggregatedGamingPortfolio {
    const earningsByPlatform = {} as Record<MetaversePlatform, number>;
    const earningsBySource = {} as Record<EarningsStream['source'], number>;
    const chainBreakdown = {} as Record<BlockchainNetwork, number>;

    for (const pos of positions) {
      // Earnings by platform
      const platformEarnings = pos.earnings.reduce((s, e) => s + e.monthlyAmountUsd, 0);
      earningsByPlatform[pos.platform] = (earningsByPlatform[pos.platform] || 0) + platformEarnings;

      // Earnings by source
      for (const e of pos.earnings) {
        earningsBySource[e.source] = (earningsBySource[e.source] || 0) + e.monthlyAmountUsd;
      }

      // Chain breakdown
      chainBreakdown[pos.chain] = (chainBreakdown[pos.chain] || 0) + pos.totalValueUsd;
    }

    return {
      totalValueUsd: positions.reduce((s, p) => s + p.totalValueUsd, 0),
      totalMonthlyIncomeUsd: Object.values(earningsByPlatform).reduce((s, v) => s + v, 0),
      platformsConnected: positions.length,
      totalNftsOwned: positions.reduce((s, p) => s + p.nfts.length, 0),
      positions,
      earningsByPlatform,
      earningsBySource,
      chainBreakdown,
    };
  }
}
