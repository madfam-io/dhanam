import { User } from '@dhanam/shared';
import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { SpaceGuard } from '../../spaces/guards/space.guard';

import { ConnectionHealthService } from './connection-health.service';

@ApiTags('Connection Health')
@Controller('providers/connection-health')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
export class ConnectionHealthController {
  constructor(private readonly connectionHealthService: ConnectionHealthService) {}

  @Get('spaces/:spaceId')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Get connection health dashboard for a space',
    description:
      'Returns health status for all connected accounts including sync status, errors, and required actions',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({
    description: 'Connection health dashboard data',
    schema: {
      type: 'object',
      properties: {
        totalConnections: { type: 'number' },
        healthyCount: { type: 'number' },
        degradedCount: { type: 'number' },
        errorCount: { type: 'number' },
        requiresReauthCount: { type: 'number' },
        overallHealthScore: { type: 'number', description: '0-100 overall health score' },
        accounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
              accountName: { type: 'string' },
              provider: { type: 'string' },
              status: {
                type: 'string',
                enum: ['healthy', 'degraded', 'error', 'disconnected', 'requires_reauth'],
              },
              lastSyncAt: { type: 'string', format: 'date-time' },
              healthScore: { type: 'number' },
              actionRequired: { type: 'string', nullable: true },
            },
          },
        },
        providerHealth: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              status: { type: 'string' },
              circuitState: { type: 'string', enum: ['closed', 'open', 'half-open'] },
              errorRate: { type: 'number' },
              avgResponseTime: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getConnectionHealth(@Param('spaceId') spaceId: string, @CurrentUser() _user: User) {
    return this.connectionHealthService.getConnectionHealth(spaceId);
  }

  @Get('spaces/:spaceId/needs-attention')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Get accounts that need attention',
    description: 'Returns only accounts with errors, requiring reauth, or disconnected',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of accounts needing attention' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getAccountsNeedingAttention(@Param('spaceId') spaceId: string, @CurrentUser() _user: User) {
    const accounts = await this.connectionHealthService.getAccountsNeedingAttention(spaceId);
    return {
      accounts,
      count: accounts.length,
      hasIssues: accounts.length > 0,
    };
  }

  @Get('accounts/:accountId')
  @ApiOperation({
    summary: 'Get health status for a specific account',
  })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiOkResponse({ description: 'Account connection health details' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  async getAccountHealth(@Param('accountId') accountId: string, @CurrentUser() _user: User) {
    const health = await this.connectionHealthService.getAccountHealth(accountId);
    if (!health) {
      return {
        error: 'Account not found',
        accountId,
      };
    }
    return health;
  }

  @Get('spaces/:spaceId/summary')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Get quick health summary',
    description: 'Returns a simplified health status for display in dashboard widgets',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({
    name: 'includeProviders',
    required: false,
    type: Boolean,
    description: 'Include provider-level health information',
  })
  @ApiOkResponse({ description: 'Quick health summary' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getHealthSummary(
    @Param('spaceId') spaceId: string,
    @CurrentUser() _user: User,
    @Query('includeProviders') includeProviders?: string
  ) {
    const health = await this.connectionHealthService.getConnectionHealth(spaceId);

    let statusBadge: 'green' | 'yellow' | 'red' = 'green';
    let statusText = 'All connections healthy';

    if (health.requiresReauthCount > 0 || health.errorCount > 0) {
      statusBadge = 'red';
      statusText = `${health.errorCount + health.requiresReauthCount} connection(s) need attention`;
    } else if (health.degradedCount > 0) {
      statusBadge = 'yellow';
      statusText = `${health.degradedCount} connection(s) degraded`;
    }

    const response: any = {
      statusBadge,
      statusText,
      healthScore: health.overallHealthScore,
      totalConnections: health.totalConnections,
      healthyCount: health.healthyCount,
      issueCount: health.errorCount + health.requiresReauthCount + health.degradedCount,
    };

    if (includeProviders === 'true') {
      response.providerHealth = health.providerHealth;
    }

    return response;
  }
}
