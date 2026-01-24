/**
 * DeFi Position Types
 * Supports protocols: Uniswap, Aave, Compound, Curve, Lido, etc.
 */

export type DeFiProtocol =
  | 'uniswap-v2'
  | 'uniswap-v3'
  | 'aave-v2'
  | 'aave-v3'
  | 'compound-v2'
  | 'compound-v3'
  | 'curve'
  | 'lido'
  | 'yearn'
  | 'maker'
  | 'convex'
  | 'balancer'
  | 'sushiswap'
  | 'pancakeswap'
  | 'other';

export type DeFiPositionType =
  | 'liquidity-pool'
  | 'lending'
  | 'borrowing'
  | 'staking'
  | 'farming'
  | 'vault';

export type DeFiNetwork =
  | 'ethereum'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'avalanche'
  | 'bsc';

export interface DeFiToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  balance: number;
  balanceUsd: number;
  logoUrl?: string;
}

export interface DeFiPosition {
  id: string;
  protocol: DeFiProtocol;
  network: DeFiNetwork;
  type: DeFiPositionType;
  label: string;
  tokens: DeFiToken[];
  balanceUsd: number;
  apy?: number;
  apyBase?: number;
  apyReward?: number;
  healthFactor?: number; // For lending/borrowing
  borrowedUsd?: number;
  suppliedUsd?: number;
  rewardsUsd?: number;
  rewards?: DeFiToken[];
  metadata?: Record<string, unknown>;
}

export interface DeFiPortfolio {
  address: string;
  network: DeFiNetwork;
  totalBalanceUsd: number;
  totalBorrowedUsd: number;
  netWorthUsd: number;
  positions: DeFiPosition[];
  lastUpdated: Date;
}

export interface ZapperAppBalance {
  key: string;
  address: string;
  appId: string;
  appName: string;
  appImage: string;
  network: string;
  balanceUSD: number;
  products: ZapperProduct[];
}

export interface ZapperProduct {
  label: string;
  assets: ZapperAsset[];
  meta: ZapperProductMeta[];
}

export interface ZapperAsset {
  type: string;
  network: string;
  appId: string;
  address: string;
  symbol: string;
  decimals: number;
  supply: number;
  price: number;
  pricePerShare: number;
  balanceUSD: number;
  tokens?: ZapperAsset[];
  dataProps?: {
    apy?: number;
    liquidity?: number;
    reserves?: number[];
    poolShare?: number;
  };
}

export interface ZapperProductMeta {
  label: string;
  value: number;
  type: string;
}

export interface ZapperConfig {
  apiKey: string;
  baseUrl: string;
  rateLimitPerMinute: number;
}

export interface DeFiSyncResult {
  success: boolean;
  accountId: string;
  positionsFound: number;
  totalValueUsd: number;
  error?: string;
}
