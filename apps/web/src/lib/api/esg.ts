import { apiClient } from './client';

interface EsgScore {
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

interface EsgMethodology {
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
  getAssetScore: async (symbol: string, assetType = 'crypto'): Promise<EsgScore & { methodology: string; dataSource: string }> => {
    const response = await apiClient.get(`/esg/score/${symbol}?assetType=${assetType}`);
    return response.data;
  },

  /**
   * Get portfolio ESG analysis
   */
  getPortfolioAnalysis: async (): Promise<PortfolioEsgAnalysis> => {
    const response = await apiClient.get<PortfolioEsgAnalysis>('/esg/portfolio');
    return response.data;
  },

  /**
   * Compare ESG scores of multiple assets
   */
  compareAssets: async (symbols: string[]): Promise<AssetComparison> => {
    const response = await apiClient.post<AssetComparison>('/esg/compare', { symbols });
    return response.data;
  },

  /**
   * Get ESG trends and market insights
   */
  getTrends: async (): Promise<EsgTrends> => {
    const response = await apiClient.get<EsgTrends>('/esg/trends');
    return response.data;
  },

  /**
   * Get ESG scoring methodology
   */
  getMethodology: async (): Promise<EsgMethodology> => {
    const response = await apiClient.get<EsgMethodology>('/esg/methodology');
    return response.data;
  },
};