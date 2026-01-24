import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ManualAssetType } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';
import { ZillowService } from '../integrations/zillow/zillow.service';
import type { PropertyValuationResult } from '../integrations/zillow/zillow.types';

export interface RealEstateMetadata {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  sqft?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  lotSize?: number;
  zpid?: string;
  lastZillowSync?: string;
  zillowEnabled?: boolean;
}

export interface PropertyValuationSummary {
  assetId: string;
  assetName: string;
  currentValue: number;
  zestimate?: number;
  zestimateLow?: number;
  zestimateHigh?: number;
  rentEstimate?: number;
  valueChange30Day?: number;
  lastUpdated?: Date;
  source: 'zillow' | 'manual';
  address: string;
}

export interface RefreshResult {
  assetId: string;
  success: boolean;
  previousValue?: number;
  newValue?: number;
  error?: string;
}

@Injectable()
export class RealEstateValuationService {
  private readonly logger = new Logger(RealEstateValuationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zillowService: ZillowService
  ) {}

  /**
   * Link a property to Zillow by looking up the address
   */
  async linkToZillow(
    spaceId: string,
    assetId: string
  ): Promise<{ success: boolean; zpid?: string; error?: string }> {
    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId, type: ManualAssetType.real_estate },
    });

    if (!asset) {
      throw new NotFoundException('Real estate asset not found');
    }

    const metadata = (asset.metadata as RealEstateMetadata) || {};

    if (!metadata.address || !metadata.city || !metadata.state) {
      return {
        success: false,
        error: 'Property must have address, city, and state to link to Zillow',
      };
    }

    try {
      const result = await this.zillowService.lookupAddress(
        metadata.address,
        metadata.city,
        metadata.state,
        metadata.zip
      );

      if (!result.found || !result.zpid) {
        return {
          success: false,
          error: 'Property not found in Zillow database',
        };
      }

      // Update asset metadata with Zillow info
      const updatedMetadata: RealEstateMetadata = {
        ...metadata,
        zpid: result.zpid,
        zillowEnabled: true,
        lastZillowSync: new Date().toISOString(),
      };

      await this.prisma.manualAsset.update({
        where: { id: assetId },
        data: { metadata: updatedMetadata as object },
      });

      // Fetch and store initial valuation
      await this.refreshValuation(spaceId, assetId);

      return { success: true, zpid: result.zpid };
    } catch (error) {
      this.logger.error(`Failed to link property to Zillow: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unlink a property from Zillow
   */
  async unlinkFromZillow(spaceId: string, assetId: string): Promise<void> {
    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId, type: ManualAssetType.real_estate },
    });

    if (!asset) {
      throw new NotFoundException('Real estate asset not found');
    }

    const metadata = (asset.metadata as RealEstateMetadata) || {};

    const updatedMetadata: RealEstateMetadata = {
      ...metadata,
      zpid: undefined,
      zillowEnabled: false,
      lastZillowSync: undefined,
    };

    await this.prisma.manualAsset.update({
      where: { id: assetId },
      data: { metadata: updatedMetadata as object },
    });
  }

  /**
   * Refresh valuation from Zillow for a single property
   */
  async refreshValuation(spaceId: string, assetId: string): Promise<RefreshResult> {
    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId, type: ManualAssetType.real_estate },
    });

    if (!asset) {
      return { assetId, success: false, error: 'Asset not found' };
    }

    const metadata = (asset.metadata as RealEstateMetadata) || {};

    if (!metadata.zpid || !metadata.zillowEnabled) {
      return { assetId, success: false, error: 'Property not linked to Zillow' };
    }

    try {
      const valuation = await this.zillowService.getPropertyValuation(metadata.zpid);

      if (!valuation) {
        return { assetId, success: false, error: 'No valuation data available' };
      }

      const previousValue = Number(asset.currentValue);

      // Update asset current value
      const newMetadata: RealEstateMetadata = {
        ...metadata,
        lastZillowSync: new Date().toISOString(),
        propertyType: valuation.propertyDetails.propertyType || metadata.propertyType,
        yearBuilt: valuation.propertyDetails.yearBuilt || metadata.yearBuilt,
        sqft: valuation.propertyDetails.livingArea || metadata.sqft,
        bedrooms: valuation.propertyDetails.bedrooms || metadata.bedrooms,
        bathrooms: valuation.propertyDetails.bathrooms || metadata.bathrooms,
        lotSize: valuation.propertyDetails.lotSize || metadata.lotSize,
      };

      await this.prisma.manualAsset.update({
        where: { id: assetId },
        data: {
          currentValue: valuation.zestimate,
          metadata: newMetadata as object,
        },
      });

      // Record valuation history
      const today = new Date(new Date().toISOString().split('T')[0]);
      await this.prisma.manualAssetValuation.upsert({
        where: {
          assetId_date: {
            assetId,
            date: today,
          },
        },
        create: {
          assetId,
          date: today,
          value: valuation.zestimate,
          currency: asset.currency,
          source: 'Zillow API',
          notes: `Zestimate range: ${this.formatCurrency(valuation.zestimateLow)} - ${this.formatCurrency(valuation.zestimateHigh)}`,
        },
        update: {
          value: valuation.zestimate,
          source: 'Zillow API',
          notes: `Zestimate range: ${this.formatCurrency(valuation.zestimateLow)} - ${this.formatCurrency(valuation.zestimateHigh)}`,
        },
      });

      return {
        assetId,
        success: true,
        previousValue,
        newValue: valuation.zestimate,
      };
    } catch (error) {
      this.logger.error(`Failed to refresh valuation for ${assetId}: ${error}`);
      return {
        assetId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get detailed valuation summary for a property
   */
  async getValuationSummary(
    spaceId: string,
    assetId: string
  ): Promise<PropertyValuationSummary | null> {
    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId, type: ManualAssetType.real_estate },
      include: {
        valuationHistory: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    if (!asset) {
      return null;
    }

    const metadata = (asset.metadata as RealEstateMetadata) || {};
    const latestValuation = asset.valuationHistory[0];

    // If linked to Zillow, fetch current data
    let zillowData: PropertyValuationResult | null = null;
    if (metadata.zpid && metadata.zillowEnabled) {
      try {
        zillowData = await this.zillowService.getPropertyValuation(metadata.zpid);
      } catch {
        this.logger.warn(`Failed to fetch Zillow data for ${assetId}`);
      }
    }

    const address = [metadata.address, metadata.city, metadata.state, metadata.zip]
      .filter(Boolean)
      .join(', ');

    return {
      assetId: asset.id,
      assetName: asset.name,
      currentValue: Number(asset.currentValue),
      zestimate: zillowData?.zestimate,
      zestimateLow: zillowData?.zestimateLow,
      zestimateHigh: zillowData?.zestimateHigh,
      rentEstimate: zillowData?.rentEstimate,
      valueChange30Day: zillowData?.valueChange30Day,
      lastUpdated: zillowData?.lastUpdated || latestValuation?.createdAt,
      source: latestValuation?.source === 'Zillow API' ? 'zillow' : 'manual',
      address,
    };
  }

  /**
   * Refresh all Zillow-linked properties in a space
   */
  async refreshAllInSpace(spaceId: string): Promise<RefreshResult[]> {
    const assets = await this.prisma.manualAsset.findMany({
      where: {
        spaceId,
        type: ManualAssetType.real_estate,
      },
    });

    const results: RefreshResult[] = [];

    for (const asset of assets) {
      const metadata = (asset.metadata as RealEstateMetadata) || {};
      if (metadata.zpid && metadata.zillowEnabled) {
        const result = await this.refreshValuation(spaceId, asset.id);
        results.push(result);

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get all Zillow-linked properties across all spaces (for batch refresh)
   */
  async getAllZillowLinkedProperties(): Promise<
    Array<{ id: string; spaceId: string; zpid: string }>
  > {
    const assets = await this.prisma.manualAsset.findMany({
      where: {
        type: ManualAssetType.real_estate,
      },
      select: {
        id: true,
        spaceId: true,
        metadata: true,
      },
    });

    return assets
      .filter((asset) => {
        const metadata = (asset.metadata as RealEstateMetadata) || {};
        return metadata.zpid && metadata.zillowEnabled;
      })
      .map((asset) => ({
        id: asset.id,
        spaceId: asset.spaceId,
        zpid: (asset.metadata as RealEstateMetadata).zpid!,
      }));
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
