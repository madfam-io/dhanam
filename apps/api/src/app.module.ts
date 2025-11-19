import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from '@core/audit/audit.module';
import { AuthModule } from '@core/auth/auth.module';
import { CoreModule } from '@core/core.module';
import { MonitoringModule } from '@core/monitoring/monitoring.module';
import { RateLimitingModule } from '@core/security/rate-limiting.module';
import { AccountsModule } from '@modules/accounts/accounts.module';
import { AdminModule } from '@modules/admin/admin.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { BillingModule } from '@modules/billing/billing.module';
import { BudgetsModule } from '@modules/budgets/budgets.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { EmailModule } from '@modules/email/email.module';
import { EstatePlanningModule } from '@modules/estate-planning/estate-planning.module';
import { FxRatesModule } from '@modules/fx-rates/fx-rates.module';
import { GoalsModule } from '@modules/goals/goals.module';
import { HouseholdsModule } from '@modules/households/households.module';
import { IntegrationsModule } from '@modules/integrations/integrations.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { OnboardingModule } from '@modules/onboarding/onboarding.module';
import { PreferencesModule } from '@modules/preferences/preferences.module';
import { ProvidersModule } from '@modules/providers/providers.module';
import { SimulationsModule } from '@modules/simulations/simulations.module';
import { SpacesModule } from '@modules/spaces/spaces.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { UsersModule } from '@modules/users/users.module';

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
    FxRatesModule,
    OnboardingModule,
    PreferencesModule,
    MonitoringModule,
    EmailModule,
    AdminModule,
    BillingModule,
    GoalsModule,
    HouseholdsModule,
    EstatePlanningModule,
    SimulationsModule,
  ],
})
export class AppModule {}
