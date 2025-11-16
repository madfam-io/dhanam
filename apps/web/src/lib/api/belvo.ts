import { apiClient } from './client';

interface BelvoLinkRequest {
  institution: string;
  username: string;
  password: string;
  externalId?: string;
}

interface BelvoLinkResponse {
  message: string;
  accountsCount: number;
  accounts: Array<Record<string, unknown>>;
}

export const belvoApi = {
  /**
   * Link a Mexican bank account via Belvo
   */
  linkAccount: async (spaceId: string, data: BelvoLinkRequest): Promise<BelvoLinkResponse> => {
    return apiClient.post<BelvoLinkResponse>(`/providers/belvo/spaces/${spaceId}/link`, data);
  },

  /**
   * Get Belvo service health status
   */
  getHealth: async (): Promise<{ service: string; status: string; timestamp: string }> => {
    return apiClient.get<{ service: string; status: string; timestamp: string }>(
      '/providers/belvo/health'
    );
  },
};
