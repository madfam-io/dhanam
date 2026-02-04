import { Injectable, NotFoundException } from '@nestjs/common';

import { Decimal } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';

// Dhanam ESG data (based on the Dhanam package)
const DHANAM_ESG_DATA = {
  // Cryptocurrency ESG scores
  crypto: {
    BTC: {
      environmental: 15, // Low due to energy-intensive PoW
      social: 75, // High financial inclusion
      governance: 85, // Decentralized, transparent
      overall: 58,
      grade: 'C',
      energyIntensity: 707000, // kWh per transaction
      carbonFootprint: 357000, // kg CO2 per transaction
      consensusMechanism: 'Proof of Work',
      description: 'High energy consumption but excellent decentralization',
    },
    ETH: {
      environmental: 85, // High due to PoS transition
      social: 82, // Smart contracts enable DeFi
      governance: 78, // Ethereum Foundation influence
      overall: 82,
      grade: 'A-',
      energyIntensity: 62.6, // kWh per transaction (post-merge)
      carbonFootprint: 31.3, // kg CO2 per transaction
      consensusMechanism: 'Proof of Stake',
      description: 'Excellent environmental profile post-merge',
    },
    ADA: {
      environmental: 95, // Most energy-efficient
      social: 80, // Focus on developing countries
      governance: 88, // Peer-reviewed research
      overall: 88,
      grade: 'A',
      energyIntensity: 0.5479, // kWh per transaction
      carbonFootprint: 0.27, // kg CO2 per transaction
      consensusMechanism: 'Proof of Stake',
      description: 'Highest environmental score, peer-reviewed approach',
    },
    DOT: {
      environmental: 90, // Nominated PoS
      social: 75, // Interoperability focus
      governance: 82, // On-chain governance
      overall: 82,
      grade: 'A-',
      energyIntensity: 4.37, // kWh per transaction
      carbonFootprint: 2.18, // kg CO2 per transaction
      consensusMechanism: 'Nominated Proof of Stake',
      description: 'Low energy consumption with strong governance',
    },
    SOL: {
      environmental: 88, // Proof of History + PoS
      social: 78, // Fast, cheap transactions
      governance: 72, // More centralized validators
      overall: 79,
      grade: 'B+',
      energyIntensity: 1.837, // kWh per transaction
      carbonFootprint: 0.918, // kg CO2 per transaction
      consensusMechanism: 'Proof of History + Proof of Stake',
      description: 'Good environmental profile, some centralization concerns',
    },
    XRP: {
      environmental: 92, // Ripple Protocol Consensus
      social: 70, // Centralized nature limits inclusion
      governance: 65, // Ripple Inc. control
      overall: 76,
      grade: 'B+',
      energyIntensity: 0.0079, // kWh per transaction
      carbonFootprint: 0.004, // kg CO2 per transaction
      consensusMechanism: 'Ripple Protocol Consensus',
      description: 'Very low environmental impact, governance concerns',
    },
    LTC: {
      environmental: 25, // PoW like Bitcoin
      social: 72, // Digital silver narrative
      governance: 80, // Decentralized development
      overall: 59,
      grade: 'C',
      energyIntensity: 18620, // kWh per transaction
      carbonFootprint: 9310, // kg CO2 per transaction
      consensusMechanism: 'Proof of Work',
      description: 'Similar to Bitcoin but more efficient',
    },
    ALGO: {
      environmental: 98, // Carbon negative
      social: 85, // Financial inclusion focus
      governance: 85, // Pure PoS
      overall: 89,
      grade: 'A',
      energyIntensity: 0.0002808, // kWh per transaction
      carbonFootprint: 0.0001404, // kg CO2 per transaction
      consensusMechanism: 'Pure Proof of Stake',
      description: 'Carbon negative, highest environmental rating',
    },
    MATIC: {
      environmental: 87, // Polygon PoS
      social: 80, // Ethereum scaling
      governance: 78, // Community governance
      overall: 82,
      grade: 'A-',
      energyIntensity: 0.00079, // kWh per transaction
      carbonFootprint: 0.0004, // kg CO2 per transaction
      consensusMechanism: 'Proof of Stake',
      description: 'Low environmental impact with Ethereum compatibility',
    },
    AVAX: {
      environmental: 85, // Avalanche consensus
      social: 78, // DeFi ecosystem
      governance: 80, // Subnet governance
      overall: 81,
      grade: 'B+',
      energyIntensity: 4.6, // kWh per transaction
      carbonFootprint: 2.3, // kg CO2 per transaction
      consensusMechanism: 'Avalanche Consensus',
      description: 'Good environmental profile with unique consensus',
    },
    SAND: {
      environmental: 62, // Polygon PoS sidechain, moderate energy
      social: 75, // Creator economy, community governance, gaming accessibility
      governance: 68, // DAO governance, transparent tokenomics
      overall: 68,
      grade: 'C+',
      energyIntensity: 0.001, // kWh per transaction (Polygon PoS)
      carbonFootprint: 0.0005, // kg CO2 per transaction
      consensusMechanism: 'Polygon Proof of Stake',
      description: 'Gaming metaverse with creator economy on Polygon L2, DAO-governed',
    },
    MANA: {
      environmental: 60, // Ethereum L1, higher energy than L2
      social: 72, // Virtual world with social features, DAO governance
      governance: 64, // Decentraland DAO, community-driven
      overall: 65,
      grade: 'C+',
      energyIntensity: 62.6, // kWh per transaction (Ethereum L1)
      carbonFootprint: 31.3, // kg CO2 per transaction
      consensusMechanism: 'Ethereum Proof of Stake',
      description: 'Decentraland virtual world with DAO governance on Ethereum',
    },
    AXS: {
      environmental: 55, // Ronin sidechain, lower energy than L1
      social: 78, // P2E pioneer, scholarship economy, emerging market access
      governance: 60, // Sky Mavis controlled, transitioning to community governance
      overall: 62,
      grade: 'C',
      energyIntensity: 0.003, // kWh per transaction (Ronin PoA)
      carbonFootprint: 0.0015, // kg CO2 per transaction
      consensusMechanism: 'Ronin Proof of Authority',
      description: 'Axie Infinity governance token on Ronin sidechain, P2E pioneer',
    },
    SLP: {
      environmental: 50, // Ronin sidechain, high transaction volume
      social: 72, // Earnings token for players in emerging markets
      governance: 48, // Utility token, limited governance role
      overall: 55,
      grade: 'C-',
      energyIntensity: 0.003, // kWh per transaction (Ronin)
      carbonFootprint: 0.0015, // kg CO2 per transaction
      consensusMechanism: 'Ronin Proof of Authority',
      description: 'Smooth Love Potion — Axie Infinity in-game earnings token',
    },
    GALA: {
      environmental: 52, // GalaChain, node-based architecture
      social: 70, // Multi-game ecosystem, node operators rewarded
      governance: 55, // Gala Games centralized control, node voting
      overall: 58,
      grade: 'C',
      energyIntensity: 0.02, // kWh per transaction (GalaChain)
      carbonFootprint: 0.01, // kg CO2 per transaction
      consensusMechanism: 'GalaChain Proof of Work/Stake Hybrid',
      description: 'Gala Games multi-title ecosystem with node reward structure',
    },
    ILV: {
      environmental: 58, // Ethereum L1 + Immutable X L2
      social: 74, // AAA gaming, revenue distribution staking
      governance: 62, // Illuvium DAO governance, council-based
      overall: 64,
      grade: 'C+',
      energyIntensity: 0.005, // kWh per transaction (Immutable X)
      carbonFootprint: 0.0025, // kg CO2 per transaction
      consensusMechanism: 'Ethereum PoS + Immutable X zk-rollup',
      description: 'Illuvium AAA gaming with revenue distribution staking and DAO governance',
    },
    IMX: {
      environmental: 78, // zkEVM rollup, carbon-neutral commitment
      social: 72, // NFT gaming infrastructure, zero gas fees for users
      governance: 68, // Immutable council governance, ecosystem grants
      overall: 72,
      grade: 'B-',
      energyIntensity: 0.001, // kWh per transaction (zk-rollup)
      carbonFootprint: 0.0005, // kg CO2 per transaction
      consensusMechanism: 'zkEVM Rollup on Ethereum',
      description: 'Immutable zkEVM for carbon-neutral NFT gaming with zero gas fees',
    },
    ENJ: {
      environmental: 55, // Enjin Matrixchain, Polkadot parachain
      social: 73, // Cross-game NFT items, melt value guarantee
      governance: 56, // Enjin team controlled, community input limited
      overall: 60,
      grade: 'C',
      energyIntensity: 0.008, // kWh per transaction (Matrixchain)
      carbonFootprint: 0.004, // kg CO2 per transaction
      consensusMechanism: 'Polkadot Nominated Proof of Stake',
      description: 'Enjin cross-game NFT ecosystem with melt value and Matrixchain',
    },
    ATLAS: {
      environmental: 65, // Solana PoH+PoS, energy efficient
      social: 68, // Space-themed P2E, fleet management
      governance: 48, // Star Atlas team controlled, early governance
      overall: 58,
      grade: 'C',
      energyIntensity: 1.837, // kWh per transaction (Solana)
      carbonFootprint: 0.918, // kg CO2 per transaction
      consensusMechanism: 'Solana Proof of History + Proof of Stake',
      description: 'Star Atlas in-game currency for space metaverse on Solana',
    },
    POLIS: {
      environmental: 65, // Solana chain, same as ATLAS
      social: 66, // Governance and staking token for Star Atlas DAO
      governance: 52, // DAO governance, fleet staking mechanics
      overall: 60,
      grade: 'C',
      energyIntensity: 1.837, // kWh per transaction (Solana)
      carbonFootprint: 0.918, // kg CO2 per transaction
      consensusMechanism: 'Solana Proof of History + Proof of Stake',
      description: 'Star Atlas governance token for DAO voting and fleet staking',
    },
    APE: {
      environmental: 48, // ApeChain L2, but high-volume NFT transactions
      social: 76, // Strong community, Otherside metaverse, cultural impact
      governance: 50, // ApeCoin DAO, evolving governance structure
      overall: 56,
      grade: 'C-',
      energyIntensity: 0.01, // kWh per transaction (ApeChain)
      carbonFootprint: 0.005, // kg CO2 per transaction
      consensusMechanism: 'ApeChain Layer 2',
      description: 'ApeCoin for Bored Ape ecosystem and Otherside metaverse',
    },
    YGG: {
      environmental: 55, // Multi-chain guild operations
      social: 80, // Guild scholarships, emerging market player onboarding
      governance: 58, // SubDAO structure, guild management governance
      overall: 63,
      grade: 'C+',
      energyIntensity: 0.005, // kWh per transaction (varies by chain)
      carbonFootprint: 0.0025, // kg CO2 per transaction
      consensusMechanism: 'Multi-chain (Ethereum PoS primary)',
      description: 'Yield Guild Games — P2E guild with scholarship economy for emerging markets',
    },
    RONIN: {
      environmental: 60, // Ronin PoA chain, validator-based
      social: 75, // Gaming-focused chain, Axie ecosystem backbone
      governance: 64, // Transitioning from PoA to DPoS, community validators
      overall: 66,
      grade: 'C+',
      energyIntensity: 0.003, // kWh per transaction
      carbonFootprint: 0.0015, // kg CO2 per transaction
      consensusMechanism: 'Ronin Delegated Proof of Stake',
      description: 'Ronin Network — gaming-focused chain powering Axie Infinity ecosystem',
    },
  },

  // ESG grading scale
  gradingScale: {
    'A+': { min: 95, max: 100 },
    A: { min: 90, max: 94 },
    'A-': { min: 85, max: 89 },
    'B+': { min: 80, max: 84 },
    B: { min: 75, max: 79 },
    'B-': { min: 70, max: 74 },
    'C+': { min: 65, max: 69 },
    C: { min: 60, max: 64 },
    'C-': { min: 55, max: 59 },
    'D+': { min: 50, max: 54 },
    D: { min: 40, max: 49 },
    'D-': { min: 0, max: 39 },
  },
};

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
  lastUpdated: Date;
}

