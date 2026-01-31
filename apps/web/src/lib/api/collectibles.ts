import { apiClient } from './client';

export interface CollectibleCategory {
  id: string;
  name: string;
  slug: string;
  providerCount: number;
}

export interface CollectibleSearchResult {
  externalId: string;
  name: string;
  image?: string;
  marketValue?: number;
  provider: string;
  category: string;
}

export interface LinkCollectibleDto {
  category: string;
  provider: string;
  externalId: string;
}

export interface CollectibleValuation {
  assetId: string;
  provider: string;
  category: string;
  externalId: string;
  marketValue?: number;
  marketValueLow?: number;
  marketValueHigh?: number;
  lastSyncedAt?: string;
  valuationEnabled: boolean;
}

export const collectiblesApi = {
  getCategories: (spaceId: string): Promise<CollectibleCategory[]> =>
    apiClient.get<CollectibleCategory[]>(
      `/spaces/${spaceId}/manual-assets/collectibles/categories`
    ),

  search: (
    spaceId: string,
    category: string,
    q: string,
    limit = 20
  ): Promise<CollectibleSearchResult[]> =>
    apiClient.get<CollectibleSearchResult[]>(
      `/spaces/${spaceId}/manual-assets/collectibles/search`,
      { category, q, limit }
    ),

  link: (
    spaceId: string,
    assetId: string,
    data: LinkCollectibleDto
  ): Promise<CollectibleValuation> =>
    apiClient.post<CollectibleValuation>(
      `/spaces/${spaceId}/manual-assets/${assetId}/collectible/link`,
      data
    ),

  unlink: (spaceId: string, assetId: string): Promise<void> =>
    apiClient.post(`/spaces/${spaceId}/manual-assets/${assetId}/collectible/unlink`),

  refresh: (spaceId: string, assetId: string): Promise<CollectibleValuation> =>
    apiClient.post<CollectibleValuation>(
      `/spaces/${spaceId}/manual-assets/${assetId}/collectible/refresh`
    ),

  getValuation: (spaceId: string, assetId: string): Promise<CollectibleValuation | null> =>
    apiClient.get<CollectibleValuation | null>(
      `/spaces/${spaceId}/manual-assets/${assetId}/collectible/valuation`
    ),
};
