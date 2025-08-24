import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';
import { RedisService } from '@core/redis/redis.service';
import { AuditService } from '@core/audit/audit.service';
import {
  UserSearchDto,
  UserDetailsDto,
  SystemStatsDto,
  AuditLogSearchDto,
  OnboardingFunnelDto,
  FeatureFlagDto,
  UpdateFeatureFlagDto,
  PaginatedResponseDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly FEATURE_FLAGS_KEY = 'admin:feature_flags';
  private readonly STATS_CACHE_KEY = 'admin:system_stats';
  private readonly STATS_CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private redis: RedisService,
    private auditService: AuditService,
  ) {}

  async searchUsers(dto: UserSearchDto): Promise<PaginatedResponseDto<any>> {
    const where: Prisma.UserWhereInput = {};

    if (dto.search) {
      where.OR = [
        { email: { contains: dto.search, mode: 'insensitive' } },
        { name: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    if (dto.isActive !== undefined) {
      where.isActive = dto.isActive;
    }

    if (dto.emailVerified !== undefined) {
      where.emailVerified = dto.emailVerified;
    }

    if (dto.totpEnabled !== undefined) {
      where.totpEnabled = dto.totpEnabled;
    }

    if (dto.onboardingCompleted !== undefined) {
      where.onboardingCompleted = dto.onboardingCompleted;
    }

    if (dto.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: new Date(dto.createdAfter) };
    }

    if (dto.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(dto.createdBefore) };
    }

    const skip = (dto.page - 1) * dto.limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: dto.limit,
        orderBy: { [dto.sortBy]: dto.sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          locale: true,
          timezone: true,
          emailVerified: true,
          isActive: true,
          totpEnabled: true,
          onboardingCompleted: true,
          onboardingCompletedAt: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              userSpaces: true,
              sessions: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map(user => ({
      ...user,
      spaceCount: user._count.userSpaces,
      sessionCount: user._count.sessions,
      _count: undefined,
    }));

    return {
      data,
      meta: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  async getUserDetails(userId: string, adminUserId: string): Promise<UserDetailsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSpaces: {
          include: {
            space: {
              include: {
                _count: {
                  select: {
                    accounts: true,
                    budgets: true,
                  },
                },
              },
            },
          },
        },
        providerConnections: true,
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Log admin access to user details
    await this.auditService.log({
      userId: adminUserId,
      action: 'admin.view_user_details',
      resource: 'User',
      resourceId: userId,
      metadata: JSON.stringify({ viewedUserId: userId }),
      severity: 'medium',
    });

    // Get transaction and account counts
    const spaces = user.userSpaces.map(us => us.spaceId);
    const [transactionCount, accountCount] = await Promise.all([
      this.prisma.transaction.count({
        where: {
          account: {
            spaceId: { in: spaces },
          },
        },
      }),
      this.prisma.account.count({
        where: {
          spaceId: { in: spaces },
        },
      }),
    ]);

    // Get last sync and transaction dates
    const lastTransaction = await this.prisma.transaction.findFirst({
      where: {
        account: {
          spaceId: { in: spaces },
        },
      },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    const lastSync = await this.prisma.account.findFirst({
      where: {
        spaceId: { in: spaces },
      },
      orderBy: { lastSyncAt: 'desc' },
      select: { lastSyncAt: true },
    });

    // Format provider connections
    const connectionsByProvider = user.providerConnections.reduce((acc, conn) => {
      if (!acc[conn.provider]) {
        acc[conn.provider] = {
          provider: conn.provider,
          connectedAt: conn.createdAt,
          accountCount: 0,
          status: 'active' as const,
        };
      }
      return acc;
    }, {} as Record<string, any>);

    // Get account counts per provider
    const accounts = await this.prisma.account.findMany({
      where: { spaceId: { in: spaces } },
      select: { provider: true, lastSyncAt: true, status: true },
    });

    accounts.forEach(account => {
      if (connectionsByProvider[account.provider]) {
        connectionsByProvider[account.provider].accountCount++;
        if (account.lastSyncAt > (connectionsByProvider[account.provider].lastSyncAt || new Date(0))) {
          connectionsByProvider[account.provider].lastSyncAt = account.lastSyncAt;
        }
        if (account.status === 'error') {
          connectionsByProvider[account.provider].status = 'error';
        }
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      timezone: user.timezone,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      totpEnabled: user.totpEnabled,
      onboardingCompleted: user.onboardingCompleted,
      onboardingCompletedAt: user.onboardingCompletedAt,
      onboardingStep: user.onboardingStep,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      spaces: user.userSpaces.map(us => ({
        id: us.space.id,
        name: us.space.name,
        type: us.space.type,
        role: us.role,
        currency: us.space.currency,
        joinedAt: us.createdAt,
        accountCount: us.space._count.accounts,
        transactionCount: 0, // Would need separate query
        budgetCount: us.space._count.budgets,
      })),
      connections: Object.values(connectionsByProvider),
      activitySummary: {
        totalTransactions: transactionCount,
        totalAccounts: accountCount,
        totalBudgets: user.userSpaces.reduce((sum, us) => sum + us.space._count.budgets, 0),
        lastTransactionDate: lastTransaction?.date,
        lastSyncDate: lastSync?.lastSyncAt,
      },
      recentAuditLogs: user.auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        severity: log.severity,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
      })),
      sessions: {
        activeCount: user.sessions.length,
        lastSessionCreated: user.sessions[0]?.createdAt,
        recentIpAddresses: [...new Set(user.auditLogs.map(log => log.ipAddress).filter(Boolean))],
      },
    };
  }

  async getSystemStats(): Promise<SystemStatsDto> {
    // Try to get from cache first
    const cached = await this.redis.get(this.STATS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalSpaces,
      spacesByType,
      totalAccounts,
      activeConnections,
      totalTransactions,
      recentTransactions,
      totalBudgets,
      activeBudgets,
      providerConnections,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.space.count(),
      this.prisma.space.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.account.count(),
      this.prisma.account.count({
        where: { status: 'active' },
      }),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({
        where: { date: { gte: thirtyDaysAgo } },
      }),
      this.prisma.budget.count(),
      this.prisma.budget.count({
        where: { isActive: true },
      }),
      this.prisma.account.groupBy({
        by: ['provider'],
        _count: true,
      }),
    ]);

    // Get job queue status
    const queueStatus = await this.getQueueStatus();

    // Get last sync runs
    const lastSyncJob = await this.prisma.auditLog.findFirst({
      where: { action: 'job.sync_completed' },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    const lastSnapshotJob = await this.prisma.auditLog.findFirst({
      where: { action: 'job.snapshot_completed' },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    const stats: SystemStatsDto = {
      totalUsers,
      activeUsers,
      newUsers,
      totalSpaces,
      personalSpaces: spacesByType.find(s => s.type === 'personal')?._count || 0,
      businessSpaces: spacesByType.find(s => s.type === 'business')?._count || 0,
      totalAccounts,
      activeConnections,
      totalTransactions,
      recentTransactions,
      totalBudgets,
      activeBudgets,
      providerConnections: {
        belvo: providerConnections.find(p => p.provider === 'belvo')?._count || 0,
        plaid: providerConnections.find(p => p.provider === 'plaid')?._count || 0,
        bitso: providerConnections.find(p => p.provider === 'bitso')?._count || 0,
        manual: providerConnections.find(p => p.provider === 'manual')?._count || 0,
      },
      systemHealth: {
        databaseConnections: await this.getDatabaseConnections(),
        redisConnected: await this.redis.ping(),
        jobQueueStatus: queueStatus,
        lastSyncRun: lastSyncJob?.timestamp,
        lastSnapshotRun: lastSnapshotJob?.timestamp,
      },
    };

    // Cache the stats
    await this.redis.set(this.STATS_CACHE_KEY, JSON.stringify(stats), this.STATS_CACHE_TTL);

    return stats;
  }

  async searchAuditLogs(dto: AuditLogSearchDto): Promise<PaginatedResponseDto<any>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (dto.userId) {
      where.userId = dto.userId;
    }

    if (dto.action) {
      where.action = { contains: dto.action, mode: 'insensitive' };
    }

    if (dto.resource) {
      where.resource = dto.resource;
    }

    if (dto.resourceId) {
      where.resourceId = dto.resourceId;
    }

    if (dto.severity) {
      where.severity = dto.severity;
    }

    if (dto.ipAddress) {
      where.ipAddress = dto.ipAddress;
    }

    if (dto.startDate || dto.endDate) {
      where.timestamp = {};
      if (dto.startDate) {
        where.timestamp.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.timestamp.lte = new Date(dto.endDate);
      }
    }

    const skip = (dto.page - 1) * dto.limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: dto.limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  async getOnboardingFunnel(): Promise<OnboardingFunnelDto> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get users by onboarding status
    const [
      totalStarted,
      emailVerified,
      profileSetup,
      spaceCreated,
      firstConnection,
      completed,
      completionTimes,
      timeBasedMetrics,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { emailVerified: true } }),
      this.prisma.user.count({ where: { onboardingStep: 'profile_setup' } }),
      this.prisma.user.count({
        where: {
          userSpaces: { some: {} },
        },
      }),
      this.prisma.user.count({
        where: {
          providerConnections: { some: {} },
        },
      }),
      this.prisma.user.count({ where: { onboardingCompleted: true } }),
      this.prisma.user.findMany({
        where: {
          onboardingCompleted: true,
          onboardingCompletedAt: { not: null },
        },
        select: {
          createdAt: true,
          onboardingCompletedAt: true,
        },
      }),
      Promise.all([
        this.getTimeBasedMetrics(twentyFourHoursAgo),
        this.getTimeBasedMetrics(sevenDaysAgo),
        this.getTimeBasedMetrics(thirtyDaysAgo),
      ]),
    ]);

    // Calculate average completion time
    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, user) => {
          const timeDiff = user.onboardingCompletedAt.getTime() - user.createdAt.getTime();
          return sum + timeDiff / (1000 * 60 * 60); // Convert to hours
        }, 0) / completionTimes.length
      : 0;

    // Get first connection provider breakdown
    const firstConnections = await this.prisma.user.findMany({
      where: {
        providerConnections: { some: {} },
      },
      include: {
        providerConnections: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    const providerBreakdown = firstConnections.reduce((acc, user) => {
      const provider = user.providerConnections[0]?.provider || 'none';
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStarted,
      stepBreakdown: {
        emailVerification: emailVerified,
        profileSetup,
        spaceCreation: spaceCreated,
        firstConnection,
        completed,
      },
      conversionRates: {
        startToEmailVerified: totalStarted > 0 ? (emailVerified / totalStarted) * 100 : 0,
        emailVerifiedToProfile: emailVerified > 0 ? (profileSetup / emailVerified) * 100 : 0,
        profileToSpace: profileSetup > 0 ? (spaceCreated / profileSetup) * 100 : 0,
        spaceToConnection: spaceCreated > 0 ? (firstConnection / spaceCreated) * 100 : 0,
        connectionToComplete: firstConnection > 0 ? (completed / firstConnection) * 100 : 0,
        overallConversion: totalStarted > 0 ? (completed / totalStarted) * 100 : 0,
      },
      averageCompletionTime: avgCompletionTime,
      abandonmentRates: {
        emailVerification: totalStarted > 0 ? ((totalStarted - emailVerified) / totalStarted) * 100 : 0,
        profileSetup: emailVerified > 0 ? ((emailVerified - profileSetup) / emailVerified) * 100 : 0,
        spaceCreation: profileSetup > 0 ? ((profileSetup - spaceCreated) / profileSetup) * 100 : 0,
        firstConnection: spaceCreated > 0 ? ((spaceCreated - firstConnection) / spaceCreated) * 100 : 0,
      },
      timeMetrics: {
        last24Hours: timeBasedMetrics[0],
        last7Days: timeBasedMetrics[1],
        last30Days: timeBasedMetrics[2],
      },
      firstConnectionProviders: {
        belvo: providerBreakdown.belvo || 0,
        plaid: providerBreakdown.plaid || 0,
        bitso: providerBreakdown.bitso || 0,
        manual: providerBreakdown.manual || 0,
        none: totalStarted - firstConnection,
      },
    };
  }

  async getFeatureFlags(): Promise<FeatureFlagDto[]> {
    const flags = await this.redis.hgetall(this.FEATURE_FLAGS_KEY);
    return Object.entries(flags).map(([key, value]) => ({
      key,
      ...JSON.parse(value),
    }));
  }

  async getFeatureFlag(key: string): Promise<FeatureFlagDto | null> {
    const flag = await this.redis.hget(this.FEATURE_FLAGS_KEY, key);
    if (!flag) {
      return null;
    }
    return {
      key,
      ...JSON.parse(flag),
    };
  }

  async updateFeatureFlag(key: string, dto: UpdateFeatureFlagDto, adminUserId: string): Promise<FeatureFlagDto> {
    const existingFlag = await this.getFeatureFlag(key);
    if (!existingFlag) {
      throw new NotFoundException('Feature flag not found');
    }

    const updatedFlag = {
      ...existingFlag,
      ...dto,
    };

    await this.redis.hset(this.FEATURE_FLAGS_KEY, key, JSON.stringify(updatedFlag));

    // Log the change
    await this.auditService.log({
      userId: adminUserId,
      action: 'admin.update_feature_flag',
      resource: 'FeatureFlag',
      resourceId: key,
      metadata: JSON.stringify({ changes: dto }),
      severity: 'high',
    });

    this.logger.info(`Feature flag ${key} updated by admin ${adminUserId}`, {
      flag: key,
      changes: dto,
      adminUserId,
    });

    return updatedFlag;
  }

  private async getDatabaseConnections(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT count(*) as connection_count
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;
      return parseInt(result[0]?.connection_count || '0');
    } catch (error) {
      this.logger.error('Failed to get database connections', error);
      return 0;
    }
  }

  private async getQueueStatus(): Promise<'active' | 'error' | 'idle'> {
    try {
      // Check if there are any failed jobs in recent history
      const failedJobs = await this.prisma.auditLog.count({
        where: {
          action: { startsWith: 'job.failed' },
          timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        },
      });

      if (failedJobs > 0) {
        return 'error';
      }

      // Check if there are active jobs
      const activeJobs = await this.prisma.auditLog.count({
        where: {
          action: { startsWith: 'job.started' },
          timestamp: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
        },
      });

      return activeJobs > 0 ? 'active' : 'idle';
    } catch (error) {
      this.logger.error('Failed to get queue status', error);
      return 'error';
    }
  }

  private async getTimeBasedMetrics(since: Date): Promise<{ started: number; completed: number }> {
    const [started, completed] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.user.count({
        where: {
          onboardingCompleted: true,
          onboardingCompletedAt: { gte: since },
        },
      }),
    ]);

    return { started, completed };
  }
}