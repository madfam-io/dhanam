import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';

import { FuzzyMatcherService } from './fuzzy-matcher.service';
import { MerchantNormalizerService } from './merchant-normalizer.service';

export interface AggregatedPattern {
  patternKey: string;
  categoryId: string;
  categoryName: string;
  correctionCount: number;
  weight: number;
  lastUpdated: Date;
}

export interface PatternMatch {
  patternKey: string;
  categoryId: string;
  confidence: number;
  source: 'exact' | 'fuzzy' | 'description';
}

/**
 * Aggregates user corrections to build pattern-based categorization rules
 * Uses weighted scoring with recency bias for more accurate predictions
 */
@Injectable()
export class CorrectionAggregatorService {
  private readonly logger = new Logger(CorrectionAggregatorService.name);

  // In-memory cache of aggregated patterns per space
  private patternCache = new Map<string, Map<string, AggregatedPattern>>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly fuzzyMatcher: FuzzyMatcherService,
    private readonly merchantNormalizer: MerchantNormalizerService
  ) {}

  /**
   * Get the best category match for a merchant based on aggregated corrections
   */
  async findBestMatch(
    spaceId: string,
    merchant: string | null,
    description: string
  ): Promise<PatternMatch | null> {
    const patterns = await this.getAggregatedPatterns(spaceId);

    if (patterns.size === 0) return null;

    // Strategy 1: Exact merchant pattern match
    if (merchant) {
      const merchantPattern = this.merchantNormalizer.extractPatternKey(merchant);
      const exactMatch = patterns.get(merchantPattern.toLowerCase());

      if (exactMatch && exactMatch.weight >= 1.0) {
        return {
          patternKey: exactMatch.patternKey,
          categoryId: exactMatch.categoryId,
          confidence: Math.min(0.95, 0.7 + Math.log(exactMatch.correctionCount + 1) * 0.1),
          source: 'exact',
        };
      }
    }

    // Strategy 2: Fuzzy merchant match
    if (merchant) {
      const merchantPattern = this.merchantNormalizer.extractPatternKey(merchant);
      const patternKeys = Array.from(patterns.keys());
      const fuzzyMatch = this.fuzzyMatcher.findBestMatch(merchantPattern, patternKeys);

      if (fuzzyMatch.match && fuzzyMatch.similarity >= 0.8) {
        const pattern = patterns.get(fuzzyMatch.match);
        if (pattern) {
          return {
            patternKey: pattern.patternKey,
            categoryId: pattern.categoryId,
            confidence: Math.min(0.85, fuzzyMatch.similarity * 0.8),
            source: 'fuzzy',
          };
        }
      }
    }

    // Strategy 3: Description term matching
    const descriptionTerms = this.merchantNormalizer.extractDescriptionTerms(description);
    if (descriptionTerms.length > 0) {
      const descriptionPattern = descriptionTerms.join(' ').toLowerCase();
      const descriptionMatches = this.fuzzyMatcher.findAllMatches(
        descriptionPattern,
        Array.from(patterns.keys()),
        0.6
      );

      if (descriptionMatches.length > 0) {
        const bestDescMatch = descriptionMatches[0];
        const pattern = patterns.get(bestDescMatch.match);
        if (pattern) {
          return {
            patternKey: pattern.patternKey,
            categoryId: pattern.categoryId,
            confidence: Math.min(0.7, bestDescMatch.similarity * 0.7),
            source: 'description',
          };
        }
      }
    }

    return null;
  }

  /**
   * Get aggregated patterns for a space (with caching)
   */
  async getAggregatedPatterns(spaceId: string): Promise<Map<string, AggregatedPattern>> {
    // Check cache
    const cached = this.patternCache.get(spaceId);
    const expiry = this.cacheExpiry.get(spaceId) || 0;

    if (cached && Date.now() < expiry) {
      return cached;
    }

    // Rebuild patterns from corrections
    const patterns = await this.buildPatterns(spaceId);

    // Update cache
    this.patternCache.set(spaceId, patterns);
    this.cacheExpiry.set(spaceId, Date.now() + this.CACHE_TTL_MS);

    return patterns;
  }

  /**
   * Build aggregated patterns from corrections
   */
  private async buildPatterns(spaceId: string): Promise<Map<string, AggregatedPattern>> {
    const corrections = await this.prisma.categoryCorrection.findMany({
      where: {
        spaceId,
        appliedToFuture: true,
        merchantPattern: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to most recent 1000 corrections
    });

    // Get category names
    const categoryIds = [...new Set(corrections.map((c) => c.correctedCategoryId))];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Aggregate by pattern
    const patternAggregation = new Map<
      string,
      {
        categoryCounts: Map<string, number>;
        categoryWeights: Map<string, number>;
        lastUpdated: Date;
      }
    >();

    const now = Date.now();

    for (const correction of corrections) {
      if (!correction.merchantPattern) continue;

      const patternKey = correction.merchantPattern.toLowerCase();
      let aggregation = patternAggregation.get(patternKey);

      if (!aggregation) {
        aggregation = {
          categoryCounts: new Map(),
          categoryWeights: new Map(),
          lastUpdated: correction.createdAt,
        };
        patternAggregation.set(patternKey, aggregation);
      }

      // Update counts
      const currentCount = aggregation.categoryCounts.get(correction.correctedCategoryId) || 0;
      aggregation.categoryCounts.set(correction.correctedCategoryId, currentCount + 1);

      // Calculate recency weight (exponential decay over 90 days)
      const ageInDays = (now - correction.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.exp(-ageInDays / 90);

      const currentWeight = aggregation.categoryWeights.get(correction.correctedCategoryId) || 0;
      aggregation.categoryWeights.set(
        correction.correctedCategoryId,
        currentWeight + recencyWeight
      );

      // Update last updated
      if (correction.createdAt > aggregation.lastUpdated) {
        aggregation.lastUpdated = correction.createdAt;
      }
    }

    // Build final patterns
    const patterns = new Map<string, AggregatedPattern>();

    for (const [patternKey, aggregation] of patternAggregation) {
      // Find the category with highest weight
      let bestCategory: string | null = null;
      let bestWeight = 0;
      let totalCount = 0;

      for (const [categoryId, weight] of aggregation.categoryWeights) {
        if (weight > bestWeight) {
          bestWeight = weight;
          bestCategory = categoryId;
        }
        totalCount += aggregation.categoryCounts.get(categoryId) || 0;
      }

      if (bestCategory) {
        patterns.set(patternKey, {
          patternKey,
          categoryId: bestCategory,
          categoryName: categoryMap.get(bestCategory) || 'Unknown',
          correctionCount: totalCount,
          weight: bestWeight,
          lastUpdated: aggregation.lastUpdated,
        });
      }
    }

    this.logger.log(`Built ${patterns.size} patterns for space ${spaceId}`);
    return patterns;
  }

  /**
   * Invalidate cache for a space (call after new corrections)
   */
  invalidateCache(spaceId: string): void {
    this.patternCache.delete(spaceId);
    this.cacheExpiry.delete(spaceId);
  }

  /**
   * Retrain patterns for all spaces (scheduled job)
   */
  async retrainAllPatterns(): Promise<{ spacesProcessed: number; patternsBuilt: number }> {
    // Get all unique space IDs with corrections
    const spaces = await this.prisma.categoryCorrection.findMany({
      select: { spaceId: true },
      distinct: ['spaceId'],
    });

    let totalPatterns = 0;

    for (const { spaceId } of spaces) {
      // Clear cache to force rebuild
      this.invalidateCache(spaceId);

      // Rebuild patterns
      const patterns = await this.getAggregatedPatterns(spaceId);
      totalPatterns += patterns.size;
    }

    this.logger.log(
      `Retrained patterns for ${spaces.length} spaces, ${totalPatterns} total patterns`
    );

    return {
      spacesProcessed: spaces.length,
      patternsBuilt: totalPatterns,
    };
  }

  /**
   * Get pattern statistics for a space
   */
  async getPatternStats(spaceId: string): Promise<{
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
      lastUpdated: Date;
    }>;
  }> {
    const patterns = await this.getAggregatedPatterns(spaceId);

    const patternArray = Array.from(patterns.values());
    const totalCorrections = patternArray.reduce((sum, p) => sum + p.correctionCount, 0);

    return {
      totalPatterns: patterns.size,
      avgCorrectionsPerPattern: patterns.size > 0 ? totalCorrections / patterns.size : 0,
      topPatterns: patternArray
        .sort((a, b) => b.correctionCount - a.correctionCount)
        .slice(0, 10)
        .map((p) => ({
          pattern: p.patternKey,
          categoryName: p.categoryName,
          count: p.correctionCount,
        })),
      recentPatterns: patternArray
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
        .slice(0, 10)
        .map((p) => ({
          pattern: p.patternKey,
          categoryName: p.categoryName,
          lastUpdated: p.lastUpdated,
        })),
    };
  }
}
