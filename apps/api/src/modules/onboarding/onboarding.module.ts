import { Module } from '@nestjs/common';

import { AuditModule } from '@core/audit/audit.module';
import { CoreModule } from '@core/core.module';
import { EmailModule } from '@modules/email/email.module';
import { PreferencesModule } from '@modules/preferences/preferences.module';

import { OnboardingAnalytics } from './onboarding.analytics';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [CoreModule, AuditModule, EmailModule, PreferencesModule],
  providers: [OnboardingService, OnboardingAnalytics],
  controllers: [OnboardingController],
  exports: [OnboardingService, OnboardingAnalytics],
})
export class OnboardingModule {}
