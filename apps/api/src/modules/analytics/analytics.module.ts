import { Module, Global } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PostHogService } from './posthog.service';
import { ReportService } from './report.service';
import { WealthAnalytics } from './wealth.analytics';

@Global() // Make analytics services available globally without importing
@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ReportService, PostHogService, WealthAnalytics],
  exports: [AnalyticsService, ReportService, PostHogService, WealthAnalytics],
})
export class AnalyticsModule {}
