'use client';

import { useState, useCallback } from 'react';
import { esgApi } from '@/lib/api/esg';

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

export interface PortfolioEsgAnalysis {
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

export interface AssetComparison {
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

export interface EsgTrends {
  trending: {
    improving: string[];
    declining: string[];
  };
  recommendations: string[];
  marketInsights: string[];
  methodology: string;
  lastUpdated: string;
}

export function useEsg() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAssetScore = useCallback(async (symbol: string, assetType = 'crypto') => {
    setLoading(true);
    setError(null);
    try {
      const data = await esgApi.getAssetScore(symbol, assetType);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ESG score';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPortfolioAnalysis = useCallback(async (): Promise<PortfolioEsgAnalysis | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await esgApi.getPortfolioAnalysis();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolio ESG analysis';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const compareAssets = useCallback(async (symbols: string[]): Promise<AssetComparison | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await esgApi.compareAssets(symbols);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare assets';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTrends = useCallback(async (): Promise<EsgTrends | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await esgApi.getTrends();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ESG trends';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMethodology = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await esgApi.getMethodology();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch methodology';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAssetScore,
    getPortfolioAnalysis,
    compareAssets,
    getTrends,
    getMethodology,
  };
}
