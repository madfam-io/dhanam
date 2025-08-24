import { ApiProperty } from '@nestjs/swagger';

export class OnboardingFunnelDto {
  @ApiProperty({ description: 'Total users who started onboarding' })
  totalStarted: number;

  @ApiProperty({ description: 'Users by onboarding step' })
  stepBreakdown: {
    emailVerification: number;
    profileSetup: number;
    spaceCreation: number;
    firstConnection: number;
    completed: number;
  };

  @ApiProperty({ description: 'Conversion rates between steps' })
  conversionRates: {
    startToEmailVerified: number;
    emailVerifiedToProfile: number;
    profileToSpace: number;
    spaceToConnection: number;
    connectionToComplete: number;
    overallConversion: number;
  };

  @ApiProperty({ description: 'Average time to complete (in hours)' })
  averageCompletionTime: number;

  @ApiProperty({ description: 'Abandonment rate by step' })
  abandonmentRates: {
    emailVerification: number;
    profileSetup: number;
    spaceCreation: number;
    firstConnection: number;
  };

  @ApiProperty({ description: 'Time-based metrics' })
  timeMetrics: {
    last24Hours: {
      started: number;
      completed: number;
    };
    last7Days: {
      started: number;
      completed: number;
    };
    last30Days: {
      started: number;
      completed: number;
    };
  };

  @ApiProperty({ description: 'First connection provider breakdown' })
  firstConnectionProviders: {
    belvo: number;
    plaid: number;
    bitso: number;
    manual: number;
    none: number;
  };
}
