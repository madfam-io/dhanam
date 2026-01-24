import { apiClient } from './client';

export interface CategoryPrediction {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning: string;
  source?: 'correction' | 'fuzzy' | 'merchant' | 'keyword' | 'amount';
}

export interface CorrectionResponse {
  success: boolean;
  message: string;
}

export interface LearnedPattern {
  merchantPattern: string;
  categoryId: string;
  categoryName: string;
  correctionCount: number;
  lastCorrectedAt: string;
}

export interface CorrectionStats {
  totalCorrections: number;
  uniqueMerchants: number;
  correctionRate: number;
  topCorrectedCategories: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
}

export interface PatternStats {
  totalPatterns: number;
  avgCorrectionsPerPattern: number;
  topPatterns: Array<{
    pattern: string;
    categoryName: string;
    count: number;
  }>;
  recentPatterns: Array<{
    pattern: string;
    categoryName: string;
    lastUpdated: string;
  }>;
}

export interface CategorizationAccuracy {
  totalAutoCategorized: number;
  averageConfidence: string;
  period: string;
}

export interface MlInsights {
  period: string;
  categorization: CategorizationAccuracy;
  splits: {
    totalSplitTransactions: number;
    averageSplitAccuracy: string;
  };
  summary: {
    autoCategorizedTransactions: number;
    splitTransactions: number;
    mlSavingsEstimate: string;
  };
}

export const mlApi = {
  // Category prediction
  predictCategory: async (
    spaceId: string,
    transactionId: string
  ): Promise<CategoryPrediction | null> => {
    return apiClient.post<CategoryPrediction | null>(
      `/spaces/${spaceId}/transactions/${transactionId}/predict-category`
    );
  },

  autoCategorize: async (
    spaceId: string,
    transactionId: string
  ): Promise<{ categorized: boolean; categoryId?: string; confidence?: number }> => {
    return apiClient.post<{ categorized: boolean; categoryId?: string; confidence?: number }>(
      `/spaces/${spaceId}/transactions/${transactionId}/auto-categorize`
    );
  },

  // Category corrections (learning loop)
  correctCategory: async (
    spaceId: string,
    transactionId: string,
    categoryId: string,
    applyToFuture: boolean = true
  ): Promise<CorrectionResponse> => {
    return apiClient.post<CorrectionResponse>(
      `/spaces/${spaceId}/transactions/${transactionId}/correct-category`,
      { categoryId, applyToFuture }
    );
  },

  // Learned patterns
  getLearnedPatterns: async (spaceId: string): Promise<LearnedPattern[]> => {
    return apiClient.get<LearnedPattern[]>(`/spaces/${spaceId}/ml/learned-patterns`);
  },

  getCorrectionStats: async (spaceId: string, days: number = 30): Promise<CorrectionStats> => {
    return apiClient.get<CorrectionStats>(`/spaces/${spaceId}/ml/correction-stats`, { days });
  },

  getPatternStats: async (spaceId: string): Promise<PatternStats> => {
    return apiClient.get<PatternStats>(`/spaces/${spaceId}/ml/pattern-stats`);
  },

  // Accuracy metrics
  getCategorizationAccuracy: async (
    spaceId: string,
    days: number = 30
  ): Promise<CategorizationAccuracy> => {
    return apiClient.get<CategorizationAccuracy>(`/spaces/${spaceId}/ml/categorization-accuracy`, {
      days,
    });
  },

  // Combined insights
  getMlInsights: async (spaceId: string, days: number = 30): Promise<MlInsights> => {
    return apiClient.get<MlInsights>(`/spaces/${spaceId}/ml/insights`, { days });
  },
};
