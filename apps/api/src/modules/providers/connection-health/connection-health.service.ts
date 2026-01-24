import { Injectable, Logger } from '@nestjs/common';

import { Provider, ConnectionStatus } from '@db';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { CircuitBreakerService } from '../orchestrator/circuit-breaker.service';

export interface AccountConnectionHealth {
  accountId: string;
  accountName: string;
  provider: Provider;
  status: 'healthy' | 'degraded' | 'error' | 'disconnected' | 'requires_reauth';
  lastSyncAt: Date | null;
  lastErrorAt: Date | null;
  errorMessage: string | null;
  consecutiveFails: number;
  healthScore: number; // 0-100
  actionRequired: string | null;
}

export interface ConnectionHealthSummary {
  totalConnections: number;
  healthyCount: number;
  degradedCount: number;
  errorCount: number;
  requiresReauthCount: number;
  overallHealthScore: number;
  accounts: AccountConnectionHealth[];
  providerHealth: Array<{
    provider: Provider;
    status: string;
    circuitState: 'closed' | 'open' | 'half-open';
    errorRate: number;
    avgResponseTime: number;
  }>;
}

@Injectable()
export class ConnectionHealthService {
  private readonly logger = new Logger(ConnectionHealthService.name);

  constructor(
    private prisma: PrismaService,
    private circuitBreakerService: CircuitBreakerService
  ) {}

