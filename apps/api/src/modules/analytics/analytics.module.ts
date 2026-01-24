import { Module, Global } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { FxRatesModule } from '../fx-rates/fx-rates.module';
import { SpacesModule } from '../spaces/spaces.module';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnomalyService } from './anomaly.service';
import { LongTermForecastService } from './long-term-forecast.service';
import { PostHogService } from './posthog.service';
import { ReportService } from './report.service';
import { ReportsController } from './reports.controller';
import { WealthAnalytics } from './wealth.analytics';

@Global() // Make analytics services available globally without importing
@Module({
  imports: [PrismaModule, SpacesModule, FxRatesModule],
  controllers: [AnalyticsController, ReportsController],
  providers: [
    AnalyticsService,
    ReportService,
    PostHogService,
    WealthAnalytics,
    AnomalyService,
    LongTermForecastService,
  ],
  exports: [
    AnalyticsService,
    ReportService,
    PostHogService,
    WealthAnalytics,
    AnomalyService,
    LongTermForecastService,
  ],
})
export class AnalyticsModule {}
