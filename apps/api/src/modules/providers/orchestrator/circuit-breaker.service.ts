import { Injectable, Logger } from '@nestjs/common';
import { Provider } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

import { CircuitBreakerConfig, CircuitBreakerState } from './provider.interface';

/**
 * Circuit Breaker implementation to prevent cascading failures
 * When a provider consistently fails, the circuit opens and requests fail fast
 * After a timeout, circuit moves to half-open to test if provider recovered
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  private readonly defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,        // Open after 5 failures
    successThreshold: 2,         // Close after 2 successes
    timeout: 60000,              // Try again after 60 seconds
    monitoringWindow: 300000,    // 5 minute rolling window
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Check if circuit is open for a provider
   */
  async isCircuitOpen(provider: Provider, region: string = 'US'): Promise<boolean> {
    const health = await this.prisma.providerHealthStatus.findUnique({
      where: {
        provider_region: {
          provider,
          region,
        },
      },
    });

    if (!health) {
      return false; // No health record = circuit closed
    }

    // If circuit breaker is explicitly open, check if timeout has passed
    if (health.circuitBreakerOpen) {
      const timeoutPassed =
        Date.now() - health.updatedAt.getTime() > this.defaultConfig.timeout;

      if (timeoutPassed) {
        // Move to half-open state
        this.logger.log(
          `Circuit breaker timeout passed for ${provider}. Moving to half-open state.`
        );
        await this.setHalfOpen(provider, region);
        return false; // Allow one attempt
      }

      return true; // Circuit still open
    }

    return false;
  }

  /**
   * Record a successful provider call
   */
  async recordSuccess(
    provider: Provider,
    region: string,
    responseTimeMs: number
  ): Promise<void> {
    const now = new Date();

    await this.prisma.providerHealthStatus.upsert({
      where: {
        provider_region: {
          provider,
          region,
        },
      },
      create: {
        provider,
        region,
        status: 'healthy',
        successfulCalls: 1,
        failedCalls: 0,
        avgResponseTimeMs: responseTimeMs,
        lastSuccessAt: now,
        circuitBreakerOpen: false,
        windowStartAt: now,
      },
      update: {
        successfulCalls: { increment: 1 },
        lastSuccessAt: now,
        avgResponseTimeMs: responseTimeMs,
        status: 'healthy',
        circuitBreakerOpen: false, // Close circuit on success
      },
    });

    this.logger.debug(`Recorded success for ${provider} in ${region}`);
  }

  /**
   * Record a failed provider call
   */
  async recordFailure(
    provider: Provider,
    region: string,
    error: string,
    responseTimeMs?: number
  ): Promise<void> {
    const now = new Date();

    const health = await this.prisma.providerHealthStatus.upsert({
      where: {
        provider_region: {
          provider,
          region,
        },
      },
      create: {
        provider,
        region,
        status: 'degraded',
        successfulCalls: 0,
        failedCalls: 1,
        avgResponseTimeMs: responseTimeMs || 0,
        lastFailureAt: now,
        lastError: error,
        circuitBreakerOpen: false,
        windowStartAt: now,
      },
      update: {
        failedCalls: { increment: 1 },
        lastFailureAt: now,
        lastError: error,
        status: 'degraded',
      },
    });

    // Check if we should open the circuit breaker
    const shouldOpen = await this.shouldOpenCircuit(health);

    if (shouldOpen) {
      await this.openCircuit(provider, region);
    }

    this.logger.warn(
      `Recorded failure for ${provider} in ${region}: ${error}. ` +
        `Failed calls: ${health.failedCalls + 1}`
    );
  }

  /**
   * Determine if circuit should open based on failure rate
   */
  private async shouldOpenCircuit(health: any): Promise<boolean> {
    const windowAge = Date.now() - health.windowStartAt.getTime();

    // Reset window if it's older than monitoring window
    if (windowAge > this.defaultConfig.monitoringWindow) {
      await this.prisma.providerHealthStatus.update({
        where: { id: health.id },
        data: {
          successfulCalls: 0,
          failedCalls: 0,
          windowStartAt: new Date(),
        },
      });
      return false;
    }

    // Open if failure threshold exceeded
    const totalCalls = health.successfulCalls + health.failedCalls + 1; // +1 for current failure
    const failureRate = totalCalls > 0 ? ((health.failedCalls + 1) / totalCalls) * 100 : 0;

    return (
      health.failedCalls + 1 >= this.defaultConfig.failureThreshold && failureRate > 50
    );
  }

  /**
   * Open the circuit breaker for a provider
   */
  private async openCircuit(provider: Provider, region: string): Promise<void> {
    await this.prisma.providerHealthStatus.update({
      where: {
        provider_region: {
          provider,
          region,
        },
      },
      data: {
        circuitBreakerOpen: true,
        status: 'down',
      },
    });

    this.logger.error(
      `🚨 Circuit breaker OPENED for ${provider} in ${region}. ` +
        `Provider marked as down. Will retry after ${this.defaultConfig.timeout}ms.`
    );
  }

  /**
   * Move circuit to half-open state (testing if provider recovered)
   */
  private async setHalfOpen(provider: Provider, region: string): Promise<void> {
    await this.prisma.providerHealthStatus.update({
      where: {
        provider_region: {
          provider,
          region,
        },
      },
      data: {
        status: 'degraded',
        // Don't fully close yet, wait for successful call
      },
    });

    this.logger.log(`Circuit breaker moved to HALF-OPEN for ${provider} in ${region}`);
  }

  /**
   * Get current circuit breaker state
   */
  async getState(provider: Provider, region: string): Promise<CircuitBreakerState> {
    const health = await this.prisma.providerHealthStatus.findUnique({
      where: {
        provider_region: {
          provider,
          region,
        },
      },
    });

    if (!health) {
      return {
        provider,
        region,
        state: 'closed',
        failures: 0,
        successes: 0,
      };
    }

    let state: 'closed' | 'open' | 'half-open' = 'closed';
    if (health.circuitBreakerOpen) {
      const timeoutPassed =
        Date.now() - health.updatedAt.getTime() > this.defaultConfig.timeout;
      state = timeoutPassed ? 'half-open' : 'open';
    }

    return {
      provider,
      region,
      state,
      failures: health.failedCalls,
      successes: health.successfulCalls,
      lastFailureAt: health.lastFailureAt || undefined,
      lastSuccessAt: health.lastSuccessAt || undefined,
      nextAttemptAt:
        state === 'open'
          ? new Date(health.updatedAt.getTime() + this.defaultConfig.timeout)
          : undefined,
    };
  }

  /**
   * Reset circuit breaker for a provider (for testing/admin purposes)
   */
  async reset(provider: Provider, region: string): Promise<void> {
    await this.prisma.providerHealthStatus.update({
      where: {
        provider_region: {
          provider,
          region,
        },
      },
      data: {
        circuitBreakerOpen: false,
        status: 'healthy',
        successfulCalls: 0,
        failedCalls: 0,
        errorRate: 0,
        windowStartAt: new Date(),
      },
    });

    this.logger.log(`Circuit breaker RESET for ${provider} in ${region}`);
  }
}
