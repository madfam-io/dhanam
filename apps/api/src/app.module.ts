import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CoreModule } from '@core/core.module';
import { AuthModule } from '@core/auth/auth.module';
import { RateLimitingModule } from '@core/security/rate-limiting.module';
import { AuditModule } from '@core/audit/audit.module';
import { UsersModule } from '@modules/users/users.module';
import { SpacesModule } from '@modules/spaces/spaces.module';
import { AccountsModule } from '@modules/accounts/accounts.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { BudgetsModule } from '@modules/budgets/budgets.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { IntegrationsModule } from '@modules/integrations/integrations.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { MonitoringModule } from '@core/monitoring/monitoring.module';
import { EmailModule } from '@modules/email/email.module';

import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      cache: true,
    }),
    CoreModule,
    AuthModule,
    RateLimitingModule,
    AuditModule,
    UsersModule,
    SpacesModule,
    AccountsModule,
    TransactionsModule,
    BudgetsModule,
    CategoriesModule,
    IntegrationsModule,
    AnalyticsModule,
    JobsModule,
    ProvidersModule,
    MonitoringModule,
    EmailModule,
  ],
})
export class AppModule {}