@Injectable()
export class EsgService {
  constructor(private readonly prisma: PrismaService) {}

  async getEsgScore(symbol: string, assetType = 'crypto'): Promise<EsgScore> {
    const normalizedSymbol = symbol.toUpperCase();

    // Check if we have data for this asset
    const esgData = DHANAM_ESG_DATA.crypto[normalizedSymbol as keyof typeof DHANAM_ESG_DATA.crypto];

    if (!esgData) {
      // Return default ESG score for unknown assets
      return this.getDefaultEsgScore(normalizedSymbol, assetType);
    }

    return {
      symbol: normalizedSymbol,
      assetType: assetType as 'crypto',
      environmentalScore: esgData.environmental,
      socialScore: esgData.social,
      governanceScore: esgData.governance,
      overallScore: esgData.overall,
      grade: esgData.grade,
      energyIntensity: esgData.energyIntensity,
      carbonFootprint: esgData.carbonFootprint,
      consensusMechanism: esgData.consensusMechanism,
      description: esgData.description,
      lastUpdated: new Date(),
    };
  }

  private getDefaultEsgScore(symbol: string, assetType: string): EsgScore {
    // Default scores for unknown crypto assets
    if (assetType === 'crypto') {
      return {
        symbol,
        assetType: 'crypto',
        environmentalScore: 50, // Neutral
        socialScore: 60,
        governanceScore: 65,
        overallScore: 58,
        grade: 'C',
        description: 'ESG data not available - using default scoring',
        lastUpdated: new Date(),
      };
    }

    // Default for other asset types
    return {
      symbol,
      assetType: assetType as 'crypto',
      environmentalScore: 70,
      socialScore: 70,
      governanceScore: 70,
      overallScore: 70,
      grade: 'B-',
      description: 'ESG data not available - using default scoring',
      lastUpdated: new Date(),
    };
  }

