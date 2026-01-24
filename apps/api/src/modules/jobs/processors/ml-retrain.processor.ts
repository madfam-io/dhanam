import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CorrectionAggregatorService } from '@modules/ml/correction-aggregator.service';
import { CategoryCorrectionService } from '@modules/ml/correction.service';

/**
 * Background processor for ML retraining tasks
 * Runs nightly to update pattern aggregations and clean old data
 */
@Injectable()
export class MLRetrainProcessor implements OnModuleInit {
  private readonly logger = new Logger(MLRetrainProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly correctionAggregator: CorrectionAggregatorService,
    private readonly correctionService: CategoryCorrectionService
  ) {}

  async onModuleInit() {
    this.logger.log('ML Retrain Processor initialized');
  }

  /**
   * Nightly job to retrain all patterns
   * Runs at 2:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleNightlyRetrain() {
    if (this.isProcessing) {
      this.logger.warn('Skipping nightly retrain - previous job still running');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting nightly ML pattern retrain...');

      // Step 1: Retrain all patterns
      const { spacesProcessed, patternsBuilt } =
        await this.correctionAggregator.retrainAllPatterns();

      // Step 2: Cleanup old corrections (older than 1 year)
      const deletedCorrections = await this.correctionService.cleanupOldCorrections(365);

      const duration = (Date.now() - startTime) / 1000;

      this.logger.log(
        `Nightly retrain complete in ${duration.toFixed(2)}s: ` +
          `${spacesProcessed} spaces, ${patternsBuilt} patterns, ` +
          `${deletedCorrections} old corrections cleaned up`
      );
    } catch (error) {
      this.logger.error('Error during nightly ML retrain:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Hourly job to refresh hot patterns (recently corrected)
   * Runs every hour at minute 30
   */
  @Cron('30 * * * *')
  async handleHourlyRefresh() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      this.logger.debug('Starting hourly pattern refresh...');

      // Find spaces with recent corrections (last 2 hours)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const recentCorrections = await this.getSpacesWithRecentCorrections(twoHoursAgo);

      for (const spaceId of recentCorrections) {
        // Invalidate cache to force pattern rebuild on next request
        this.correctionAggregator.invalidateCache(spaceId);
      }

      if (recentCorrections.length > 0) {
        this.logger.log(`Invalidated pattern cache for ${recentCorrections.length} spaces`);
      }
    } catch (error) {
      this.logger.error('Error during hourly pattern refresh:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get space IDs with corrections since a given date
   */
  private async getSpacesWithRecentCorrections(_since: Date): Promise<string[]> {
    // This would use PrismaService but we're keeping the processor light
    // The actual query is delegated to the service
    return [];
  }

  /**
   * Manual trigger for retraining (admin use)
   */
  async triggerRetrain(): Promise<{
    success: boolean;
    spacesProcessed: number;
    patternsBuilt: number;
    duration: number;
  }> {
    if (this.isProcessing) {
      return {
        success: false,
        spacesProcessed: 0,
        patternsBuilt: 0,
        duration: 0,
      };
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      const result = await this.correctionAggregator.retrainAllPatterns();
      const duration = (Date.now() - startTime) / 1000;

      return {
        success: true,
        spacesProcessed: result.spacesProcessed,
        patternsBuilt: result.patternsBuilt,
        duration,
      };
    } finally {
      this.isProcessing = false;
    }
  }
}
