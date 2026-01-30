import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../core/redis/redis.service';

export interface SandboxLandFloorPrice {
  floorPriceUsd: number;
  floorPriceEth: number;
  change24h: number;
  totalListings: number;
  lastUpdated: Date;
}

export interface SandboxStakingApy {
  currentApy: number;
  totalStakedSand: number;
  rewardsDistributed24h: number;
  lastUpdated: Date;
}

export interface GamingPositionSummary {
  totalGamingAssetsUsd: number;
  sandStaked: number;
  sandStakingApy: number;
  monthlyStakingReward: number;
  activeLandParcels: number;
  landValueUsd: number;
  monthlyRentalIncome: number;
  nftCount: number;
  nftValueUsd: number;
  monthlyGamingIncome: number;
  positions: {
    type: string;
    label: string;
    valueUsd: number;
    metadata: Record<string, unknown>;
  }[];
}

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);
  private readonly CACHE_TTL = 900; // 15 minutes

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService
  ) {}

  async getLandFloorPrice(): Promise<SandboxLandFloorPrice> {
    const cacheKey = 'gaming:sandbox:land-floor-price';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Fetch from The Sandbox API / OpenSea — fallback to mock data for now
    const data = await this.fetchLandFloorPrice();

    await this.redis.set(cacheKey, JSON.stringify(data), this.CACHE_TTL);
    return data;
  }

  async getStakingApy(): Promise<SandboxStakingApy> {
    const cacheKey = 'gaming:sandbox:staking-apy';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await this.fetchStakingApy();

    await this.redis.set(cacheKey, JSON.stringify(data), this.CACHE_TTL);
    return data;
  }

  async getGamingPositions(spaceId: string): Promise<GamingPositionSummary> {
    const cacheKey = `gaming:positions:${spaceId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const summary = await this.aggregateGamingPositions(spaceId);

    await this.redis.set(cacheKey, JSON.stringify(summary), this.CACHE_TTL);
    return summary;
  }

  private async fetchLandFloorPrice(): Promise<SandboxLandFloorPrice> {
    // TODO: Integrate with The Sandbox / OpenSea API when available
    // Using realistic mock data based on current market conditions
    return {
      floorPriceUsd: 1450,
      floorPriceEth: 0.42,
      change24h: 3.2,
      totalListings: 2847,
      lastUpdated: new Date(),
    };
  }

  private async fetchStakingApy(): Promise<SandboxStakingApy> {
    // TODO: Integrate with The Sandbox staking contract
    return {
      currentApy: 8.5,
      totalStakedSand: 450_000_000,
      rewardsDistributed24h: 104_795,
      lastUpdated: new Date(),
    };
  }

  private async aggregateGamingPositions(_spaceId: string): Promise<GamingPositionSummary> {
    // Aggregate from account metadata for gaming-type accounts
    // In production, this would query the DB and enrich with live API data
    const landFloor = await this.getLandFloorPrice();
    const staking = await this.getStakingApy();

    const sandStaked = 15000;
    const sandPrice = 0.45; // Would come from price feed
    const monthlyStakingReward = (sandStaked * (staking.currentApy / 100)) / 12;
    const activeLandParcels = 5;
    const landValueUsd = activeLandParcels * landFloor.floorPriceUsd;
    const monthlyRentalIncome = 300; // 2 parcels rented at 150 SAND/month
    const nftCount = 14; // BAYC + wearables + ENS
    const nftValueUsd = 18500 + 850 + 3200;

    const positions = [
      {
        type: 'staking',
        label: 'SAND Staking',
        valueUsd: sandStaked * sandPrice,
        metadata: { sandAmount: sandStaked, apy: staking.currentApy },
      },
      {
        type: 'land',
        label: 'LAND Portfolio',
        valueUsd: landValueUsd,
        metadata: { parcels: activeLandParcels, floorPrice: landFloor.floorPriceUsd },
      },
      {
        type: 'nft',
        label: 'NFT Collection',
        valueUsd: nftValueUsd,
        metadata: { count: nftCount },
      },
    ];

    const totalGamingAssetsUsd = positions.reduce((sum, p) => sum + p.valueUsd, 0);
    const monthlyGamingIncome =
      monthlyStakingReward * sandPrice + monthlyRentalIncome * sandPrice + 320; // + creator revenue

    return {
      totalGamingAssetsUsd,
      sandStaked,
      sandStakingApy: staking.currentApy,
      monthlyStakingReward,
      activeLandParcels,
      landValueUsd,
      monthlyRentalIncome,
      nftCount,
      nftValueUsd,
      monthlyGamingIncome,
      positions,
    };
  }
}
