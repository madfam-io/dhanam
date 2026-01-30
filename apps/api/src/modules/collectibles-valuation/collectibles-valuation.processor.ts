import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { CollectiblesValuationService } from './collectibles-valuation.service';

export interface RefreshSingleJobData {
  assetId: string;
  spaceId: string;
}

export interface RefreshAllJobData {
  triggeredBy: 'cron' | 'manual';
}

export type CollectiblesJobData = RefreshSingleJobData | RefreshAllJobData;

@Injectable()
export class CollectiblesValuationProcessor {
  private readonly logger = new Logger(CollectiblesValuationProcessor.name);

  constructor(private readonly collectiblesService: CollectiblesValuationService) {}

  async process(job: Job<CollectiblesJobData>): Promise<any> {
    switch (job.name) {
      case 'refresh-single':
        return this.handleRefreshSingle(job as Job<RefreshSingleJobData>);
      case 'refresh-all':
        return this.handleRefreshAll();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleRefreshSingle(job: Job<RefreshSingleJobData>) {
    const { assetId, spaceId } = job.data;
    this.logger.log(`Refreshing collectible valuation for asset ${assetId}`);

    const result = await this.collectiblesService.refreshAsset(spaceId, assetId);

    if (!result.success) {
      this.logger.warn(`Refresh failed for ${assetId}: ${result.error}`);
    }

    return result;
  }

  private async handleRefreshAll() {
    this.logger.log('Starting batch collectibles valuation refresh');

    const assets = await this.collectiblesService.getAllLinkedAssets();
    let successCount = 0;
    let failCount = 0;

    for (const asset of assets) {
      const result = await this.collectiblesService.refreshAsset(asset.spaceId, asset.id);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
        this.logger.warn(`Batch refresh failed for ${asset.id}: ${result.error}`);
      }

      // Rate limit: 200ms between calls
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    this.logger.log(
      `Batch refresh complete: ${successCount} succeeded, ${failCount} failed out of ${assets.length} total`
    );

    return { total: assets.length, success: successCount, failed: failCount };
  }
}
