import { apiClient } from './client';

// Types
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
  protocol: string;
  network: string;
  type: 'liquidity-pool' | 'lending' | 'borrowing' | 'staking' | 'farming' | 'vault';
  label: string;
  tokens: DeFiToken[];
  balanceUsd: number;
  apy?: number;
  healthFactor?: number;
  borrowedUsd?: number;
  suppliedUsd?: number;
}

export interface DeFiAccountSummary {
  accountId: string;
  accountName: string;
  walletAddress: string;
  network: string;
  totalValueUsd: number;
  positionCount: number;
  lastSyncedAt?: string;
  positions: DeFiPosition[];
}

export interface SpaceDeFiSummary {
  totalValueUsd: number;
  totalBorrowedUsd: number;
  netWorthUsd: number;
  positionCount: number;
  accounts: DeFiAccountSummary[];
  byProtocol: Record<string, { valueUsd: number; count: number }>;
  byType: Record<string, { valueUsd: number; count: number }>;
}

export interface DeFiSyncResult {
  success: boolean;
  accountId: string;
  positionsFound: number;
  totalValueUsd: number;
  error?: string;
}

export interface DeFiStatus {
  available: boolean;
  supportedProtocols: string[];
  supportedNetworks: string[];
}

// API functions
export async function getDeFiStatus(spaceId: string): Promise<DeFiStatus> {
  return apiClient.get<DeFiStatus>(`/spaces/${spaceId}/defi/status`);
}

export async function getSpaceDeFiSummary(spaceId: string): Promise<SpaceDeFiSummary> {
  return apiClient.get<SpaceDeFiSummary>(`/spaces/${spaceId}/defi/summary`);
}

export async function getAccountDeFiPositions(
  spaceId: string,
  accountId: string
): Promise<DeFiAccountSummary | null> {
  return apiClient.get<DeFiAccountSummary | null>(`/spaces/${spaceId}/defi/accounts/${accountId}`);
}

export async function syncAccountDeFiPositions(
  spaceId: string,
  accountId: string
): Promise<DeFiSyncResult> {
  return apiClient.post<DeFiSyncResult>(`/spaces/${spaceId}/defi/accounts/${accountId}/sync`);
}

export async function syncAllDeFiPositions(spaceId: string): Promise<DeFiSyncResult[]> {
  return apiClient.post<DeFiSyncResult[]>(`/spaces/${spaceId}/defi/sync-all`);
}
