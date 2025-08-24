import { apiClient } from './client';

interface CategorizationResult {
  message: string;
  categorized: number;
  total: number;
  spaces?: number;
}

interface PortfolioSyncResult {
  message: string;
  syncedUsers: number;
  errors: number;
}

export const jobsApi = {
  /**
   * Trigger transaction categorization for a specific space
   */
  triggerCategorization: async (spaceId: string): Promise<CategorizationResult> => {
    return apiClient.post<CategorizationResult>(`/jobs/categorize/${spaceId}`);
  },

  /**
   * Trigger transaction categorization for all spaces (admin only)
   */
  triggerGlobalCategorization: async (): Promise<CategorizationResult> => {
    return apiClient.post<CategorizationResult>('/jobs/categorize');
  },

  /**
   * Trigger portfolio sync for current user
   */
  triggerPortfolioSync: async (): Promise<PortfolioSyncResult> => {
    return apiClient.post<PortfolioSyncResult>('/jobs/sync-portfolio');
  },

  /**
   * Trigger portfolio sync for all users (admin only)
   */
  triggerGlobalPortfolioSync: async (): Promise<PortfolioSyncResult> => {
    return apiClient.post<PortfolioSyncResult>('/jobs/sync-portfolio/all');
  },
};
