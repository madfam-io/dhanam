import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ReportService } from './report.service';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ReportService],
  exports: [AnalyticsService, ReportService],
})
export class AnalyticsModule {}
