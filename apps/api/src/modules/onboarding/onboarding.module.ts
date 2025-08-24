import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingAnalytics } from './onboarding.analytics';
import { CoreModule } from '@core/core.module';
import { AuditModule } from '@core/audit/audit.module';
import { EmailModule } from '@modules/email/email.module';
import { PreferencesModule } from '@modules/preferences/preferences.module';

@Module({
  imports: [CoreModule, AuditModule, EmailModule, PreferencesModule],
  providers: [OnboardingService, OnboardingAnalytics],
  controllers: [OnboardingController],
  exports: [OnboardingService, OnboardingAnalytics],
})
export class OnboardingModule {}