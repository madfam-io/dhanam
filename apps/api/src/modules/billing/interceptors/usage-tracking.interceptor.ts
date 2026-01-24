import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { UsageMetricType } from '@db';

import { BillingService } from '../billing.service';
import { USAGE_METRIC_KEY } from '../decorators';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UsageTrackingInterceptor.name);

  constructor(
    private reflector: Reflector,
    private billingService: BillingService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metricType = this.reflector.get<UsageMetricType>(USAGE_METRIC_KEY, context.getHandler());

    // No usage tracking configured - proceed without tracking
    if (!metricType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user in request - let other guards handle it
    if (!user) {
      return next.handle();
    }

    // Track usage after successful request
    return next.handle().pipe(
      tap({
        next: async () => {
          try {
            await this.billingService.recordUsage(user.id, metricType);
            this.logger.debug(`Recorded ${metricType} usage for user ${user.id}`);
          } catch (error) {
            // Log error but don't fail the request
            this.logger.error(`Failed to record usage: ${error.message}`, error.stack);
          }
        },
        error: () => {
          // Don't track usage for failed requests
        },
      })
    );
  }
}
