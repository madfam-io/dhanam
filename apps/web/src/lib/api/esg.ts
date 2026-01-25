import { apiClient } from './client';

export interface EsgScore {
  symbol: string;
  assetType: 'crypto' | 'equity' | 'etf';
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  overallScore: number;
  grade: string;
  energyIntensity?: number;
  carbonFootprint?: number;
  consensusMechanism?: string;
  description?: string;
  lastUpdated: string;
}

interface PortfolioEsgAnalysis {
  overallScore: number;
  grade: string;
  breakdown: {
    environmental: number;
    social: number;
    governance: number;
  };
  holdings: Array<{
    symbol: string;
    weight: number;
    esgScore: EsgScore;
  }>;
  insights: string[];
  methodology: string;
  analysisDate: string;
}

interface AssetComparison {
  comparison: EsgScore[];
  bestPerformer: {
    overall: string;
    environmental: string;
    social: string;
    governance: string;
  };
  summary: string;
  methodology: string;
  comparisonDate: string;
}

interface EsgTrends {
  trending: {
    improving: string[];
    declining: string[];
  };
  recommendations: string[];
  marketInsights: string[];
  methodology: string;
  lastUpdated: string;
}

export interface EsgMethodology {
  framework: string;
  description: string;
  scoring: {
    environmental: {
      description: string;
      factors: string[];
      weight: string;
    };
    social: {
      description: string;
      factors: string[];
      weight: string;
    };
    governance: {
      description: string;
      factors: string[];
      weight: string;
    };
  };
  grading: Record<string, string>;
  dataSources: string[];
  limitations: string[];
  lastUpdated: string;
}

export const esgApi = {
  /**
   * Get ESG score for a specific asset
   */
  getAssetScore: async (
    symbol: string,
    assetType = 'crypto'
  ): Promise<EsgScore & { methodology: string; dataSource: string }> => {
    return apiClient.get<EsgScore & { methodology: string; dataSource: string }>(
      `/esg/score/${symbol}?assetType=${assetType}`
    );
  },

  /**
   * Get portfolio ESG analysis
   */
  getPortfolioAnalysis: async (): Promise<PortfolioEsgAnalysis> => {
    return apiClient.get<PortfolioEsgAnalysis>('/esg/portfolio');
  },

  /**
   * Compare ESG scores of multiple assets
   */
  compareAssets: async (symbols: string[]): Promise<AssetComparison> => {
    return apiClient.post<AssetComparison>('/esg/compare', { symbols });
  },

  /**
   * Get ESG trends and market insights
   */
  getTrends: async (): Promise<EsgTrends> => {
    return apiClient.get<EsgTrends>('/esg/trends');
  },

  /**
   * Get ESG scoring methodology
   */
  getMethodology: async (): Promise<EsgMethodology> => {
    return apiClient.get<EsgMethodology>('/esg/methodology');
  },

  // ===============================
  // V2 Endpoints - Enhanced ESG API
  // ===============================

  /**
   * Get ESG score for a specific asset (v2 - enhanced with more data)
   */
  getAssetScoreV2: async (
    symbol: string,
    assetType = 'crypto'
  ): Promise<EsgScore & { methodology: string; dataSource: string }> => {
    return apiClient.get<EsgScore & { methodology: string; dataSource: string }>(
      `/esg/v2/score/${symbol}?assetType=${assetType}`
    );
  },

  /**
   * Get portfolio ESG analysis (v2 - enhanced with more insights)
   */
  getPortfolioAnalysisV2: async (): Promise<PortfolioEsgAnalysis> => {
    return apiClient.get<PortfolioEsgAnalysis>('/esg/v2/portfolio');
  },

  /**
   * Get portfolio ESG analysis for a specific space (v2)
   */
  getSpacePortfolioV2: async (spaceId: string): Promise<PortfolioEsgAnalysis> => {
    return apiClient.get<PortfolioEsgAnalysis>(`/esg/v2/spaces/${spaceId}/portfolio`);
  },

  /**
   * Compare ESG scores of multiple assets (v2 - supports up to 20 symbols)
   */
  compareAssetsV2: async (symbols: string[]): Promise<AssetComparison> => {
    return apiClient.post<AssetComparison>('/esg/v2/compare', { symbols });
  },

  /**
   * Get ESG trends and market insights (v2)
   */
  getTrendsV2: async (): Promise<EsgTrends> => {
    return apiClient.get<EsgTrends>('/esg/v2/trends');
  },

  /**
   * Refresh ESG data for specific symbols
   */
  refreshESGData: async (symbols: string[]): Promise<{ refreshed: string[]; errors: string[] }> => {
    return apiClient.post<{ refreshed: string[]; errors: string[] }>('/esg/v2/refresh', {
      symbols,
    });
  },

  /**
   * Get ESG cache statistics (admin/debugging)
   */
  getCacheStats: async (): Promise<{
    totalEntries: number;
    cacheHitRate: number;
    lastRefresh: string;
    staleEntries: number;
  }> => {
    return apiClient.get('/esg/v2/cache/stats');
  },

  /**
   * Clear ESG cache (admin operation)
   */
  clearCache: async (): Promise<{ message: string; entriesCleared: number }> => {
    return apiClient.post<{ message: string; entriesCleared: number }>('/esg/v2/cache/clear');
  },
};