  async getPortfolioEsgScore(userId: string): Promise<{
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
  }> {
    // Get user's crypto holdings
    const cryptoAccounts = await this.prisma.account.findMany({
      where: {
        type: 'crypto',
        space: {
          userSpaces: {
            some: { userId },
          },
        },
        balance: { gt: 0 }, // Only accounts with positive balances
      },
    });

    if (cryptoAccounts.length === 0) {
      throw new NotFoundException('No crypto holdings found for portfolio ESG analysis');
    }

    // Calculate total portfolio value
    const totalValue = cryptoAccounts.reduce((sum, account) => {
      return (
        sum +
        (account.balance instanceof Decimal ? account.balance.toNumber() : Number(account.balance))
      );
    }, 0);

    // Get ESG scores for each holding
    const holdings = await Promise.all(
      cryptoAccounts.map(async (account) => {
        const metadata = account.metadata as any;
        const symbol = metadata?.cryptoCurrency || 'UNKNOWN';
        const esgScore = await this.getEsgScore(symbol);
        const balance =
          account.balance instanceof Decimal ? account.balance.toNumber() : Number(account.balance);
        const weight = balance / totalValue;

        return {
          symbol,
          weight,
          esgScore,
        };
      })
    );

    // Calculate weighted portfolio ESG scores
    const portfolioScores = holdings.reduce(
      (acc, holding) => {
        const weight = holding.weight;
        return {
          environmental: acc.environmental + holding.esgScore.environmentalScore * weight,
          social: acc.social + holding.esgScore.socialScore * weight,
          governance: acc.governance + holding.esgScore.governanceScore * weight,
        };
      },
      { environmental: 0, social: 0, governance: 0 }
    );

    const overallScore = Math.round(
      (portfolioScores.environmental + portfolioScores.social + portfolioScores.governance) / 3
    );

    const grade = this.calculateGrade(overallScore);
    const insights = this.generatePortfolioInsights(holdings, portfolioScores);

    return {
      overallScore,
      grade,
      breakdown: {
        environmental: Math.round(portfolioScores.environmental),
        social: Math.round(portfolioScores.social),
        governance: Math.round(portfolioScores.governance),
      },
      holdings,
      insights,
    };
  }

