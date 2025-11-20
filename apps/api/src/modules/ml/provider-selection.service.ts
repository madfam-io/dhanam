import { Injectable, Logger } from '@nestjs/common';
import { Provider } from '@prisma/client';

import { PrismaService } from '@core/prisma/prisma.service';

interface ProviderMetrics {
  provider: Provider;
  successRate: number;
  avgResponseTime: number;
  costPerTransaction: number;
  recentFailures: number;
  score: number;
}

interface ProviderCosts {
  plaid: { setup: number; monthly: number; perTransaction: number };
  mx: { setup: number; monthly: number; perTransaction: number };
  finicity: { setup: number; monthly: number; perTransaction: number };
  belvo: { setup: number; monthly: number; perTransaction: number };
}

/**
 * ML-based provider selection service
 * Uses historical data to optimize provider choice based on:
 * - Success rate (reliability)
 * - Response time (speed)
 * - Cost (economic efficiency)
 * - Recent performance (recency bias)
 */
@Injectable()
export class ProviderSelectionService {
  private readonly logger = new Logger(ProviderSelectionService.name);

  // Provider costs (monthly rates + per-transaction fees)
  // Based on 2025 pricing
  private readonly providerCosts: ProviderCosts = {
    plaid: { setup: 0, monthly: 0, perTransaction: 0.002 }, // $0.002/txn after free tier
    mx: { setup: 0, monthly: 0, perTransaction: 0.0015 }, // Slightly cheaper
    finicity: { setup: 0, monthly: 0, perTransaction: 0.0025 }, // Most expensive
    belvo: { setup: 0, monthly: 0, perTransaction: 0.001 }, // Cheapest (Mexico focus)
  };

  // Scoring weights for provider selection
  private readonly weights = {
    successRate: 0.5, // 50% weight on reliability
    responseTime: 0.2, // 20% weight on speed
    cost: 0.2, // 20% weight on cost
    recency: 0.1, // 10% weight on recent performance
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Select optimal provider using ML-based scoring
   */
  async selectOptimalProvider(
    institutionId: string,
    region: string = 'US',
    userId?: string
  ): Promise<Provider> {
    const availableProviders = await this.getAvailableProviders(institutionId, region);

    if (availableProviders.length === 0) {
      // Default fallback
      return region === 'MX' ? Provider.belvo : Provider.plaid;
    }

    if (availableProviders.length === 1) {
      return availableProviders[0];
    }

    // Calculate metrics for each provider
    const metrics = await Promise.all(
      availableProviders.map((provider) =>
        this.calculateProviderMetrics(provider, institutionId, region, userId)
      )
    );

    // Calculate ML score for each provider
    const scoredProviders = metrics.map((metric) => ({
      ...metric,
      score: this.calculateMLScore(metric),
    }));

    // Sort by score (highest first)
    scoredProviders.sort((a, b) => b.score - a.score);

    const selected = scoredProviders[0];

    this.logger.log(
      `ML selected ${selected.provider} for ${institutionId} (score: ${selected.score.toFixed(3)})`
    );

    // Log selection reasoning
    this.logger.debug(
      `Selection metrics: success=${selected.successRate.toFixed(2)}%, ` +
        `time=${selected.avgResponseTime}ms, cost=$${selected.costPerTransaction}, ` +
        `failures=${selected.recentFailures}`
    );

    return selected.provider;
  }

  /**
   * Calculate comprehensive metrics for a provider
   */
  private async calculateProviderMetrics(
    provider: Provider,
    institutionId: string,
    region: string,
    userId?: string
  ): Promise<ProviderMetrics> {
    // Get health status
    const healthStatus = await this.prisma.providerHealthStatus.findUnique({
      where: {
        provider_region: {
          provider,
          region,
        },
      },
    });

    // Get recent connection attempts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttempts = await this.prisma.connectionAttempt.findMany({
      where: {
        provider,
        institutionId,
        attemptedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { attemptedAt: 'desc' },
      take: 100,
    });

    // Calculate success rate from recent attempts
    const successCount = recentAttempts.filter((a) => a.status === 'success').length;
    const successRate = recentAttempts.length > 0 ? (successCount / recentAttempts.length) * 100 : 85; // Default 85% if no data

    // Calculate average response time
    const responseTimes = recentAttempts
      .filter((a) => a.responseTimeMs !== null)
      .map((a) => a.responseTimeMs!);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : healthStatus?.avgResponseTimeMs || 2000;

    // Count recent failures (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFailures = recentAttempts.filter(
      (a) => a.status === 'failure' && a.attemptedAt >= sevenDaysAgo
    ).length;

    // Get cost per transaction
    const costPerTransaction = this.getProviderCost(provider);

