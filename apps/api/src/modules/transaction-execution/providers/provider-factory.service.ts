import { Injectable, Logger, BadRequestException } from '@nestjs/common';

import { BelvoExecutionProvider } from './belvo-execution.provider';
import { BitsoExecutionProvider } from './bitso-execution.provider';
import { ExecutionProvider } from './execution-provider.interface';
import { PlaidExecutionProvider } from './plaid-execution.provider';

export enum ProviderType {
  BITSO = 'bitso',
  PLAID = 'plaid',
  BELVO = 'belvo',
  MANUAL = 'manual',
}

/**
 * Provider Factory Service
 * Resolves and creates execution provider instances
 */
@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);
  private readonly providers: Map<ProviderType, ExecutionProvider>;

  constructor(
    private readonly bitsoProvider: BitsoExecutionProvider,
    private readonly plaidProvider: PlaidExecutionProvider,
    private readonly belvoProvider: BelvoExecutionProvider
  ) {
    this.providers = new Map([
      [ProviderType.BITSO, this.bitsoProvider],
      [ProviderType.PLAID, this.plaidProvider],
      [ProviderType.BELVO, this.belvoProvider],
    ]);
  }

  /**
   * Get provider instance by type
   */
  getProvider(providerType: string): ExecutionProvider {
    const provider = this.providers.get(providerType as ProviderType);

    if (!provider) {
      throw new BadRequestException(`Provider ${providerType} not found`);
    }

    if (providerType === ProviderType.MANUAL) {
      throw new BadRequestException('Manual provider cannot be used for automatic execution');
    }

    return provider;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): ExecutionProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(providerType: string) {
    const provider = this.getProvider(providerType);
    return provider.capabilities;
  }

  /**
   * Health check all providers
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [type, provider] of this.providers.entries()) {
      try {
        results[type] = await provider.healthCheck();
      } catch (error) {
        this.logger.error(`Health check failed for ${type}:`, error);
        results[type] = false;
      }
    }

    return results;
  }
}
