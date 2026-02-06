import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '@core/prisma/prisma.service';
import { Provider } from '@db';
import { ConnectionHealthService } from '@modules/providers/connection-health/connection-health.service';
import { ErrorMessagesService } from '@modules/providers/connection-health/error-messages.service';
import { CircuitBreakerService } from '@modules/providers/orchestrator/circuit-breaker.service';
import { RateLimiterService } from '@modules/providers/orchestrator/rate-limiter.service';

import { QueueService } from '../queue.service';

interface HealthCheckResult {
  spaceId: string;
  userId: string;
  accountsChecked: number;
  issuesFound: number;
  notifications: Array<{
    type: 'error' | 'reauth' | 'degraded';
    accountId: string;
    accountName: string;
    message: string;
  }>;
}

/**
 * Scheduled processor that proactively checks connection health
 * and notifies users of issues before they become critical
 */
@Injectable()
export class ConnectionHealthCheckProcessor implements OnModuleInit {
  private readonly logger = new Logger(ConnectionHealthCheckProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionHealthService: ConnectionHealthService,
    private readonly errorMessagesService: ErrorMessagesService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly queueService: QueueService
  ) {}

  async onModuleInit() {
    this.logger.log('Connection Health Check Processor initialized');
  }

  /**
   * Run health checks every 15 minutes
   */
  @Cron('*/15 * * * *')
  async checkConnectionHealth() {
    if (this.isProcessing) {
      this.logger.warn('Skipping health check - previous job still running');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting scheduled connection health check...');

      // Get all active spaces with connected accounts
      const spacesWithConnections = await this.prisma.space.findMany({
        where: {
          accounts: {
            some: {
              provider: { not: 'manual' },
            },
          },
        },
        include: {
          userSpaces: {
            where: {
              role: 'owner',
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  preferences: {
                    select: {
                      pushNotifications: true,
                      emailNotifications: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      this.logger.log(`Checking ${spacesWithConnections.length} spaces with connections`);

      let totalIssuesFound = 0;
      let notificationsSent = 0;

      for (const space of spacesWithConnections) {
        const result = await this.checkSpaceHealth(space.id);
        totalIssuesFound += result.issuesFound;

        // Send notifications to space owner
        const owner = space.userSpaces[0]?.user;
        if (owner && result.notifications.length > 0) {
          const sentCount = await this.sendNotifications(owner, space.name, result.notifications);
          notificationsSent += sentCount;
        }
      }

      // Check provider-level health
      await this.checkProviderHealth();

      const duration = (Date.now() - startTime) / 1000;
      this.logger.log(
        `Health check complete: ${totalIssuesFound} issues found, ` +
          `${notificationsSent} notifications sent in ${duration.toFixed(2)}s`
      );
    } catch (error) {
      this.logger.error('Error during connection health check:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check health for a single space
   */
  private async checkSpaceHealth(spaceId: string): Promise<HealthCheckResult> {
    const healthSummary = await this.connectionHealthService.getConnectionHealth(spaceId);

    const notifications: HealthCheckResult['notifications'] = [];

    for (const account of healthSummary.accounts) {
      // Check for issues requiring notification
      if (account.status === 'requires_reauth') {
        const errorDetails = this.errorMessagesService.getErrorMessage(
          account.provider,
          null,
          'Authentication expired'
        );
        notifications.push({
          type: 'reauth',
          accountId: account.accountId,
          accountName: account.accountName,
          message: errorDetails.message,
        });
      } else if (account.status === 'error') {
        const errorDetails = this.errorMessagesService.getErrorMessage(
          account.provider,
          null,
          account.errorMessage
        );
        notifications.push({
          type: 'error',
          accountId: account.accountId,
          accountName: account.accountName,
          message: errorDetails.message,
        });
      } else if (account.status === 'degraded' && account.consecutiveFails >= 3) {
        // Only notify for degraded if there are multiple failures
        notifications.push({
          type: 'degraded',
          accountId: account.accountId,
          accountName: account.accountName,
          message: `${account.accountName} is experiencing sync delays`,
        });
      }
    }

    // Get space owner
    const spaceOwner = await this.prisma.userSpace.findFirst({
      where: { spaceId, role: 'owner' },
      select: { userId: true },
    });

    return {
      spaceId,
      userId: spaceOwner?.userId || '',
      accountsChecked: healthSummary.totalConnections,
      issuesFound: notifications.length,
      notifications,
    };
  }

  /**
   * Check overall provider health and update status
   */
  private async checkProviderHealth() {
    const providers: Provider[] = ['belvo', 'plaid', 'mx', 'finicity', 'bitso', 'blockchain'];

    for (const provider of providers) {
      try {
        // Check circuit breaker state
        const circuitState = await this.circuitBreakerService.getState(provider, 'US');

        // Check rate limit status
        const rateLimitStatus = await this.rateLimiterService.getRateLimitStatus(provider);

        // Log provider health
        if (circuitState.state === 'open') {
          this.logger.warn(`Provider ${provider} circuit breaker is OPEN`);
        }

        if (rateLimitStatus.isLimited) {
          this.logger.warn(
            `Provider ${provider} is rate limited. Backoff until: ${rateLimitStatus.backoffUntil}`
          );
        }

        // Update provider health timestamp
        await this.prisma.providerHealthStatus.upsert({
          where: {
            provider_region: { provider, region: 'US' },
          },
          create: {
            provider,
            region: 'US',
            status: circuitState.state === 'open' ? 'down' : 'healthy',
            lastHealthCheckAt: new Date(),
          },
          update: {
            lastHealthCheckAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(`Error checking health for provider ${provider}:`, error);
      }
    }
  }

  /**
   * Send notifications to user about connection issues
   */
  private async sendNotifications(
    user: {
      id: string;
      email: string;
      preferences: { pushNotifications: boolean; emailNotifications: boolean } | null;
    },
    spaceName: string,
    notifications: HealthCheckResult['notifications']
  ): Promise<number> {
    if (!user.preferences?.emailNotifications && !user.preferences?.pushNotifications) {
      return 0;
    }

    // Check if we've already notified about these issues recently (within 24h)
    const recentNotifications = await this.prisma.userNotification.findMany({
      where: {
        userId: user.id,
        type: { in: ['connection_error', 'connection_reauth', 'connection_degraded'] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const recentAccountIds = new Set(
      recentNotifications
        .map((n) => (n.metadata as { accountId?: string })?.accountId)
        .filter(Boolean)
    );

    // Filter out already-notified accounts
    const newNotifications = notifications.filter((n) => !recentAccountIds.has(n.accountId));

    if (newNotifications.length === 0) {
      return 0;
    }

    // Group by type for consolidated notification
    const errorCount = newNotifications.filter((n) => n.type === 'error').length;
    const reauthCount = newNotifications.filter((n) => n.type === 'reauth').length;
    const degradedCount = newNotifications.filter((n) => n.type === 'degraded').length;

    const summary = this.errorMessagesService.getSummaryMessage(
      errorCount,
      reauthCount,
      degradedCount
    );

    // Create notification record
    await this.prisma.userNotification.create({
      data: {
        userId: user.id,
        type:
          reauthCount > 0
            ? 'connection_reauth'
            : errorCount > 0
              ? 'connection_error'
              : 'connection_degraded',
        title: 'Account Connection Issue',
        message: summary.text,
        metadata: {
          spaceName,
          messageKey: summary.key,
          messageParams: summary.params,
          accounts: newNotifications.map((n) => ({
            accountId: n.accountId,
            accountName: n.accountName,
            type: n.type,
          })),
        },
      },
    });

    // Send email if enabled
    if (user.preferences?.emailNotifications) {
      await this.queueService.addEmailJob({
        to: user.email,
        template: 'connection-health-alert',
        data: {
          spaceName,
          summaryMessage: summary.text,
          accounts: newNotifications,
          actionUrl: '/accounts/health',
        },
      });
    }

    return newNotifications.length;
  }

  /**
   * Manual trigger for testing or admin use
   */
  async triggerHealthCheck(spaceId?: string): Promise<void> {
    if (spaceId) {
      const result = await this.checkSpaceHealth(spaceId);
      this.logger.log(
        `Manual health check for space ${spaceId}: ${result.issuesFound} issues found`
      );
    } else {
      await this.checkConnectionHealth();
    }
  }
}
