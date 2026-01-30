export type MetaversePlatform =
  | 'sandbox'
  | 'decentraland'
  | 'axie'
  | 'illuvium'
  | 'star-atlas'
  | 'gala'
  | 'enjin'
  | 'immutable';

export type BlockchainNetwork =
  | 'ethereum'
  | 'polygon'
  | 'ronin'
  | 'solana'
  | 'galachain'
  | 'immutable-zkevm'
  | 'arbitrum';

export interface MetaversePosition {
  platform: MetaversePlatform;
  chain: BlockchainNetwork;
  totalValueUsd: number;
  tokens: TokenBalance[];
  staking: StakingPosition[];
  land: LandAsset[];
  nfts: NftAsset[];
  earnings: EarningsStream[];
  guild?: GuildPosition;
}

export interface TokenBalance {
  symbol: string;
  balance: number;
  valueUsd: number;
  priceUsd: number;
  change24h?: number;
}

export interface StakingPosition {
  token: string;
  amount: number;
  valueUsd: number;
  apy: number;
  unlockDate?: Date;
  rewardToken?: string;
  pendingRewards?: number;
}

export interface LandAsset {
  id: string;
  platform: MetaversePlatform;
  coordinates?: string;
  size?: string;
  valueUsd: number;
  rentalStatus?: 'rented' | 'vacant' | 'self-use';
  monthlyRentalUsd?: number;
  tier?: string;
}

export interface NftAsset {
  id: string;
  name: string;
  collection: string;
  platform: MetaversePlatform;
  chain: BlockchainNetwork;
  currentValueUsd: number;
  acquisitionCostUsd: number;
  floorPriceUsd?: number;
  meltValue?: number; // Enjin-specific
}

export interface EarningsStream {
  source: 'staking' | 'rental' | 'p2e' | 'creator' | 'scholarship' | 'node_rewards' | 'marketplace';
  platform: MetaversePlatform;
  monthlyAmountUsd: number;
  token?: string;
  description?: string;
}

export interface GuildPosition {
  guildName: string;
  role: 'owner' | 'manager' | 'scholar';
  scholarCount?: number;
  revenueSharePercent?: number;
  monthlyGuildIncomeUsd?: number;
  treasuryValueUsd?: number;
}

export interface MetaversePlatformAdapter {
  readonly platform: MetaversePlatform;
  readonly chain: BlockchainNetwork;
  readonly supportedTokens: string[];

  getPositions(spaceId: string): Promise<MetaversePosition>;
}

export interface AggregatedGamingPortfolio {
  totalValueUsd: number;
  totalMonthlyIncomeUsd: number;
  platformsConnected: number;
  totalNftsOwned: number;
  positions: MetaversePosition[];
  earningsByPlatform: Record<MetaversePlatform, number>;
  earningsBySource: Record<EarningsStream['source'], number>;
  chainBreakdown: Record<BlockchainNetwork, number>;
}
