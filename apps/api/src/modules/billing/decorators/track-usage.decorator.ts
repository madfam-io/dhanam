import { SetMetadata } from '@nestjs/common';
import { UsageMetricType } from '@prisma/client';

export const USAGE_METRIC_KEY = 'usage_metric';

/**
 * Decorator to track usage of an endpoint
 * @param metricType The type of usage metric to track
 * @example
 * @TrackUsage('esg_calculation')
 * @Get('portfolio/esg')
 * async getPortfolioESG() { ... }
 */
export const TrackUsage = (metricType: UsageMetricType) =>
  SetMetadata(USAGE_METRIC_KEY, metricType);