    return {
      provider,
      successRate,
      avgResponseTime,
      costPerTransaction,
      recentFailures,
      score: 0, // Will be calculated
    };
  }

  /**
   * Calculate ML score using weighted metrics
   */
  private calculateMLScore(metrics: ProviderMetrics): number {
    // Normalize success rate (0-1, where 1 = 100%)
    const normalizedSuccess = metrics.successRate / 100;

    // Normalize response time (inverse, where lower is better)
    // Assume 5000ms is the worst acceptable time
    const normalizedResponseTime = Math.max(0, 1 - metrics.avgResponseTime / 5000);

    // Normalize cost (inverse, where lower is better)
    // Assume $0.005 is the highest acceptable cost
    const normalizedCost = Math.max(0, 1 - metrics.costPerTransaction / 0.005);

    // Normalize recency (penalize recent failures)
    // More than 5 failures in last 7 days is bad
    const normalizedRecency = Math.max(0, 1 - metrics.recentFailures / 5);

    // Calculate weighted score
    const score =
      normalizedSuccess * this.weights.successRate +
      normalizedResponseTime * this.weights.responseTime +
      normalizedCost * this.weights.cost +
      normalizedRecency * this.weights.recency;

    return score;
  }

  /**
   * Get available providers for an institution
   */
  private async getAvailableProviders(
    institutionId: string,
    region: string
  ): Promise<Provider[]> {
    const mapping = await this.prisma.institutionProviderMapping.findFirst({
      where: {
        institutionId,
        region,
      },
    });

    if (mapping) {
      const providers = [mapping.primaryProvider];
      if (mapping.backupProviders) {
        const backups = mapping.backupProviders as Provider[];
        providers.push(...backups);
      }
      return providers;
    }

    // Default providers by region
    if (region === 'MX') {
      return [Provider.belvo, Provider.mx];
    }

    return [Provider.plaid, Provider.mx, Provider.finicity];
  }

  /**
   * Get provider cost per transaction
   */
  private getProviderCost(provider: Provider): number {
    switch (provider) {
      case Provider.plaid:
        return this.providerCosts.plaid.perTransaction;
      case Provider.mx:
        return this.providerCosts.mx.perTransaction;
      case Provider.finicity:
        return this.providerCosts.finicity.perTransaction;
      case Provider.belvo:
        return this.providerCosts.belvo.perTransaction;
      default:
        return 0.002; // Default
    }
  }

  /**
   * Get provider selection insights for analytics dashboard
   */
  async getProviderInsights(region: string = 'US', days: number = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const attempts = await this.prisma.connectionAttempt.findMany({
      where: {
        attemptedAt: { gte: sinceDate },
      },
    });

    // Group by provider
    const byProvider = attempts.reduce(
      (acc, attempt) => {
        if (!acc[attempt.provider]) {
          acc[attempt.provider] = {
            total: 0,
            successful: 0,
            failed: 0,
            avgResponseTime: 0,
            totalResponseTime: 0,
            failoverCount: 0,
          };
        }

        acc[attempt.provider].total++;
        if (attempt.status === 'success') {
          acc[attempt.provider].successful++;
        } else {
          acc[attempt.provider].failed++;
        }

        if (attempt.responseTimeMs) {
          acc[attempt.provider].totalResponseTime += attempt.responseTimeMs;
        }

        if (attempt.failoverUsed) {
          acc[attempt.provider].failoverCount++;
        }

        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate averages and rates
    const insights = Object.entries(byProvider).map(([provider, stats]) => {
      const typedStats = stats as any;
      return {
        provider,
        totalAttempts: typedStats.total,
        successRate: ((typedStats.successful / typedStats.total) * 100).toFixed(2) + '%',
        failureRate: ((typedStats.failed / typedStats.total) * 100).toFixed(2) + '%',
        avgResponseTime: Math.round(typedStats.totalResponseTime / typedStats.total) + 'ms',
        failoverRate: ((typedStats.failoverCount / typedStats.total) * 100).toFixed(2) + '%',
        estimatedMonthlyCost: (typedStats.total * this.getProviderCost(provider as Provider)).toFixed(4),
      };
    });

    return insights;
  }

  /**
   * Train/update provider selection model with new data
   */
  async updateSelectionModel(provider: Provider, success: boolean, responseTime: number) {
    // This would connect to a real ML training pipeline in production
    // For now, we just log the training data
    this.logger.debug(
      `Training data: provider=${provider}, success=${success}, responseTime=${responseTime}ms`
    );

    // In production, this would:
    // 1. Store training data in a time-series database
    // 2. Periodically retrain the model (e.g., nightly)
    // 3. Update model weights based on new patterns
    // 4. A/B test new model vs old model
    // 5. Auto-rollback if performance degrades
  }
}