  /**
   * Get connection health summary for a space
   */
  async getConnectionHealth(spaceId: string): Promise<ConnectionHealthSummary> {
    // Get all accounts with their connections
    const accounts = await this.prisma.account.findMany({
      where: { spaceId, provider: { not: 'manual' } },
      include: {
        connection: true,
      },
    });

    // Get recent connection attempts for each account
    const recentAttempts = await this.prisma.connectionAttempt.findMany({
      where: {
        spaceId,
        attemptedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { attemptedAt: 'desc' },
    });

    // Build account health map
    const accountHealthMap = new Map<string, { fails: number; lastError: string | null }>();
    for (const attempt of recentAttempts) {
      if (!attempt.accountId) continue;

      const existing = accountHealthMap.get(attempt.accountId) || { fails: 0, lastError: null };
      if (attempt.status === 'failure') {
        existing.fails++;
        if (!existing.lastError) {
          existing.lastError = attempt.errorMessage || 'Unknown error';
        }
      }
      accountHealthMap.set(attempt.accountId, existing);
    }

    // Get provider health status
    const providerHealthRecords = await this.prisma.providerHealthStatus.findMany();

    // Build account health list
    const accountHealthList: AccountConnectionHealth[] = await Promise.all(
      accounts.map(async (account) => {
        const attemptData = accountHealthMap.get(account.id) || { fails: 0, lastError: null };
        const connection = account.connection;

        // Determine status based on multiple factors
        let status: AccountConnectionHealth['status'] = 'healthy';
        let actionRequired: string | null = null;
        let healthScore = 100;

        // Check for explicit connection errors
        if (connection?.status === ConnectionStatus.error) {
          status = 'error';
          healthScore = 20;
          actionRequired = 'Connection error. Try refreshing or reconnecting.';
        } else if (connection?.status === ConnectionStatus.disconnected) {
          status = 'disconnected';
          healthScore = 0;
          actionRequired = 'Account disconnected. Please reconnect.';
        }

        // Check for requires_reauth (from connection metadata)
        const metadata = connection?.metadata as {
          pendingExpiration?: boolean;
          revokedAt?: string;
        } | null;
        if (metadata?.pendingExpiration || metadata?.revokedAt) {
          status = 'requires_reauth';
          healthScore = 10;
          actionRequired = 'Authorization expired. Please reconnect your account.';
        }

        // Check consecutive failures
        if (attemptData.fails >= 5) {
          status = 'error';
          healthScore = Math.min(healthScore, 30);
          actionRequired =
            actionRequired || `${attemptData.fails} failed sync attempts in the last 24 hours.`;
        } else if (attemptData.fails >= 3) {
          status = status === 'healthy' ? 'degraded' : status;
          healthScore = Math.min(healthScore, 60);
        } else if (attemptData.fails >= 1) {
          healthScore = Math.min(healthScore, 80);
        }

        // Check last sync time
        const lastSyncAge = account.lastSyncedAt
          ? Date.now() - account.lastSyncedAt.getTime()
          : Infinity;
        const hoursSinceSync = lastSyncAge / (1000 * 60 * 60);

        if (hoursSinceSync > 48) {
          status = status === 'healthy' ? 'degraded' : status;
          healthScore = Math.min(healthScore, 50);
          actionRequired = actionRequired || 'Account has not synced in over 48 hours.';
        } else if (hoursSinceSync > 24) {
          healthScore = Math.min(healthScore, 70);
        }

        // Check provider-level health
        const providerHealth = providerHealthRecords.find((ph) => ph.provider === account.provider);
        if (providerHealth?.circuitBreakerOpen) {
          status = 'degraded';
          healthScore = Math.min(healthScore, 40);
          actionRequired = actionRequired || `${account.provider} provider is experiencing issues.`;
        }

        return {
          accountId: account.id,
          accountName: account.name,
          provider: account.provider,
          status,
          lastSyncAt: account.lastSyncedAt,
          lastErrorAt: attemptData.lastError ? new Date() : null,
          errorMessage: attemptData.lastError,
          consecutiveFails: attemptData.fails,
          healthScore,
          actionRequired,
        };
      })
    );

    // Calculate summary stats
    const healthyCount = accountHealthList.filter((a) => a.status === 'healthy').length;
    const degradedCount = accountHealthList.filter((a) => a.status === 'degraded').length;
    const errorCount = accountHealthList.filter((a) => a.status === 'error').length;
    const requiresReauthCount = accountHealthList.filter(
      (a) => a.status === 'requires_reauth'
    ).length;

    const overallHealthScore =
      accountHealthList.length > 0
        ? Math.round(
            accountHealthList.reduce((sum, a) => sum + a.healthScore, 0) / accountHealthList.length
          )
        : 100;

    // Build provider health summary
    const providerHealth = await Promise.all(
      providerHealthRecords.map(async (ph) => {
        const state = await this.circuitBreakerService.getState(ph.provider, ph.region);
        return {
          provider: ph.provider,
          status: ph.status,
          circuitState: state.state,
          errorRate: ph.errorRate?.toNumber() || 0,
          avgResponseTime: ph.avgResponseTimeMs,
        };
      })
    );

    return {
      totalConnections: accountHealthList.length,
      healthyCount,
      degradedCount,
      errorCount,
      requiresReauthCount,
      overallHealthScore,
      accounts: accountHealthList,
      providerHealth,
    };
  }

  /**
   * Get health for a single account
   */
  async getAccountHealth(accountId: string): Promise<AccountConnectionHealth | null> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { connection: true },
    });

    if (!account) return null;

    const summary = await this.getConnectionHealth(account.spaceId);
    return summary.accounts.find((a) => a.accountId === accountId) || null;
  }

  /**
   * Record a connection attempt for health tracking
   */
  async recordConnectionAttempt(
    spaceId: string,
    accountId: string | null,
    provider: Provider,
    status: 'success' | 'failure',
    options?: {
      institutionId?: string;
      attemptType?: string;
      errorCode?: string;
      errorMessage?: string;
      responseTimeMs?: number;
      failoverUsed?: boolean;
      failoverProvider?: Provider;
    }
  ): Promise<void> {
    await this.prisma.connectionAttempt.create({
      data: {
        spaceId,
        accountId,
        provider,
        status,
        institutionId: options?.institutionId,
        attemptType: options?.attemptType || 'sync',
        errorCode: options?.errorCode,
        errorMessage: options?.errorMessage,
        responseTimeMs: options?.responseTimeMs,
        failoverUsed: options?.failoverUsed || false,
        failoverProvider: options?.failoverProvider,
      },
    });

    // Update circuit breaker
    if (status === 'success' && options?.responseTimeMs) {
      await this.circuitBreakerService.recordSuccess(provider, 'US', options.responseTimeMs);
    } else if (status === 'failure' && options?.errorMessage) {
      await this.circuitBreakerService.recordFailure(
        provider,
        'US',
        options.errorMessage,
        options?.responseTimeMs
      );
    }
  }

  /**
   * Get accounts that need attention (errors, reauth, degraded)
   */
  async getAccountsNeedingAttention(spaceId: string): Promise<AccountConnectionHealth[]> {
    const summary = await this.getConnectionHealth(spaceId);
    return summary.accounts.filter(
      (a) => a.status === 'error' || a.status === 'requires_reauth' || a.status === 'disconnected'
    );
  }

  /**
   * Check if any accounts in a space need re-authorization
   * Used for sending notifications
   */
  async getAccountsRequiringReauth(spaceId: string): Promise<string[]> {
    const summary = await this.getConnectionHealth(spaceId);
    return summary.accounts.filter((a) => a.status === 'requires_reauth').map((a) => a.accountId);
  }
}
