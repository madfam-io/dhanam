import { apiClient } from './client';

interface ConnectBitsoRequest {
  apiKey: string;
  apiSecret: string;
  externalId?: string;
  autoSync?: boolean;
}

interface ConnectBitsoResponse {
  message: string;
  accountsCount: number;
  accounts: any[];
}

interface PortfolioSummary {
  totalValue: number;
  currency: string;
  lastUpdated: string;
  holdings: Array<{
    currency: string;
    amount: number;
    value: number;
    percentage: number;
  }>;
}

export const bitsoApi = {
  /**
   * Connect a Bitso account to a space
   */
  connectAccount: async (
    spaceId: string, 
    data: ConnectBitsoRequest
  ): Promise<ConnectBitsoResponse> => {
    return apiClient.post<ConnectBitsoResponse>(
      `/providers/bitso/spaces/${spaceId}/connect`,
      data
    );
  },

  /**
   * Sync Bitso portfolio
   */
  syncPortfolio: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/providers/bitso/sync');
  },

  /**
   * Get Bitso portfolio summary
   */
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    return apiClient.get<PortfolioSummary>('/providers/bitso/portfolio');
  },

  /**
   * Get Bitso service health status
   */
  getHealth: async (): Promise<{ service: string; status: string; timestamp: string }> => {
    return apiClient.get<{ service: string; status: string; timestamp: string }>('/providers/bitso/health');
  },
};