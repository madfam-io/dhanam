import { apiClient } from './client';

export interface PlatformData {
  platform: string;
  label: string;
  chain: string;
  totalValueUsd: number;
  tokensCount: number;
  stakingValueUsd: number;
  stakingApy?: number;
  landCount: number;
  nftCount: number;
  monthlyEarningsUsd: number;
}

export interface EarningsStream {
  platform: string;
  source: string;
  amountUsd: number;
  color: string;
}

export interface GuildInfo {
  platform: string;
  guildName: string;
  role: 'manager' | 'scholar' | 'owner';
  scholarCount: number;
  revenueSharePercent: number;
  monthlyIncomeUsd: number;
}

export interface ChainSummary {
  chain: string;
  totalValueUsd: number;
  platformCount: number;
  platforms: string[];
}

export interface LandParcel {
  coordinates?: string;
  size?: string;
  acquiredDate?: string;
  rentalStatus: 'rented' | 'vacant' | 'self-use';
  monthlyRental?: number;
  platform: string;
  tier?: string;
}

export interface NftAsset {
  name: string;
  collection: string;
  currentValue: number;
  acquisitionCost: number;
  platform?: string;
  chain?: string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  status: 'active' | 'passed' | 'rejected';
  dao: string;
  votedAt?: string;
  userVote?: 'for' | 'against' | 'abstain';
}

export interface AggregatedGamingPortfolio {
  platforms: PlatformData[];
  earnings: EarningsStream[];
  guilds: GuildInfo[];
  chains: ChainSummary[];
  parcels: LandParcel[];
  nfts: NftAsset[];
  proposals: GovernanceProposal[];
  totalVotesCast: number;
  votingPower: number;
  votingPowerToken: string;
}

export const gamingApi = {
  getPortfolio: (spaceId: string): Promise<AggregatedGamingPortfolio> =>
    apiClient.get<AggregatedGamingPortfolio>('/gaming/portfolio', { spaceId }),

  getPlatforms: (): Promise<PlatformData[]> =>
    apiClient.get<PlatformData[]>('/gaming/platforms'),

  getEarnings: (spaceId: string, period?: string): Promise<EarningsStream[]> =>
    apiClient.get<EarningsStream[]>('/gaming/earnings', { spaceId, period }),

  getNfts: (spaceId: string): Promise<NftAsset[]> =>
    apiClient.get<NftAsset[]>('/gaming/nfts', { spaceId }),

  getPlatformPositions: (platform: string, spaceId: string) =>
    apiClient.get(`/gaming/${platform}/positions`, { spaceId }),
};
