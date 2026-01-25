import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';

import { CorrectionAggregatorService } from './correction-aggregator.service';
import { FuzzyMatcherService } from './fuzzy-matcher.service';
import { MerchantNormalizerService } from './merchant-normalizer.service';

export interface CategoryPrediction {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning: string;
  source?: 'correction' | 'fuzzy' | 'merchant' | 'keyword' | 'amount';
}

interface MerchantPattern {
  merchant: string;
  categoryId: string;
  count: number;
  lastUsed: Date;
}

/**
 * Transaction Categorization Service
 *
 * AI-powered transaction categorization that learns from user behavior.
 * Uses a multi-strategy approach with cascading confidence levels.
 *
 * ## Categorization Strategies (Priority Order)
 * 1. **User Corrections** (highest priority) - Learned patterns from manual corrections
 * 2. **Exact Merchant Match** - Historical categorization for same merchant
 * 3. **Fuzzy Merchant Match** - Levenshtein distance for similar merchants
 * 4. **Keyword Matching** - TF-IDF style description analysis
 * 5. **Amount Patterns** - Statistical analysis of transaction amounts
 *
 * ## Confidence Thresholds
 * - HIGH (≥0.90): Auto-categorized without user intervention
 * - MEDIUM (≥0.70): Suggested to user with high confidence
 * - LOW (≥0.50): Suggested to user with lower confidence
 *
 * ## Learning Loop
 * When users correct categorizations, the system learns:
 * 1. Correction is stored with merchant/description pattern
 * 2. Future transactions matching pattern use learned category
 * 3. Confidence increases with more corrections for same pattern
 *
 * @example
 * ```typescript
 * // Predict category for new transaction
 * const prediction = await categorizationService.predictCategory(
 *   'space-123',
 *   'UBER TRIP',
 *   'UBER',
 *   25.50
 * );
 *
 * if (prediction && prediction.confidence >= 0.9) {
 *   // Auto-categorize with high confidence
 *   await categorizationService.autoCategorize(
 *     transactionId, spaceId, description, merchant, amount
 *   );
 * }
 * ```
 *
 * @see CorrectionAggregatorService - Handles user correction learning
 * @see FuzzyMatcherService - Levenshtein distance calculations
 * @see MerchantNormalizerService - Merchant name normalization
 */
@Injectable()
export class TransactionCategorizationService {
  private readonly logger = new Logger(TransactionCategorizationService.name);

  // Confidence thresholds
  private readonly HIGH_CONFIDENCE = 0.9;
  private readonly MEDIUM_CONFIDENCE = 0.7;
  private readonly LOW_CONFIDENCE = 0.5;

  constructor(
    private prisma: PrismaService,
    private fuzzyMatcher: FuzzyMatcherService,
    private merchantNormalizer: MerchantNormalizerService,
    private correctionAggregator: CorrectionAggregatorService
  ) {}

