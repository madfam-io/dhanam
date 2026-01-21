import { Module, Global } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';
import { JobsModule } from '@modules/jobs/jobs.module';

import { DeploymentMonitorService } from './deployment-monitor.service';
import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';
import { MonitoringController } from './monitoring.controller';
import { SentryService } from './sentry.service';

@Global()
@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [MonitoringController],
  providers: [
    HealthService,
    MetricsService,
    SentryService,
    DeploymentMonitorService,
    {
      provide: 'SentryService',
      useExisting: SentryService,
    },
  ],
  exports: [HealthService, MetricsService, SentryService, DeploymentMonitorService],
})
export class MonitoringModule {}
