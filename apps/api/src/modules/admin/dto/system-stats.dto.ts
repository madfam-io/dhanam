import { ApiProperty } from '@nestjs/swagger';

export class SystemStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Active users (logged in last 30 days)' })
  activeUsers: number;

  @ApiProperty({ description: 'New users (last 7 days)' })
  newUsers: number;

  @ApiProperty({ description: 'Total number of spaces' })
  totalSpaces: number;

  @ApiProperty({ description: 'Personal spaces count' })
  personalSpaces: number;

  @ApiProperty({ description: 'Business spaces count' })
  businessSpaces: number;

  @ApiProperty({ description: 'Total number of accounts' })
  totalAccounts: number;

  @ApiProperty({ description: 'Active connections' })
  activeConnections: number;

  @ApiProperty({ description: 'Total transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'Transactions last 30 days' })
  recentTransactions: number;

  @ApiProperty({ description: 'Total budgets created' })
  totalBudgets: number;

  @ApiProperty({ description: 'Active budgets' })
  activeBudgets: number;

  @ApiProperty({ description: 'Provider connections breakdown' })
  providerConnections: {
    belvo: number;
    plaid: number;
    bitso: number;
    manual: number;
  };

  @ApiProperty({ description: 'System health metrics' })
  systemHealth: {
    databaseConnections: number;
    redisConnected: boolean;
    jobQueueStatus: 'active' | 'error' | 'idle';
    lastSyncRun?: Date;
    lastSnapshotRun?: Date;
  };
}