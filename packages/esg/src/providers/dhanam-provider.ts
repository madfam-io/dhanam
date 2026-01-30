import axios, { AxiosInstance } from 'axios';
import { ESGProvider, AssetESGData, ESGScore } from '../types/esg.types';

export class DhanamESGProvider implements ESGProvider {
  public readonly name = 'Dhanam';
  private readonly client: AxiosInstance;
  private readonly cache = new Map<string, { data: AssetESGData; expires: number }>();

  constructor(
    private readonly config: {
      apiKey?: string;
      baseUrl?: string;
      cacheTTL?: number;
    } = {}
  ) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.dhanam.ai/v1',
      headers: {
        'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : undefined,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async getAssetESG(symbol: string): Promise<AssetESGData | null> {
    const cacheKey = symbol.toUpperCase();
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const response = await this.client.get(`/esg/assets/${symbol.toLowerCase()}`);
      const data = this.transformResponse(response.data);
      
      // Cache for 1 hour by default
      const ttl = this.config.cacheTTL || 3600000;
      this.cache.set(cacheKey, {
        data,
        expires: Date.now() + ttl,
      });

      return data;
    } catch (error) {
      console.warn(`Failed to fetch ESG data for ${symbol}:`, error);
      return this.getFallbackESGData(symbol);
    }
  }

  async getMultipleAssetESG(symbols: string[]): Promise<AssetESGData[]> {
    const results = await Promise.allSettled(
      symbols.map(symbol => this.getAssetESG(symbol))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<AssetESGData | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);
  }

  async refreshAssetData(symbol: string): Promise<void> {
    this.cache.delete(symbol.toUpperCase());
    await this.getAssetESG(symbol);
  }

  private transformResponse(data: any): AssetESGData {
    return {
      symbol: data.symbol?.toUpperCase() || '',
      name: data.name || '',
      score: {
        overall: data.score?.overall || 0,
        environmental: data.score?.environmental || 0,
        social: data.score?.social || 0,
        governance: data.score?.governance || 0,
        confidence: data.score?.confidence || 0,
        lastUpdated: new Date(data.score?.lastUpdated || Date.now()),
        methodology: 'Dhanam v2.0',
        sources: data.score?.sources || [],
      },
      metrics: {
        energyIntensity: data.metrics?.energyIntensity,
        carbonIntensity: data.metrics?.carbonIntensity,
        consensusMechanism: data.metrics?.consensusMechanism || 'other',
        decentralizationScore: data.metrics?.decentralizationScore,
        developerActivity: data.metrics?.developerActivity,
        communityEngagement: data.metrics?.communityEngagement,
        transparencyScore: data.metrics?.transparencyScore,
        regulatoryCompliance: data.metrics?.regulatoryCompliance,
      },
      category: data.category || 'cryptocurrency',
      marketCap: data.marketCap,
      volume24h: data.volume24h,
    };
  }

  private getFallbackESGData(symbol: string): AssetESGData {
    // Provide basic ESG scores for major cryptocurrencies when API is unavailable
    const fallbackScores: Record<string, Partial<ESGScore>> = {
      'BTC': { overall: 45, environmental: 20, social: 60, governance: 55, confidence: 80 },
      'ETH': { overall: 65, environmental: 50, social: 70, governance: 75, confidence: 85 },
      'ADA': { overall: 75, environmental: 85, social: 70, governance: 70, confidence: 75 },
      'DOT': { overall: 70, environmental: 80, social: 65, governance: 65, confidence: 70 },
      'SOL': { overall: 68, environmental: 75, social: 65, governance: 65, confidence: 70 },
      'ALGO': { overall: 80, environmental: 90, social: 75, governance: 75, confidence: 75 },
      'SAND': { overall: 68, environmental: 62, social: 75, governance: 68, confidence: 70 },
      'MANA': { overall: 65, environmental: 60, social: 72, governance: 64, confidence: 70 },
    };

    const scoreData = fallbackScores[symbol.toUpperCase()] || {
      overall: 50, environmental: 50, social: 50, governance: 50, confidence: 50
    };

    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Token`,
      score: {
        ...scoreData,
        lastUpdated: new Date(),
        methodology: 'Dhanam Fallback v1.0',
        sources: ['Fallback methodology'],
      } as ESGScore,
      metrics: {
        consensusMechanism: symbol.toUpperCase() === 'BTC' ? 'pow' : 'pos',
      },
      category: 'cryptocurrency',
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}