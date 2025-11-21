import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';

export interface SplitSuggestion {
  userId: string;
  userName: string;
  suggestedAmount: number;
  suggestedPercentage: number;
  confidence: number;
  reasoning: string;
}

interface HistoricalSplitPattern {
  merchant: string;
  categoryId: string;
  averageSplitRatio: Record<string, number>; // userId -> percentage
  count: number;
}

/**
 * Predictive split amounts using ML
 * Learns from historical split patterns to suggest how to divide expenses
 */
@Injectable()
export class SplitPredictionService {
  private readonly logger = new Logger(SplitPredictionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Suggest split amounts for a transaction based on historical patterns
   */
  async suggestSplits(
    spaceId: string,
    transactionAmount: number,
    merchant: string | null,
    categoryId: string | null,
    householdMemberIds: string[]
  ): Promise<SplitSuggestion[]> {
    if (householdMemberIds.length < 2) {
      return [];
    }

    // Strategy 1: Merchant-based pattern (highest confidence)
    if (merchant) {
      const merchantPattern = await this.findMerchantSplitPattern(spaceId, merchant);
      if (merchantPattern && merchantPattern.count >= 3) {
        return this.buildSuggestionsFromPattern(
          merchantPattern.averageSplitRatio,
          transactionAmount,
          householdMemberIds,
          0.9,
          `Based on ${merchantPattern.count} past transactions at ${merchant}`
        );
      }
    }

    // Strategy 2: Category-based pattern
    if (categoryId) {
      const categoryPattern = await this.findCategorySplitPattern(spaceId, categoryId);
      if (categoryPattern && categoryPattern.count >= 5) {
        return this.buildSuggestionsFromPattern(
          categoryPattern.averageSplitRatio,
          transactionAmount,
          householdMemberIds,
          0.75,
          `Based on ${categoryPattern.count} past ${await this.getCategoryName(categoryId)} expenses`
        );
      }
    }

    // Strategy 3: Overall household split pattern
    const overallPattern = await this.findOverallSplitPattern(spaceId);
    if (overallPattern && overallPattern.count >= 10) {
      return this.buildSuggestionsFromPattern(
        overallPattern.averageSplitRatio,
        transactionAmount,
        householdMemberIds,
        0.6,
        `Based on ${overallPattern.count} overall household expenses`
      );
    }

    // Default: Equal split
    return this.buildEqualSplit(transactionAmount, householdMemberIds);
  }

  /**
   * Find split pattern for a specific merchant
   */
  private async findMerchantSplitPattern(
    spaceId: string,
    merchant: string
  ): Promise<HistoricalSplitPattern | null> {
    // Get transactions with this merchant that were split
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        merchant: { equals: merchant, mode: 'insensitive' },
        isSplit: true,
      },
      include: {
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    if (transactions.length === 0) {
      return null;
    }

    return this.calculateAverageSplitRatio(transactions, merchant);
  }

  /**
   * Find split pattern for a category
   */
  private async findCategorySplitPattern(
    spaceId: string,
    categoryId: string
  ): Promise<HistoricalSplitPattern | null> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        categoryId,
        isSplit: true,
      },
      include: {
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 30,
    });

    if (transactions.length === 0) {
      return null;
    }

    return this.calculateAverageSplitRatio(transactions, 'category');
  }

  /**
   * Find overall household split pattern
   */
  private async findOverallSplitPattern(spaceId: string): Promise<HistoricalSplitPattern | null> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        isSplit: true,
      },
      include: {
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    if (transactions.length === 0) {
      return null;
    }

    return this.calculateAverageSplitRatio(transactions, 'overall');
  }

  /**
   * Calculate average split ratio from historical transactions
   */
  private calculateAverageSplitRatio(
    transactions: any[],
    merchant: string
  ): HistoricalSplitPattern {
    const userTotals: Record<string, { total: number; count: number }> = {};

    // Accumulate split amounts by user
    for (const transaction of transactions) {
      const txnAmount = Math.abs(parseFloat(transaction.amount.toString()));

      for (const split of transaction.splits) {
        if (!userTotals[split.userId]) {
          userTotals[split.userId] = { total: 0, count: 0 };
        }

        const splitAmount = parseFloat(split.amount.toString());
        const percentage = (splitAmount / txnAmount) * 100;

        userTotals[split.userId].total += percentage;
        userTotals[split.userId].count++;
      }
    }

    // Calculate average percentages
    const averageSplitRatio: Record<string, number> = {};
    for (const [userId, data] of Object.entries(userTotals)) {
      averageSplitRatio[userId] = data.total / data.count;
    }

    // Get the most common category
    const categoryId = transactions.find((t) => t.categoryId)?.categoryId || 'uncategorized';

    return {
      merchant,
      categoryId,
      averageSplitRatio,
      count: transactions.length,
    };
  }

  /**
   * Build split suggestions from a pattern
   */
  private async buildSuggestionsFromPattern(
    splitRatio: Record<string, number>,
    transactionAmount: number,
    householdMemberIds: string[],
    confidence: number,
    reasoning: string
  ): Promise<SplitSuggestion[]> {
    const absoluteAmount = Math.abs(transactionAmount);
    const suggestions: SplitSuggestion[] = [];

    // Get user names
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: householdMemberIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    // Normalize ratios to sum to 100%
    const totalRatio = Object.values(splitRatio).reduce((sum, r) => sum + r, 0);
    const normalizedRatio: Record<string, number> = {};
    for (const [userId, ratio] of Object.entries(splitRatio)) {
      normalizedRatio[userId] = (ratio / totalRatio) * 100;
    }

    // Create suggestions for users in the pattern
    for (const userId of householdMemberIds) {
      const percentage = normalizedRatio[userId] || 0;
      const amount = (absoluteAmount * percentage) / 100;

      suggestions.push({
        userId,
        userName: (userMap.get(userId) as string) || 'Unknown',
        suggestedAmount: Math.round(amount * 100) / 100,
        suggestedPercentage: Math.round(percentage * 10) / 10,
        confidence,
        reasoning,
      });
    }

    // Ensure amounts sum exactly to transaction amount
    const totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0);
    if (Math.abs(totalSuggested - absoluteAmount) > 0.01) {
      // Adjust the largest amount to fix rounding errors
      const largest = suggestions.sort((a, b) => b.suggestedAmount - a.suggestedAmount)[0];
      largest.suggestedAmount += absoluteAmount - totalSuggested;
      largest.suggestedAmount = Math.round(largest.suggestedAmount * 100) / 100;
    }

    return suggestions;
  }

  /**
   * Build equal split suggestion (fallback)
   */
  private async buildEqualSplit(
    transactionAmount: number,
    householdMemberIds: string[]
  ): Promise<SplitSuggestion[]> {
    const absoluteAmount = Math.abs(transactionAmount);
    const count = householdMemberIds.length;
    const amountPerPerson = absoluteAmount / count;
    const percentage = 100 / count;

    // Get user names
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: householdMemberIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return users.map((user, index) => {
      // Fix rounding errors by giving the remainder to the first person
      const amount = index === 0 ? absoluteAmount - amountPerPerson * (count - 1) : amountPerPerson;

      return {
        userId: user.id,
        userName: user.name,
        suggestedAmount: Math.round(amount * 100) / 100,
        suggestedPercentage: Math.round(percentage * 10) / 10,
        confidence: 0.5,
        reasoning: 'Equal split (no historical pattern found)',
      };
    });
  }

  /**
   * Get split prediction accuracy metrics
   */
  async getSplitPredictionAccuracy(spaceId: string, days: number = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get all split transactions
    const splits = await this.prisma.transactionSplit.findMany({
      where: {
        transaction: {
          account: { spaceId },
          date: { gte: sinceDate },
        },
      },
      include: {
        transaction: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by user
    const byUser: Record<string, { total: number; avgAmount: number; avgPercentage: number }> = {};

    for (const split of splits) {
      if (!byUser[split.userId]) {
        byUser[split.userId] = {
          total: 0,
          avgAmount: 0,
          avgPercentage: 0,
        };
      }

      const txnAmount = Math.abs(parseFloat(split.transaction.amount.toString()));
      const splitAmount = parseFloat(split.amount.toString());
      const percentage = (splitAmount / txnAmount) * 100;

      byUser[split.userId].total++;
      byUser[split.userId].avgAmount += splitAmount;
      byUser[split.userId].avgPercentage += percentage;
    }

    // Calculate averages
    const userStats = Object.entries(byUser).map(([userId, data]) => ({
      userId,
      userName: splits.find((s) => s.userId === userId)?.user.name || 'Unknown',
      totalSplits: data.total,
      averageAmount: (data.avgAmount / data.total).toFixed(2),
      averagePercentage: (data.avgPercentage / data.total).toFixed(1) + '%',
    }));

    return {
      period: `${days} days`,
      totalSplitTransactions: splits.length / (userStats.length || 1),
      userStats,
    };
  }

  /**
   * Get category name
   */
  private async getCategoryName(categoryId: string): Promise<string> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    return category?.name || 'Unknown';
  }
}
