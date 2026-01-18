import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuditModule } from '@core/audit/audit.module';
import { CoreModule } from '@core/core.module';
import { EmailModule } from '@modules/email/email.module';
import { PreferencesModule } from '@modules/preferences/preferences.module';

import { OnboardingAnalytics } from './onboarding.analytics';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [
    CoreModule,
    AuditModule,
    EmailModule,
    PreferencesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [OnboardingService, OnboardingAnalytics],
  controllers: [OnboardingController],
  exports: [OnboardingService, OnboardingAnalytics],
})
export class OnboardingModule {}
