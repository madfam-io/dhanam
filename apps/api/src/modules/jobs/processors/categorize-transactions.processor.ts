import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RulesService } from '@modules/categories/rules.service';
import { CategorizeTransactionsJobData } from '../queue.service';

@Injectable()
export class CategorizeTransactionsProcessor {
  private readonly logger = new Logger(CategorizeTransactionsProcessor.name);

  constructor(private readonly rulesService: RulesService) {}

  async process(job: Job<CategorizeTransactionsJobData['payload']>): Promise<any> {
    const { spaceId, transactionIds } = job.data;
    
    this.logger.log(`Processing categorization job for space ${spaceId}`);

    try {
      let result;

      if (transactionIds && transactionIds.length > 0) {
        // Categorize specific transactions
        result = await this.rulesService.categorizeSpecificTransactions(spaceId, transactionIds);
      } else {
        // Batch categorize all uncategorized transactions
        result = await this.rulesService.batchCategorizeTransactions(spaceId);
      }

      this.logger.log(
        `Categorization completed for space ${spaceId}: ${result.categorized}/${result.total} transactions categorized`
      );

      return result;
    } catch (error) {
      this.logger.error(`Categorization failed for space ${spaceId}: ${(error as Error).message}`);
      throw error;
    }
  }
}