  /**
   * Predict category for a new transaction using ML
   *
   * Uses a cascading multi-strategy approach where user corrections take priority,
   * followed by merchant matching, fuzzy matching, keyword analysis, and amount patterns.
   *
   * @param spaceId - Space containing the transaction
   * @param description - Transaction description from provider
   * @param merchant - Normalized merchant name (may be null)
   * @param amount - Transaction amount (negative for expenses)
   * @returns Category prediction with confidence score, or null if no confident prediction
   *
   * @example
   * ```typescript
   * const prediction = await service.predictCategory(
   *   'space-123',
   *   'Payment to Starbucks Coffee',
   *   'STARBUCKS',
   *   -5.75
   * );
   * // Returns: { categoryId: 'cat-456', categoryName: 'Food & Drink',
   * //           confidence: 0.92, reasoning: 'Starbucks consistently categorized...', source: 'merchant' }
   * ```
   */
  async predictCategory(
    spaceId: string,
    description: string,
    merchant: string | null,
    amount: number
  ): Promise<CategoryPrediction | null> {
    // Strategy 0: Check learned patterns from user corrections (highest priority)
    const correctionMatch = await this.correctionAggregator.findBestMatch(
      spaceId,
      merchant,
      description
    );
    if (correctionMatch && correctionMatch.confidence >= 0.7) {
      return {
        categoryId: correctionMatch.categoryId,
        categoryName: await this.getCategoryName(correctionMatch.categoryId),
        confidence: correctionMatch.confidence,
        reasoning: `Learned from your corrections for "${correctionMatch.patternKey}"`,
        source: 'correction',
      };
    }

    // Strategy 1: Exact merchant match (high confidence)
    if (merchant) {
      const normalizedMerchant = this.merchantNormalizer.normalize(merchant);
      const merchantMatch = await this.findMerchantPattern(spaceId, normalizedMerchant);
      if (merchantMatch && merchantMatch.count >= 3) {
        return {
          categoryId: merchantMatch.categoryId,
          categoryName: await this.getCategoryName(merchantMatch.categoryId),
          confidence: this.calculateMerchantConfidence(merchantMatch.count),
          reasoning: `${normalizedMerchant} consistently categorized based on ${merchantMatch.count} past transactions`,
          source: 'merchant',
        };
      }
    }

    // Strategy 2: Enhanced fuzzy merchant match using Levenshtein
    if (merchant) {
      const fuzzyMatch = await this.findEnhancedFuzzyMerchantMatch(spaceId, merchant);
      if (fuzzyMatch) {
        return {
          categoryId: fuzzyMatch.categoryId,
          categoryName: await this.getCategoryName(fuzzyMatch.categoryId),
          confidence: fuzzyMatch.similarity * 0.85,
          reasoning: `Similar to "${fuzzyMatch.merchant}" (${(fuzzyMatch.similarity * 100).toFixed(0)}% match)`,
          source: 'fuzzy',
        };
      }
    }

    // Strategy 3: Description keyword matching with TF-IDF style scoring
    const keywordMatch = await this.findKeywordMatch(spaceId, description);
    if (keywordMatch) {
      return {
        categoryId: keywordMatch.categoryId,
        categoryName: await this.getCategoryName(keywordMatch.categoryId),
        confidence: this.MEDIUM_CONFIDENCE,
        reasoning: `Description matches pattern for ${keywordMatch.categoryName}`,
        source: 'keyword',
      };
    }

    // Strategy 4: Amount-based categorization
    const amountMatch = await this.findAmountPattern(spaceId, amount);
    if (amountMatch) {
      return {
        categoryId: amountMatch.categoryId,
        categoryName: await this.getCategoryName(amountMatch.categoryId),
        confidence: this.LOW_CONFIDENCE,
        reasoning: `Amount range ($${amount}) common for ${amountMatch.categoryName}`,
        source: 'amount',
      };
    }

    // No confident prediction
    return null;
  }

