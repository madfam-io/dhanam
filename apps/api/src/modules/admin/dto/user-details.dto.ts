import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SpaceRole, SpaceType, Provider, Currency } from '@db';

export class UserDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  locale: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  totpEnabled: boolean;

  @ApiProperty()
  onboardingCompleted: boolean;

  @ApiPropertyOptional()
  onboardingCompletedAt?: Date;

  @ApiPropertyOptional()
  onboardingStep?: string;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'User spaces with details' })
  spaces: Array<{
    id: string;
    name: string;
    type: SpaceType;
    role: SpaceRole;
    currency: Currency;
    joinedAt: Date;
    accountCount: number;
    transactionCount: number;
    budgetCount: number;
  }>;

  @ApiProperty({ description: 'Provider connections' })
  connections: Array<{
    provider: Provider;
    connectedAt: Date;
    lastSyncAt?: Date;
    accountCount: number;
    status: 'active' | 'error' | 'disconnected';
  }>;

  @ApiProperty({ description: 'Activity summary' })
  activitySummary: {
    totalTransactions: number;
    totalAccounts: number;
    totalBudgets: number;
    lastTransactionDate?: Date;
    lastSyncDate?: Date;
  };

  @ApiProperty({ description: 'Recent audit logs' })
  recentAuditLogs: Array<{
    id: string;
    action: string;
    resource?: string;
    resourceId?: string;
    severity: string;
    timestamp: Date;
    ipAddress?: string;
  }>;

  @ApiProperty({ description: 'Session information' })
  sessions: {
    activeCount: number;
    lastSessionCreated?: Date;
    recentIpAddresses: string[];
  };
}
