import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IntegrationStatus {
  name: string;
  enabled: boolean;
  configured: boolean;
  environment: string;
  lastSync?: Date;
}

@Injectable()
export class IntegrationsService {
  constructor(private readonly configService: ConfigService) {}

  async getStatus(): Promise<{
    integrations: IntegrationStatus[];
    summary: {
      total: number;
      enabled: number;
      configured: number;
    };
  }> {
    const integrations: IntegrationStatus[] = [
      {
        name: 'Belvo',
        enabled: this.isBelvoEnabled(),
        configured: this.isBelvoConfigured(),
        environment: this.configService.get('BELVO_ENV', 'sandbox'),
      },
      {
        name: 'Plaid',
        enabled: this.isPlaidEnabled(),
        configured: this.isPlaidConfigured(),
        environment: this.configService.get('PLAID_ENV', 'sandbox'),
      },
      {
        name: 'Bitso',
        enabled: this.isBitsoEnabled(),
        configured: this.isBitsoConfigured(),
        environment: 'production',
      },
    ];

    const summary = {
      total: integrations.length,
      enabled: integrations.filter((i) => i.enabled).length,
      configured: integrations.filter((i) => i.configured).length,
    };

    return { integrations, summary };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    integrations: Array<{
      name: string;
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
    }>;
  }> {
    const integrationHealth = await Promise.allSettled([
      this.checkBelvoHealth(),
      this.checkPlaidHealth(),
      this.checkBitsoHealth(),
    ]);

    const results = integrationHealth.map((result, index) => {
      const names = ['Belvo', 'Plaid', 'Bitso'];
      if (result.status === 'fulfilled') {
        return {
          name: names[index]!,
          status: 'healthy' as const,
          latency: result.value.latency,
        };
      } else {
        return {
          name: names[index]!,
          status: 'unhealthy' as const,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    const healthyCount = results.filter((r) => r.status === 'healthy').length;
    const overallStatus =
      healthyCount === results.length
        ? 'healthy'
        : healthyCount > 0
        ? 'degraded'
        : 'unhealthy';

    return {
      status: overallStatus,
      integrations: results,
    };
  }

  private isBelvoEnabled(): boolean {
    return this.configService.get('NODE_ENV') !== 'production' || this.isBelvoConfigured();
  }

  private isBelvoConfigured(): boolean {
    return !!
      (this.configService.get('BELVO_SECRET_KEY_ID') &&
       this.configService.get('BELVO_SECRET_KEY_PASSWORD'));
  }

  private isPlaidEnabled(): boolean {
    return this.configService.get('NODE_ENV') !== 'production' || this.isPlaidConfigured();
  }

  private isPlaidConfigured(): boolean {
    return !!
      (this.configService.get('PLAID_CLIENT_ID') &&
       this.configService.get('PLAID_SECRET'));
  }

  private isBitsoEnabled(): boolean {
    return this.configService.get('NODE_ENV') !== 'production' || this.isBitsoConfigured();
  }

  private isBitsoConfigured(): boolean {
    return !!
      (this.configService.get('BITSO_API_KEY') &&
       this.configService.get('BITSO_API_SECRET'));
  }

  private async checkBelvoHealth(): Promise<{ latency: number }> {
    const start = Date.now();
    // In a real implementation, we would make a health check call to Belvo
    // For now, we'll simulate a successful health check
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { latency: Date.now() - start };
  }

  private async checkPlaidHealth(): Promise<{ latency: number }> {
    const start = Date.now();
    // In a real implementation, we would make a health check call to Plaid
    // For now, we'll simulate a successful health check
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { latency: Date.now() - start };
  }

  private async checkBitsoHealth(): Promise<{ latency: number }> {
    const start = Date.now();
    // In a real implementation, we would make a health check call to Bitso
    // For now, we'll simulate a successful health check
    await new Promise((resolve) => setTimeout(resolve, 120));
    return { latency: Date.now() - start };
  }
}