  private calculateGrade(score: number): string {
    for (const [grade, range] of Object.entries(DHANAM_ESG_DATA.gradingScale)) {
      if (score >= range.min && score <= range.max) {
        return grade;
      }
    }
    return 'D-';
  }

  private generatePortfolioInsights(
    holdings: any[],
    scores: { environmental: number; social: number; governance: number }
  ): string[] {
    const insights: string[] = [];

    // Environmental insights
    if (scores.environmental < 50) {
      insights.push(
        'Your portfolio has a high environmental impact. Consider increasing allocation to Proof-of-Stake cryptocurrencies like ETH, ADA, or ALGO.'
      );
    } else if (scores.environmental > 80) {
      insights.push(
        'Excellent environmental performance! Your portfolio focuses on energy-efficient cryptocurrencies.'
      );
    }

    // Bitcoin-specific insights
    const btcHolding = holdings.find((h) => h.symbol === 'BTC');
    if (btcHolding && btcHolding.weight > 0.5) {
      insights.push(
        'Bitcoin represents a large portion of your portfolio. While it offers excellent decentralization, consider diversifying with more energy-efficient alternatives.'
      );
    }

    // High ESG performers
    const highEsgHoldings = holdings.filter((h) => h.esgScore.overallScore >= 85);
    if (highEsgHoldings.length > 0) {
      insights.push(
        `Strong ESG performers in your portfolio: ${highEsgHoldings
          .map((h) => h.symbol)
          .join(', ')}`
      );
    }

    // Governance insights
    if (scores.governance > 80) {
      insights.push(
        'Your portfolio shows strong governance characteristics with decentralized and transparent projects.'
      );
    }

    return insights;
  }