  /**
   * Enhanced fuzzy merchant matching using Levenshtein distance and normalization
   */
  private async findEnhancedFuzzyMerchantMatch(
    spaceId: string,
    merchant: string
  ): Promise<{ categoryId: string; merchant: string; similarity: number; count: number } | null> {
    // Normalize the input merchant
    const _normalizedMerchant = this.merchantNormalizer.normalize(merchant);
    const patternKey = this.merchantNormalizer.extractPatternKey(merchant);

    // Get all unique merchants from transactions
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        merchant: { not: null },
        categoryId: { not: null },
      },
      select: {
        merchant: true,
        categoryId: true,
      },
      distinct: ['merchant'],
      take: 500,
    });

    // Normalize all merchants and find best match
    const normalizedCandidates = transactions.map((t) => ({
      original: t.merchant!,
      normalized: this.merchantNormalizer.normalize(t.merchant),
      patternKey: this.merchantNormalizer.extractPatternKey(t.merchant),
      categoryId: t.categoryId!,
    }));

    // Use combined similarity for robust matching
    let bestMatch: (typeof normalizedCandidates)[0] | null = null;
    let bestSimilarity = 0;

    for (const candidate of normalizedCandidates) {
      const similarity = this.fuzzyMatcher.combinedSimilarity(patternKey, candidate.patternKey);
      if (similarity > bestSimilarity && similarity >= 0.75) {
        bestSimilarity = similarity;
        bestMatch = candidate;
      }
    }

    if (bestMatch) {
      // Get count for this category/merchant pattern
      const count = await this.prisma.transaction.count({
        where: {
          account: { spaceId },
          merchant: bestMatch.original,
          categoryId: bestMatch.categoryId,
        },
      });

      return {
        categoryId: bestMatch.categoryId,
        merchant: bestMatch.normalized,
        similarity: bestSimilarity,
        count,
      };
    }

    return null;
  }

  /**
   * Auto-categorize transaction if confidence exceeds threshold
   *
   * Only auto-categorizes when confidence >= 0.90 (HIGH_CONFIDENCE).
   * Stores ML metadata including confidence score and reasoning.
   *
   * @param transactionId - Transaction to categorize
   * @param spaceId - Space containing the transaction
   * @param description - Transaction description
   * @param merchant - Merchant name
   * @param amount - Transaction amount
   * @returns Object indicating if categorization occurred and details
   *
   * @example
   * ```typescript
   * const result = await service.autoCategorize(
   *   'txn-123', 'space-456', 'Netflix', 'NETFLIX', -15.99
   * );
   * if (result.categorized) {
   *   console.log(`Auto-categorized as ${result.categoryId} (${result.confidence})`);
   * }
   * ```
   */
  async autoCategorize(
    transactionId: string,
    spaceId: string,
    description: string,
    merchant: string | null,
    amount: number
  ): Promise<{ categorized: boolean; categoryId?: string; confidence?: number }> {
    const prediction = await this.predictCategory(spaceId, description, merchant, amount);

    if (!prediction) {
      return { categorized: false };
    }

    // Only auto-categorize if high confidence
    if (prediction.confidence >= this.HIGH_CONFIDENCE) {
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          categoryId: prediction.categoryId,
          metadata: {
            autoCategorized: true,
            mlConfidence: prediction.confidence,
            mlReasoning: prediction.reasoning,
          },
        },
      });

      this.logger.log(
        `Auto-categorized transaction ${transactionId} as ${prediction.categoryName} ` +
          `(confidence: ${prediction.confidence.toFixed(2)})`
      );

      return {
        categorized: true,
        categoryId: prediction.categoryId,
        confidence: prediction.confidence,
      };
    }

    return { categorized: false };
  }

  /**
   * Find exact merchant match in historical data
   */
  private async findMerchantPattern(
    spaceId: string,
    merchant: string
  ): Promise<MerchantPattern | null> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        merchant: { equals: merchant, mode: 'insensitive' },
        categoryId: { not: null },
      },
      select: {
        categoryId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (transactions.length === 0) {
      return null;
    }

    // Find most common category for this merchant
    const categoryCount = transactions.reduce(
      (acc, txn) => {
        if (txn.categoryId) {
          acc[txn.categoryId] = (acc[txn.categoryId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommonCategory = Object.entries(categoryCount).sort(
      (a, b) => (b[1] as number) - (a[1] as number)
    )[0];

    if (!mostCommonCategory) {
      return null;
    }

    return {
      merchant,
      categoryId: mostCommonCategory[0],
      count: mostCommonCategory[1] as number,
      lastUsed: transactions[0].createdAt,
    };
  }

  /**
   * Find similar merchant using fuzzy matching
   */
  private async findFuzzyMerchantMatch(
    spaceId: string,
    merchant: string
  ): Promise<MerchantPattern | null> {
    // Get all unique merchants
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        merchant: { not: null },
        categoryId: { not: null },
      },
      select: {
        merchant: true,
        categoryId: true,
        createdAt: true,
      },
      distinct: ['merchant'],
      take: 1000,
    });

    // Find similar merchants using simple string similarity
    const merchantLower = merchant.toLowerCase();
    const similar = transactions.filter((txn) => {
      if (!txn.merchant) return false;
      const txnMerchantLower = txn.merchant.toLowerCase();

      // Check if one contains the other
      return txnMerchantLower.includes(merchantLower) || merchantLower.includes(txnMerchantLower);
    });

    if (similar.length === 0) {
      return null;
    }

    // Use the most recent similar merchant
    const match = similar[0];

    // Get count for this category
    const pattern = await this.findMerchantPattern(spaceId, match.merchant!);

    return pattern;
  }

  /**
   * Find category based on description keywords
   */
  private async findKeywordMatch(
    spaceId: string,
    description: string
  ): Promise<{ categoryId: string; categoryName: string } | null> {
    // Get categories with transaction counts
    const categories = await this.prisma.category.findMany({
      where: {
        budget: {
          space: { id: spaceId },
        },
      },
      include: {
        transactions: {
          select: {
            description: true,
          },
          take: 100,
        },
      },
    });

    // Extract keywords from current description
    const keywords = this.extractKeywords(description);

    if (keywords.length === 0) {
      return null;
    }

    // Score each category based on keyword overlap
    const scores = categories.map((category) => {
      const categoryKeywords = category.transactions
        .flatMap((txn) => this.extractKeywords(txn.description))
        .filter((k, i, arr) => arr.indexOf(k) === i); // unique

      const overlap = keywords.filter((k) => categoryKeywords.includes(k)).length;
      const score = overlap / keywords.length;

      return {
        categoryId: category.id,
        categoryName: category.name,
        score,
      };
    });

    // Get best match
    const best = scores.sort((a, b) => b.score - a.score)[0];

    if (best && best.score > 0.3) {
      // At least 30% keyword overlap
      return {
        categoryId: best.categoryId,
        categoryName: best.categoryName,
      };
    }

    return null;
  }

  /**
   * Find category based on amount patterns
   */
  private async findAmountPattern(
    spaceId: string,
    amount: number
  ): Promise<{ categoryId: string; categoryName: string } | null> {
    const absoluteAmount = Math.abs(amount);

    // Get categories with average transaction amounts
    const categories = await this.prisma.category.findMany({
      where: {
        budget: {
          space: { id: spaceId },
        },
      },
      include: {
        transactions: {
          select: {
            amount: true,
          },
          take: 50,
        },
      },
    });

    // Find category with similar average amount
    const scored = categories
      .filter((c) => c.transactions.length >= 5) // Need at least 5 transactions
      .map((category) => {
        const amounts = category.transactions.map((txn) =>
          Math.abs(parseFloat(txn.amount.toString()))
        );
        const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length
        );

        // Calculate how many standard deviations away
        const zScore = Math.abs((absoluteAmount - avgAmount) / stdDev);

        return {
          categoryId: category.id,
          categoryName: category.name,
          avgAmount,
          zScore,
        };
      })
      .filter((c) => c.zScore < 1) // Within 1 standard deviation
      .sort((a, b) => a.zScore - b.zScore);

    if (scored.length > 0) {
      return {
        categoryId: scored[0].categoryId,
        categoryName: scored[0].categoryName,
      };
    }

    return null;
  }

  /**
   * Extract keywords from description
   */
  private extractKeywords(description: string): string[] {
    // Remove common stop words and extract meaningful words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ]);

    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Top 5 keywords
  }

  /**
   * Calculate confidence based on merchant pattern frequency
   */
  private calculateMerchantConfidence(count: number): number {
    // Confidence increases with more historical data, but caps at 0.95
    // Formula: min(0.95, 0.7 + (count - 3) * 0.05)
    return Math.min(0.95, 0.7 + (count - 3) * 0.05);
  }

  /**
   * Get category name by ID
   */
  private async getCategoryName(categoryId: string): Promise<string> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    return category?.name || 'Unknown';
  }

  /**
   * Get categorization accuracy metrics for a space
   *
   * Returns statistics about auto-categorized transactions including
   * total count and average confidence level.
   *
   * @param spaceId - Space to analyze
   * @param days - Number of days to look back (default: 30)
   * @returns Accuracy metrics object
   *
   * @example
   * ```typescript
   * const metrics = await service.getCategorizationAccuracy('space-123', 30);
   * console.log(`${metrics.totalAutoCategorized} auto-categorized with ${metrics.averageConfidence} avg confidence`);
   * ```
   */
  async getCategorizationAccuracy(spaceId: string, days: number = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.setDate(-days));

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        createdAt: { gte: sinceDate },
        metadata: {
          path: ['autoCategorized'],
          equals: true,
        },
      },
      select: {
        id: true,
        categoryId: true,
        metadata: true,
      },
    });

    // In production, you'd track if users manually re-categorized
    // For now, we assume all auto-categorizations are correct
    const totalAuto = transactions.length;
    const avgConfidence =
      transactions.reduce((sum, txn: any) => sum + (txn.metadata.mlConfidence || 0), 0) / totalAuto;

    return {
      totalAutoCategorized: totalAuto,
      averageConfidence: avgConfidence.toFixed(2),
      period: `${days} days`,
    };
  }
}
