import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { EnhancedJobsService } from './enhanced-jobs.service';
import { QueueService } from './queue.service';
import { SyncTransactionsProcessor } from './processors/sync-transactions.processor';
import { CategorizeTransactionsProcessor } from './processors/categorize-transactions.processor';
import { ESGUpdateProcessor } from './processors/esg-update.processor';
import { ValuationSnapshotProcessor } from './processors/valuation-snapshot.processor';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '@core/prisma/prisma.module';
import { CryptoModule } from '@core/crypto/crypto.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { SpacesModule } from '@modules/spaces/spaces.module';
import { EsgModule } from '@modules/esg/esg.module';
import { ProvidersModule } from '@modules/providers/providers.module';

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