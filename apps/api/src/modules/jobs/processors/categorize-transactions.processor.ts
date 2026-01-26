import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Job } from 'bullmq';

import { isDomainException } from '@core/exceptions/domain-exceptions';
import { RulesService } from '@modules/categories/rules.service';

import { CategorizeTransactionsJobData } from '../queue.service';

@Injectable()
export class CategorizeTransactionsProcessor {
  private readonly logger = new Logger(CategorizeTransactionsProcessor.name);

  constructor(private readonly rulesService: RulesService) {}

  async process(job: Job<CategorizeTransactionsJobData['payload']>): Promise<any> {
    const { spaceId, transactionIds } = job.data;
    const startTime = Date.now();
    const isSpecific = transactionIds && transactionIds.length > 0;

    this.logger.log(
      `Processing categorization job for space ${spaceId}${isSpecific ? ` (${transactionIds.length} specific transactions)` : ''}`
    );

    // Set Sentry context
    Sentry.withScope((scope) => {
      scope.setTag('job_type', 'categorize-transactions');
      scope.setTag('job_id', job.id || 'unknown');
      scope.setContext('job', {
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
        spaceId,
        transactionCount: isSpecific ? transactionIds.length : 'all',
      });
    });

    try {
      let result;

      if (isSpecific) {
        // Categorize specific transactions
        result = await this.rulesService.categorizeSpecificTransactions(spaceId, transactionIds);
      } else {
        // Batch categorize all uncategorized transactions
        result = await this.rulesService.batchCategorizeTransactions(spaceId);
      }

      const durationMs = Date.now() - startTime;
      this.logger.log(
        `Categorization completed for space ${spaceId}: ${result.categorized}/${result.total} transactions categorized in ${durationMs}ms`
      );

      return {
        ...result,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.error(
        `Categorization failed for space ${spaceId} after ${durationMs}ms: ${err.message}`
      );

      // Capture to Sentry with context
      Sentry.withScope((scope) => {
        scope.setTag('job_type', 'categorize-transactions');
        scope.setTag('job_id', job.id || 'unknown');
        scope.setTag('is_domain_exception', String(isDomainException(error)));
        scope.setContext('job', {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          spaceId,
          transactionCount: isSpecific ? transactionIds.length : 'all',
          durationMs,
        });
        scope.setLevel(job.attemptsMade >= (job.opts.attempts || 3) - 1 ? 'error' : 'warning');
        Sentry.captureException(err);
      });

      throw error;
    }
  }
}
