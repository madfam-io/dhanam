import { Injectable, Logger } from '@nestjs/common';
import { PostHogService } from '../analytics/posthog.service';

@Injectable()
export class ProvidersAnalytics {
  private readonly logger = new Logger(ProvidersAnalytics.name);

  constructor(private readonly posthogService: PostHogService) {}

  /**
   * Track when a provider sync completes successfully
   */
  async trackSyncSuccess(
    userId: string,
    provider: string,
    metadata: {
      accountCount: number;
      transactionCount: number;
      duration: number;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'sync_success',
        properties: {
          provider,
          account_count: metadata.accountCount,
          transaction_count: metadata.transactionCount,
          duration_ms: metadata.duration,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track sync success:', error);
    }
  }

  /**
   * Track when a provider sync fails
   */
  async trackSyncFailed(userId: string, provider: string, error: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'sync_failed',
        properties: {
          provider,
          error_message: error,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track sync failure:', error);
    }
  }

  /**
   * Track when a user initiates a provider connection
   */
  async trackConnectionInitiated(userId: string, provider: string, institution?: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'connect_initiated',
        properties: {
          provider,
          institution,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track connection initiated:', error);
    }
  }

  /**
   * Track when a provider connection succeeds
   */
  async trackConnectionSuccess(
    userId: string,
    provider: string,
    metadata: {
      institution?: string;
      accountCount: number;
      connectionTime: number;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'connect_success',
        properties: {
          provider,
          institution: metadata.institution,
          account_count: metadata.accountCount,
          connection_time_ms: metadata.connectionTime,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track connection success:', error);
    }
  }

  /**
   * Track when a provider connection fails
   */
  async trackConnectionFailed(
    userId: string,
    provider: string,
    error: string,
    institution?: string
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'connect_failed',
        properties: {
          provider,
          institution,
          error_message: error,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track connection failure:', error);
    }
  }

  /**
   * Track when a provider connection is disconnected
   */
  async trackConnectionDisconnected(userId: string, provider: string, reason?: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'connect_disconnected',
        properties: {
          provider,
          reason: reason || 'user_initiated',
        },
      });
    } catch (error) {
      this.logger.error('Failed to track connection disconnected:', error);
    }
  }

  /**
   * Track manual account refresh
   */
  async trackManualRefresh(userId: string, provider: string, accountId: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'manual_refresh',
        properties: {
          provider,
          account_id: accountId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track manual refresh:', error);
    }
  }

  /**
   * Track provider webhook received
   */
  async trackWebhookReceived(provider: string, eventType: string, processed: boolean): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: 'system',
        event: 'provider_webhook_received',
        properties: {
          provider,
          event_type: eventType,
          processed,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track webhook:', error);
    }
  }
}
