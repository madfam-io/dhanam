import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

import { ArtsyAdapter } from './adapters/artsy.adapter';
import { HagertyAdapter } from './adapters/hagerty.adapter';
import { KicksDbAdapter } from './adapters/kicksdb.adapter';
import { PcgsAdapter } from './adapters/pcgs.adapter';
import { PsaAdapter } from './adapters/psa.adapter';
import { WatchChartsAdapter } from './adapters/watchcharts.adapter';
import { WineSearcherAdapter } from './adapters/wine-searcher.adapter';
import type {
  CatalogItem,
  CollectibleCategory,
  CollectibleProviderAdapter,
  ValuationResult,
} from './interfaces/collectible-provider.interface';

interface CollectibleMetadata {
  collectible?: {
    category: CollectibleCategory;
    provider: string;
    externalId: string;
    valuationEnabled: boolean;
    lastProviderSync?: string;
  };
  [key: string]: unknown;
}

@Injectable()
export class CollectiblesValuationService {
  private readonly logger = new Logger(CollectiblesValuationService.name);
  private readonly adapters = new Map<string, CollectibleProviderAdapter>();

  private static readonly SEARCH_CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly artsyAdapter: ArtsyAdapter,
    private readonly watchChartsAdapter: WatchChartsAdapter,
    private readonly wineSearcherAdapter: WineSearcherAdapter,
    private readonly pcgsAdapter: PcgsAdapter,
    private readonly psaAdapter: PsaAdapter,
    private readonly hagertyAdapter: HagertyAdapter,
    private readonly kicksDbAdapter: KicksDbAdapter
  ) {
    const allAdapters: CollectibleProviderAdapter[] = [
      artsyAdapter,
      watchChartsAdapter,
      wineSearcherAdapter,
      pcgsAdapter,
      psaAdapter,
      hagertyAdapter,
      kicksDbAdapter,
    ];

    for (const adapter of allAdapters) {
      // Use provider name as key (allows multiple adapters per category)
      this.adapters.set(adapter.provider, adapter);
    }
  }

  async search(category: CollectibleCategory, query: string, limit = 10): Promise<CatalogItem[]> {
    const adapter = this.getAdapterForCategory(category);

    const cacheKey = `collectibles:search:${category}:${query}:${limit}`;
    const cached = await this.getCached<CatalogItem[]>(cacheKey);
    if (cached) return cached;

    const results = await adapter.search(query, limit);
    await this.setCached(cacheKey, results, CollectiblesValuationService.SEARCH_CACHE_TTL);
    return results;
  }

  async getValuation(
    category: CollectibleCategory,
    externalId: string
  ): Promise<ValuationResult | null> {
    const adapter = this.getAdapterForCategory(category);
    return adapter.getValuation(externalId);
  }

  async linkAsset(
    spaceId: string,
    assetId: string,
    externalId: string,
    provider: string,
    category: CollectibleCategory
  ): Promise<void> {
    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Manual asset not found');
    }

    const metadata = (asset.metadata as CollectibleMetadata) || {};
    const updatedMetadata: CollectibleMetadata = {
      ...metadata,
      collectible: {
        category,
        provider,
        externalId,
        valuationEnabled: true,
        lastProviderSync: new Date().toISOString(),
      },
    };

    await this.prisma.manualAsset.update({
      where: { id: assetId },
      data: { metadata: updatedMetadata as object },
    });

    // Fetch initial valuation
    await this.refreshAsset(spaceId, assetId);
  }

  async unlinkAsset(spaceId: string, assetId: string): Promise<void> {
    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Manual asset not found');
    }

    const metadata = (asset.metadata as CollectibleMetadata) || {};
    const { collectible: _, ...rest } = metadata;

    await this.prisma.manualAsset.update({
      where: { id: assetId },
      data: { metadata: rest as object },
    });
  }

  async refreshAsset(
    spaceId: string,
    assetId: string
  ): Promise<{ success: boolean; previousValue?: number; newValue?: number; error?: string }> {
    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      return { success: false, error: 'Asset not found' };
    }

    const metadata = (asset.metadata as CollectibleMetadata) || {};
    const collectible = metadata.collectible;

    if (!collectible?.valuationEnabled || !collectible.externalId) {
      return { success: false, error: 'Asset not linked to a collectible provider' };
    }

    const adapter = this.adapters.get(collectible.provider);
    if (!adapter) {
      return { success: false, error: `Unknown provider: ${collectible.provider}` };
    }

    try {
      const valuation = await adapter.getValuation(collectible.externalId);
      if (!valuation) {
        return { success: false, error: 'No valuation data available' };
      }

      const previousValue = Number(asset.currentValue);

      // Update asset current value and sync timestamp
      const updatedMetadata: CollectibleMetadata = {
        ...metadata,
        collectible: {
          ...collectible,
          lastProviderSync: new Date().toISOString(),
        },
      };

      await this.prisma.manualAsset.update({
        where: { id: assetId },
        data: {
          currentValue: valuation.marketValue,
          metadata: updatedMetadata as object,
        },
      });

      // Record valuation history
      const today = new Date(new Date().toISOString().split('T')[0]);
      await this.prisma.manualAssetValuation.upsert({
        where: { assetId_date: { assetId, date: today } },
        create: {
          assetId,
          date: today,
          value: valuation.marketValue,
          currency: asset.currency,
          source: valuation.source,
          notes: this.buildValuationNotes(valuation),
        },
        update: {
          value: valuation.marketValue,
          source: valuation.source,
          notes: this.buildValuationNotes(valuation),
        },
      });

      return { success: true, previousValue, newValue: valuation.marketValue };
    } catch (error) {
      this.logger.error(`Failed to refresh collectible valuation for ${assetId}: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAllLinkedAssets(): Promise<Array<{ id: string; spaceId: string }>> {
    const assets = await this.prisma.manualAsset.findMany({
      select: { id: true, spaceId: true, metadata: true },
    });

    return assets.filter((asset) => {
      const metadata = (asset.metadata as CollectibleMetadata) || {};
      return metadata.collectible?.valuationEnabled && metadata.collectible?.externalId;
    });
  }

  getAvailableCategories(): Array<{
    category: CollectibleCategory;
    provider: string;
    available: boolean;
  }> {
    const categories: Array<{
      category: CollectibleCategory;
      provider: string;
      available: boolean;
    }> = [];

    for (const adapter of this.adapters.values()) {
      categories.push({
        category: adapter.category,
        provider: adapter.provider,
        available: adapter.provider === 'kicksdb',
      });
    }

    return categories;
  }

  private getAdapterForCategory(category: CollectibleCategory): CollectibleProviderAdapter {
    for (const adapter of this.adapters.values()) {
      if (adapter.category === category) return adapter;
    }
    throw new NotFoundException(`No adapter found for category: ${category}`);
  }

  private buildValuationNotes(valuation: ValuationResult): string {
    const parts: string[] = [];
    if (valuation.valueLow != null && valuation.valueHigh != null) {
      parts.push(`Range: $${valuation.valueLow} - $${valuation.valueHigh}`);
    }
    if (valuation.lastSalePrice != null) {
      parts.push(`Last sale: $${valuation.lastSalePrice}`);
    }
    return parts.join('; ') || `Provider: ${valuation.provider}`;
  }

  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      this.logger.warn(`Cache read error for key: ${key}`);
    }
    return null;
  }

  private async setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), ttlSeconds);
    } catch {
      this.logger.warn(`Cache write error for key: ${key}`);
    }
  }
}
