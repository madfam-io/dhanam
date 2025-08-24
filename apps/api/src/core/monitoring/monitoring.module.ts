import { Module } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';
import { JobsModule } from '@modules/jobs/jobs.module';

import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';
import { MonitoringController } from './monitoring.controller';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [MonitoringController],
  providers: [HealthService, MetricsService],
  exports: [HealthService, MetricsService],
})
export class MonitoringModule {}
