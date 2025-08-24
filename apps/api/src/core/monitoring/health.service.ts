import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { PrismaService } from '@core/prisma/prisma.service';
import { QueueService } from '@modules/jobs/queue.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    queues: HealthCheck;
    external: HealthCheck;
  };
  version: string;
  environment: string;
}

export interface HealthCheck {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
  details?: any;
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService
  ) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues(),
      this.checkExternalServices(),
    ]);

    const mappedChecks = checks.map((result) =>
      result.status === 'fulfilled' ? result.value : this.createFailedCheck(result.reason)
    );

    // Ensure we have all 4 checks
    const database = mappedChecks[0] || this.createFailedCheck('Database check failed');
    const redis = mappedChecks[1] || this.createFailedCheck('Redis check failed');
    const queues = mappedChecks[2] || this.createFailedCheck('Queue check failed');
    const external = mappedChecks[3] || this.createFailedCheck('External check failed');

    const overallStatus = this.determineOverallStatus(mappedChecks);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks: {
        database,
        redis,
        queues,
        external,
      },
      version: process.env.npm_package_version || '0.1.0',
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }

  async getReadinessStatus(): Promise<{ ready: boolean; checks: any }> {
    const health = await this.getHealthStatus();
    const criticalServices = [health.checks.database, health.checks.redis];

    const ready = criticalServices.every((check) => check.status === 'up');

    return {
      ready,
      checks: health.checks,
    };
  }

  async getLivenessStatus(): Promise<{ alive: boolean; uptime: number }> {
    return {
      alive: true,
      uptime: Date.now() - this.startTime,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'up',
        responseTime: Date.now() - start,
        details: {
          connection: 'active',
        },
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    const redisUrl = this.configService.get('REDIS_URL');

    if (!redisUrl) {
      return {
        status: 'down',
        error: 'Redis URL not configured',
      };
    }

    try {
      const redis = new Redis(redisUrl);
      await redis.ping();
      redis.disconnect();

      return {
        status: 'up',
        responseTime: Date.now() - start,
        details: {
          connection: 'active',
        },
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Redis check failed',
      };
    }
  }

  private async checkQueues(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const queueStats = await this.queueService.getAllQueueStats();

      const hasFailedQueues = queueStats.some((queue: any) => queue.failed > 0);

      return {
        status: hasFailedQueues ? 'down' : 'up',
        responseTime: Date.now() - start,
        details: {
          queues: queueStats.length,
          totalJobs: queueStats.reduce(
            (sum: number, q: any) => sum + q.active + q.waiting + q.completed,
            0
          ),
          failedJobs: queueStats.reduce((sum: number, q: any) => sum + q.failed, 0),
        },
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Queue check failed',
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    const start = Date.now();
    const checks = [];

    // Check if external API endpoints are accessible
    const endpoints = [
      { name: 'Banxico', url: 'https://www.banxico.org.mx/SieAPIRest/service/v1/doc' },
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(endpoint.url, {
          signal: controller.signal,
          method: 'HEAD',
        });

        clearTimeout(timeoutId);

        checks.push({
          name: endpoint.name,
          status: response.ok ? 'up' : 'down',
          statusCode: response.status,
        });
      } catch (error) {
        checks.push({
          name: endpoint.name,
          status: 'down',
          error: error instanceof Error ? error.message : 'Connection failed',
        });
      }
    }

    const allUp = checks.every((check) => check.status === 'up');

    return {
      status: allUp ? 'up' : 'down',
      responseTime: Date.now() - start,
      details: { services: checks },
    };
  }

  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const upCount = checks.filter((check) => check.status === 'up').length;
    const totalChecks = checks.length;

    if (upCount === totalChecks) {
      return 'healthy';
    } else if (upCount >= totalChecks * 0.7) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  private createFailedCheck(error: any): HealthCheck {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Health check failed',
    };
  }
}
