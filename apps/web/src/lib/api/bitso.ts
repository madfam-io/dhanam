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
    const response = await apiClient.post<ConnectBitsoResponse>(
      `/providers/bitso/spaces/${spaceId}/connect`,
      data
    );
    return response.data;
  },

  /**
   * Sync Bitso portfolio
   */
  syncPortfolio: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/providers/bitso/sync');
    return response.data;
  },

  /**
   * Get Bitso portfolio summary
   */
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    const response = await apiClient.get<PortfolioSummary>('/providers/bitso/portfolio');
    return response.data;
  },

  /**
   * Get Bitso service health status
   */
  getHealth: async (): Promise<{ service: string; status: string; timestamp: string }> => {
    const response = await apiClient.get('/providers/bitso/health');
    return response.data;
  },
};