import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@core/prisma/prisma.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';

import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { MonthlyReportTask } from './tasks/monthly-report.task';
import { WeeklySummaryTask } from './tasks/weekly-summary.task';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AnalyticsModule,
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor, WeeklySummaryTask, MonthlyReportTask],
  exports: [EmailService],
})
export class EmailModule {}
