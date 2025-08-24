import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';
import { PrismaModule } from '@core/prisma/prisma.module';
import { JobsModule } from '@modules/jobs/jobs.module';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [MonitoringController],
  providers: [HealthService, MetricsService],
  exports: [HealthService, MetricsService],
})
export class MonitoringModule {}