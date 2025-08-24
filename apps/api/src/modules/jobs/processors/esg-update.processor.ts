import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { EnhancedEsgService } from '@modules/esg/enhanced-esg.service';

import { ESGUpdateJobData } from '../queue.service';

@Injectable()
export class ESGUpdateProcessor {
  private readonly logger = new Logger(ESGUpdateProcessor.name);

  constructor(private readonly enhancedEsgService: EnhancedEsgService) {}

  async process(job: Job<ESGUpdateJobData['payload']>): Promise<any> {
    const { symbols, forceRefresh } = job.data;

    this.logger.log(`Processing ESG update job for ${symbols.length} symbols`);

    try {
      if (forceRefresh) {
        // Clear cache first if force refresh
        await this.enhancedEsgService.clearESGCache();
      }

      // Refresh ESG data for all symbols
      await this.enhancedEsgService.refreshESGData(symbols);

      // Get updated cache stats
      const cacheStats = await this.enhancedEsgService.getCacheStats();

      this.logger.log(
        `ESG update completed for ${symbols.length} symbols. Cache size: ${cacheStats.size}`
      );

      return {
        symbolsUpdated: symbols.length,
        cacheStats,
        forceRefresh,
      };
    } catch (error) {
      this.logger.error(
        `ESG update failed for symbols ${symbols.join(', ')}: ${(error as Error).message}`
      );
      throw error;
    }
  }
}
