import { ESGManager, PortfolioHolding, PortfolioESGAnalysis, AssetESGData } from '@dhanam/esg';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Decimal } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class EnhancedEsgService implements OnModuleInit {
  private esgManager: ESGManager;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.esgManager = new ESGManager({
      caching: {
        ttl: 3600, // 1 hour cache
        maxSize: 500,
      },
      scoring: {
        weights: {
          environmental: 0.4, // Higher weight on environmental impact
          social: 0.3,
          governance: 0.3,
        },
        minimumConfidence: 60,
      },
    });
  }

  async getAssetESG(symbol: string): Promise<AssetESGData | null> {
    return this.esgManager.getAssetESG(symbol);
  }

  async getMultipleAssetESG(symbols: string[]): Promise<AssetESGData[]> {
    return this.esgManager.getMultipleAssetESG(symbols);
  }

  async getPortfolioESGAnalysis(userId: string): Promise<PortfolioESGAnalysis> {
    // Get user's crypto holdings from database
    const cryptoAccounts = await this.prisma.account.findMany({
      where: {
        type: 'crypto',
        space: {
          userSpaces: {
            some: { userId },
          },
        },
        balance: { gt: 0 },
      },
      include: {
        space: true,
      },
    });

    if (cryptoAccounts.length === 0) {
      throw new NotFoundException('No crypto holdings found for ESG analysis');
    }

    // Convert database accounts to portfolio holdings
    const holdings: PortfolioHolding[] = cryptoAccounts.map((account) => {
      const metadata = account.metadata as any;
      const symbol = metadata?.cryptoCurrency || metadata?.symbol || 'UNKNOWN';
      const balance =
        account.balance instanceof Decimal ? account.balance.toNumber() : Number(account.balance);

      // For crypto, value equals balance (assuming 1:1 for simplicity)
      // In production, you'd multiply by current market price
      const value = balance;

      return {
        symbol: symbol.toUpperCase(),
        value,
        quantity: balance,
      };
    });

    return this.esgManager.analyzePortfolio(holdings);
  }

  async getSpacePortfolioESG(spaceId: string): Promise<PortfolioESGAnalysis> {
    // Get crypto holdings for a specific space
    const cryptoAccounts = await this.prisma.account.findMany({
      where: {
        spaceId,
        type: 'crypto',
        balance: { gt: 0 },
      },
    });

    if (cryptoAccounts.length === 0) {
      throw new NotFoundException('No crypto holdings found in this space');
    }

    const holdings: PortfolioHolding[] = cryptoAccounts.map((account) => {
      const metadata = account.metadata as any;
      const symbol = metadata?.cryptoCurrency || metadata?.symbol || 'UNKNOWN';
      const balance =
        account.balance instanceof Decimal ? account.balance.toNumber() : Number(account.balance);

      return {
        symbol: symbol.toUpperCase(),
        value: balance,
        quantity: balance,
      };
    });

    return this.esgManager.analyzePortfolio(holdings);
  }

  async refreshESGData(symbols: string[]): Promise<void> {
    await this.esgManager.refreshAssetData(symbols);
  }

  async getESGTrends(): Promise<{
    trending: {
      improving: string[];
      declining: string[];
    };
    recommendations: string[];
    marketInsights: string[];
  }> {
    // Get latest ESG data for popular cryptocurrencies
    const popularCryptos = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'ALGO', 'MATIC', 'AVAX'];
    const esgData = await this.getMultipleAssetESG(popularCryptos);

    // Sort by overall score to identify trends
    const sortedByScore = esgData.sort((a, b) => b.score.overall - a.score.overall);

    const improving = sortedByScore.slice(0, 4).map((asset) => asset.symbol);
    const declining = sortedByScore.slice(-2).map((asset) => asset.symbol);

    return {
      trending: {
        improving,
        declining,
      },
      recommendations: [
        'Consider increasing allocation to Proof-of-Stake cryptocurrencies for better environmental scores',
        'Algorand (ALGO) and Cardano (ADA) lead in environmental sustainability',
        'Ethereum (ETH) significantly improved ESG profile after transitioning to Proof-of-Stake',
        'Diversification across different consensus mechanisms can improve overall portfolio governance',
      ],
      marketInsights: [
        'Proof-of-Stake networks are increasingly favored by ESG-conscious investors',
        'Environmental impact has become a key factor in institutional crypto adoption',
        'Projects with transparent governance mechanisms show better long-term performance',
        'Social impact initiatives are driving crypto adoption in emerging markets',
      ],
    };
  }

  async compareAssets(symbols: string[]): Promise<{
    comparison: AssetESGData[];
    bestPerformer: {
      overall: string;
      environmental: string;
      social: string;
      governance: string;
    };
    summary: string;
  }> {
    const esgData = await this.getMultipleAssetESG(symbols);

    if (esgData.length === 0) {
      throw new NotFoundException('No ESG data found for the provided symbols');
    }

    const bestPerformer = {
      overall: esgData.reduce((best, current) =>
        current.score.overall > best.score.overall ? current : best
      ).symbol,
      environmental: esgData.reduce((best, current) =>
        current.score.environmental > best.score.environmental ? current : best
      ).symbol,
      social: esgData.reduce((best, current) =>
        current.score.social > best.score.social ? current : best
      ).symbol,
      governance: esgData.reduce((best, current) =>
        current.score.governance > best.score.governance ? current : best
      ).symbol,
    };

    const avgScore = esgData.reduce((sum, asset) => sum + asset.score.overall, 0) / esgData.length;
    const summary = `Average ESG score: ${Math.round(avgScore)}. Best overall performer: ${bestPerformer.overall}.`;

    return {
      comparison: esgData,
      bestPerformer,
      summary,
    };
  }

  async getCacheStats() {
    return this.esgManager.getCacheStats();
  }

  async clearESGCache(): Promise<void> {
    this.esgManager.clearCache();
  }
}