  async getAssetComparison(symbols: string[]): Promise<{
    comparison: EsgScore[];
    bestPerformer: {
      overall: string;
      environmental: string;
      social: string;
      governance: string;
    };
    summary: string;
  }> {
    const scores = await Promise.all(symbols.map((symbol) => this.getEsgScore(symbol)));

    // Find best performers in each category
    const bestPerformer = {
      overall: scores.reduce((best, current) =>
        current.overallScore > best.overallScore ? current : best
      ).symbol,
      environmental: scores.reduce((best, current) =>
        current.environmentalScore > best.environmentalScore ? current : best
      ).symbol,
      social: scores.reduce((best, current) =>
        current.socialScore > best.socialScore ? current : best
      ).symbol,
      governance: scores.reduce((best, current) =>
        current.governanceScore > best.governanceScore ? current : best
      ).symbol,
    };

    const avgScore = scores.reduce((sum, score) => sum + score.overallScore, 0) / scores.length;
    const summary = `Average ESG score: ${Math.round(avgScore)} (${this.calculateGrade(avgScore)}). Best overall performer: ${bestPerformer.overall}.`;

    return {
      comparison: scores,
      bestPerformer,
      summary,
    };
  }

  async getEsgTrends(): Promise<{
    trending: {
      improving: string[];
      declining: string[];
    };
    recommendations: string[];
    marketInsights: string[];
  }> {
    // Mock trending data - in a real implementation, this would come from time-series data
    return {
      trending: {
        improving: ['ETH', 'ADA', 'ALGO', 'MATIC'],
        declining: ['BTC', 'LTC'], // PoW coins under pressure
      },
      recommendations: [
        'Consider Ethereum (ETH) - successfully transitioned to Proof of Stake, reducing energy consumption by 99.9%',
        'Algorand (ALGO) is carbon negative and has committed to being the greenest blockchain',
        'Cardano (ADA) uses peer-reviewed research and focuses on financial inclusion in developing countries',
        'Polygon (MATIC) provides Ethereum scaling with minimal environmental impact',
      ],
      marketInsights: [
        'Proof of Stake cryptocurrencies are outperforming in ESG ratings',
        'Environmental impact is becoming a key factor in institutional crypto adoption',
        'Projects with strong governance mechanisms are showing better long-term stability',
        'Social impact initiatives are increasingly important for crypto project success',
      ],
    };
  }
}
