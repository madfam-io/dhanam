import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';

import { MerchantNormalizerService } from './merchant-normalizer.service';

export interface CategoryCorrectionInput {
  transactionId: string;
  spaceId: string;
  correctedCategoryId: string;
  userId: string;
  applyToFuture?: boolean;
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

/**
 * Service for handling user category corrections
 * Stores corrections to improve ML categorization over time
 */
@Injectable()
export class CategoryCorrectionService {
  private readonly logger = new Logger(CategoryCorrectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantNormalizer: MerchantNormalizerService
  ) {}

  /**
   * Record a category correction from the user
   */
  async recordCorrection(input: CategoryCorrectionInput): Promise<void> {
    const { transactionId, spaceId, correctedCategoryId, userId, applyToFuture = true } = input;

    // Get the transaction details
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: true,
        category: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    // Verify the transaction belongs to the space
    if (transaction.account.spaceId !== spaceId) {
      throw new NotFoundException(`Transaction ${transactionId} not found in space ${spaceId}`);
    }

    // Get original category ID and confidence from metadata
    const originalCategoryId = transaction.categoryId;
    const metadata = transaction.metadata as Record<string, any> | null;
    const originalConfidence = metadata?.mlConfidence;

    // Normalize merchant name for pattern learning
    const merchantPattern = this.merchantNormalizer.extractPatternKey(transaction.merchant);

    // Extract key terms from description
    const descriptionTerms = this.merchantNormalizer.extractDescriptionTerms(
      transaction.description
    );
    const descriptionPattern = descriptionTerms.join(' ');

    // Create the correction record
    await this.prisma.categoryCorrection.create({
      data: {
        spaceId,
        transactionId,
        originalCategoryId,
        correctedCategoryId,
        merchantPattern: merchantPattern || null,
        descriptionPattern: descriptionPattern || null,
        confidence: originalConfidence ? originalConfidence : null,
        createdBy: userId,
        appliedToFuture: applyToFuture,
      },
    });

    // Update the transaction's category
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        categoryId: correctedCategoryId,
        metadata: {
          ...metadata,
          userCorrected: true,
          correctedAt: new Date().toISOString(),
          correctedBy: userId,
        },
      },
    });

    this.logger.log(
      `Recorded correction for transaction ${transactionId}: ` +
        `${originalCategoryId || 'uncategorized'} -> ${correctedCategoryId}`
    );

    // If apply to future is enabled, update similar uncategorized transactions
    if (applyToFuture && merchantPattern) {
      await this.applyCorrectionToSimilarTransactions(
        spaceId,
        merchantPattern,
        correctedCategoryId
      );
    }
  }

  /**
   * Apply a correction to similar uncategorized transactions
   */
  private async applyCorrectionToSimilarTransactions(
    spaceId: string,
    merchantPattern: string,
    categoryId: string
  ): Promise<number> {
    if (!merchantPattern) return 0;

    // Find similar uncategorized transactions
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        categoryId: null,
        merchant: { not: null },
      },
      include: {
        account: true,
      },
      take: 100,
    });

    let updatedCount = 0;

    for (const txn of transactions) {
      const txnPattern = this.merchantNormalizer.extractPatternKey(txn.merchant);

      // Apply if pattern matches exactly
      if (txnPattern && txnPattern.toLowerCase() === merchantPattern.toLowerCase()) {
        await this.prisma.transaction.update({
          where: { id: txn.id },
          data: {
            categoryId,
            metadata: {
              autoCategorized: true,
              mlConfidence: 0.9,
              mlReasoning: `Applied from user correction for similar merchant`,
            },
          },
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      this.logger.log(
        `Applied correction to ${updatedCount} similar transactions for pattern "${merchantPattern}"`
      );
    }

    return updatedCount;
  }

  /**
   * Get learned patterns for a space from corrections
   */
  async getLearnedPatterns(spaceId: string): Promise<
    Array<{
      merchantPattern: string;
      categoryId: string;
      categoryName: string;
      correctionCount: number;
      lastCorrectedAt: Date;
    }>
  > {
    const corrections = await this.prisma.categoryCorrection.groupBy({
      by: ['merchantPattern', 'correctedCategoryId'],
      where: {
        spaceId,
        merchantPattern: { not: null },
        appliedToFuture: true,
      },
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
    });

    // Get category names
    const categoryIds = [...new Set(corrections.map((c) => c.correctedCategoryId))];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return corrections
      .filter((c) => c.merchantPattern)
      .map((c) => ({
        merchantPattern: c.merchantPattern!,
        categoryId: c.correctedCategoryId,
        categoryName: categoryMap.get(c.correctedCategoryId) || 'Unknown',
        correctionCount: c._count.id,
        lastCorrectedAt: c._max.createdAt!,
      }))
      .sort((a, b) => b.correctionCount - a.correctionCount);
  }

  /**
   * Find the best category for a merchant based on corrections
   */
  async findCategoryFromCorrections(
    spaceId: string,
    merchant: string
  ): Promise<{ categoryId: string; confidence: number } | null> {
    const merchantPattern = this.merchantNormalizer.extractPatternKey(merchant);

    if (!merchantPattern) return null;

    // Find corrections for this merchant pattern
    const corrections = await this.prisma.categoryCorrection.findMany({
      where: {
        spaceId,
        merchantPattern: merchantPattern,
        appliedToFuture: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (corrections.length === 0) return null;

    // Count by category with recency weighting
    const categoryScores = new Map<string, number>();
    const now = Date.now();

    for (const correction of corrections) {
      const ageInDays = (now - correction.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      // Recent corrections get higher weight
      const recencyWeight = Math.max(0.1, 1 - ageInDays / 365);
      const currentScore = categoryScores.get(correction.correctedCategoryId) || 0;
      categoryScores.set(correction.correctedCategoryId, currentScore + recencyWeight);
    }

    // Find the highest scored category
    let bestCategory: string | null = null;
    let bestScore = 0;

    for (const [categoryId, score] of categoryScores) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = categoryId;
      }
    }

    if (!bestCategory) return null;

    // Calculate confidence based on consistency and sample size
    const totalCorrections = corrections.length;
    const consistencyRatio =
      corrections.filter((c) => c.correctedCategoryId === bestCategory).length / totalCorrections;

    // Confidence formula: consistency * log(sample size) / log(20)
    const sampleSizeBoost = Math.min(1, Math.log(totalCorrections + 1) / Math.log(20));
    const confidence = Math.min(0.95, consistencyRatio * sampleSizeBoost);

    return {
      categoryId: bestCategory,
      confidence,
    };
  }

  /**
   * Get correction statistics for a space
   */
  async getCorrectionStats(spaceId: string, days: number = 30): Promise<CorrectionStats> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get all corrections in the period
    const corrections = await this.prisma.categoryCorrection.findMany({
      where: {
        spaceId,
        createdAt: { gte: sinceDate },
      },
    });

    // Get total transactions in the period
    const totalTransactions = await this.prisma.transaction.count({
      where: {
        account: { spaceId },
        createdAt: { gte: sinceDate },
      },
    });

    // Count unique merchants
    const uniqueMerchants = new Set(corrections.map((c) => c.merchantPattern).filter(Boolean)).size;

    // Get top corrected-to categories
    const categoryCount = corrections.reduce(
      (acc, c) => {
        acc[c.correctedCategoryId] = (acc[c.correctedCategoryId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const categoryIds = Object.keys(categoryCount);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const topCorrectedCategories = Object.entries(categoryCount)
      .map(([categoryId, count]) => ({
        categoryId,
        categoryName: categoryMap.get(categoryId) || 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCorrections: corrections.length,
      uniqueMerchants,
      correctionRate: totalTransactions > 0 ? corrections.length / totalTransactions : 0,
      topCorrectedCategories,
    };
  }

  /**
   * Delete old corrections that are no longer relevant
   */
  async cleanupOldCorrections(olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.categoryCorrection.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} corrections older than ${olderThanDays} days`);
    return result.count;
  }
}
