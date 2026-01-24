import { apiClient } from './client';

export interface PropertyValuationSummary {
  assetId: string;
  assetName: string;
  currentValue: number;
  zestimate?: number;
  zestimateLow?: number;
  zestimateHigh?: number;
  rentEstimate?: number;
  valueChange30Day?: number;
  lastUpdated?: string;
  source: 'zillow' | 'manual';
  address: string;
}

export interface ZillowLinkResult {
  success: boolean;
  zpid?: string;
  error?: string;
}

export interface RefreshResult {
  assetId: string;
  success: boolean;
  previousValue?: number;
  newValue?: number;
  error?: string;
}

export const realEstateApi = {
  /**
   * Link a property to Zillow for automatic valuations
   */
  linkToZillow: async (spaceId: string, assetId: string): Promise<ZillowLinkResult> => {
    return apiClient.post<ZillowLinkResult>(
      `/spaces/${spaceId}/manual-assets/${assetId}/zillow/link`
    );
  },

  /**
   * Unlink a property from Zillow
   */
  unlinkFromZillow: async (spaceId: string, assetId: string): Promise<void> => {
    return apiClient.post(`/spaces/${spaceId}/manual-assets/${assetId}/zillow/unlink`);
  },

  /**
   * Manually refresh Zillow valuation for a property
   */
  refreshValuation: async (spaceId: string, assetId: string): Promise<RefreshResult> => {
    return apiClient.post<RefreshResult>(
      `/spaces/${spaceId}/manual-assets/${assetId}/zillow/refresh`
    );
  },

  /**
   * Get property valuation summary including Zestimate data
   */
  getValuationSummary: async (
    spaceId: string,
    assetId: string
  ): Promise<PropertyValuationSummary | null> => {
    return apiClient.get<PropertyValuationSummary | null>(
      `/spaces/${spaceId}/manual-assets/${assetId}/zillow/summary`
    );
  },

  /**
   * Refresh all Zillow-linked properties in a space
   */
  refreshAllValuations: async (spaceId: string): Promise<RefreshResult[]> => {
    return apiClient.post<RefreshResult[]>(
      `/spaces/${spaceId}/manual-assets/real-estate/refresh-all`
    );
  },
};
