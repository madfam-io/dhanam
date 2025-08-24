import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CryptoModule } from '@core/crypto/crypto.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { EsgModule } from '@modules/esg/esg.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { SpacesModule } from '@modules/spaces/spaces.module';

import { EnhancedJobsService } from './enhanced-jobs.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CategorizeTransactionsProcessor } from './processors/categorize-transactions.processor';
import { ESGUpdateProcessor } from './processors/esg-update.processor';
import { SyncTransactionsProcessor } from './processors/sync-transactions.processor';
import { ValuationSnapshotProcessor } from './processors/valuation-snapshot.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    CryptoModule,
    CategoriesModule,
    SpacesModule,
    EsgModule,
    ProvidersModule,
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    EnhancedJobsService,
    QueueService,
    SyncTransactionsProcessor,
    CategorizeTransactionsProcessor,
    ESGUpdateProcessor,
    ValuationSnapshotProcessor,
  ],
  exports: [JobsService, EnhancedJobsService, QueueService],
})
export class JobsModule {}
