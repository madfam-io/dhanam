import { apiClient } from './client';

interface PlaidLinkToken {
  linkToken: string;
  expiration: string;
}

interface PlaidLinkRequest {
  publicToken: string;
  externalId?: string;
  accountIds?: string[];
}

interface PlaidLinkResponse {
  message: string;
  accountsCount: number;
  accounts: any[];
}

export const plaidApi = {
  /**
   * Create a Plaid Link token for initializing Plaid Link
   */
  createLinkToken: async (): Promise<PlaidLinkToken> => {
    const response = await apiClient.post<PlaidLinkToken>('/providers/plaid/link-token');
    return response.data;
  },

  /**
   * Link a Plaid account to a space
   */
  linkAccount: async (spaceId: string, data: PlaidLinkRequest): Promise<PlaidLinkResponse> => {
    const response = await apiClient.post<PlaidLinkResponse>(
      `/providers/plaid/spaces/${spaceId}/link`,
      data
    );
    return response.data;
  },

  /**
   * Get Plaid service health status
   */
  getHealth: async (): Promise<{ service: string; status: string; timestamp: string }> => {
    const response = await apiClient.get('/providers/plaid/health');
    return response.data;
  },
};