import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { ZillowService } from '../../integrations/zillow/zillow.service';
import { RealEstateValuationService } from '../../manual-assets/real-estate-valuation.service';

export const PROPERTY_VALUATION_QUEUE = 'property-valuation';

export interface PropertyValuationJobData {
  type: 'refresh-single' | 'refresh-all' | 'refresh-space';
  assetId?: string;
  spaceId?: string;
}

export interface PropertyValuationJobResult {
  success: boolean;
  refreshed: number;
  failed: number;
  errors?: string[];
}

@Processor(PROPERTY_VALUATION_QUEUE)
export class PropertyValuationProcessor {
  private readonly logger = new Logger(PropertyValuationProcessor.name);

  constructor(
    private readonly realEstateService: RealEstateValuationService,
    private readonly zillowService: ZillowService
  ) {}

  @Process()
  async process(job: Job<PropertyValuationJobData>): Promise<PropertyValuationJobResult> {
    this.logger.log(`Processing property valuation job: ${job.id} (${job.data.type})`);

    if (!this.zillowService.isAvailable()) {
      this.logger.warn('Zillow API not configured, skipping valuation refresh');
      return { success: true, refreshed: 0, failed: 0 };
    }

    try {
      switch (job.data.type) {
        case 'refresh-single':
          return await this.refreshSingle(job.data);

        case 'refresh-space':
          return await this.refreshSpace(job.data);

        case 'refresh-all':
          return await this.refreshAll();

        default:
          throw new Error(`Unknown job type: ${job.data.type}`);
      }
    } catch (error) {
      this.logger.error(`Property valuation job failed: ${error}`);
      throw error;
    }
  }

  private async refreshSingle(data: PropertyValuationJobData): Promise<PropertyValuationJobResult> {
    if (!data.assetId || !data.spaceId) {
      return {
        success: false,
        refreshed: 0,
        failed: 1,
        errors: ['Asset ID and Space ID are required'],
      };
    }

    const result = await this.realEstateService.refreshValuation(data.spaceId, data.assetId);

    return {
      success: result.success,
      refreshed: result.success ? 1 : 0,
      failed: result.success ? 0 : 1,
      errors: result.error ? [result.error] : undefined,
    };
  }

  private async refreshSpace(data: PropertyValuationJobData): Promise<PropertyValuationJobResult> {
    if (!data.spaceId) {
      return {
        success: false,
        refreshed: 0,
        failed: 1,
        errors: ['Space ID is required'],
      };
    }

    const results = await this.realEstateService.refreshAllInSpace(data.spaceId);

    const refreshed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const errors = results.filter((r) => r.error).map((r) => `${r.assetId}: ${r.error}`);

    return {
      success: failed === 0,
      refreshed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async refreshAll(): Promise<PropertyValuationJobResult> {
    const properties = await this.realEstateService.getAllZillowLinkedProperties();

    this.logger.log(`Refreshing ${properties.length} Zillow-linked properties`);

    let refreshed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const property of properties) {
      try {
        const result = await this.realEstateService.refreshValuation(property.spaceId, property.id);

        if (result.success) {
          refreshed++;
          this.logger.debug(
            `Refreshed ${property.id}: ${result.previousValue} -> ${result.newValue}`
          );
        } else {
          failed++;
          errors.push(`${property.id}: ${result.error}`);
        }

        // Rate limiting: wait between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        errors.push(`${property.id}: ${error}`);
      }
    }

    this.logger.log(`Property refresh complete: ${refreshed} refreshed, ${failed} failed`);

    return {
      success: failed === 0,
      refreshed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
