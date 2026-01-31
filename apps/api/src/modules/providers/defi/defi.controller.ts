import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ProviderConnectionGuard } from '../../billing/guards/provider-connection.guard';

import { DeFiService } from './defi.service';
import { ZapperService } from './zapper.service';

@ApiTags('DeFi')
@Controller('spaces/:spaceId/defi')
@UseGuards(JwtAuthGuard, ProviderConnectionGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
@ApiForbiddenResponse({ description: 'User lacks access to this space or DeFi requires Pro plan' })
export class DeFiController {
  constructor(
    private readonly defiService: DeFiService,
    private readonly zapperService: ZapperService
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get DeFi integration status',
    description: 'Check if DeFi features are available',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'DeFi integration status' })
  getStatus() {
    return {
      available: this.defiService.isAvailable(),
      supportedProtocols: [
        'uniswap-v2',
        'uniswap-v3',
        'aave-v2',
        'aave-v3',
        'compound-v2',
        'compound-v3',
        'curve',
        'lido',
        'yearn',
        'maker',
        'convex',
        'balancer',
        'sushiswap',
      ],
      supportedNetworks: [
        'ethereum',
        'polygon',
        'arbitrum',
        'optimism',
        'base',
        'avalanche',
        'bsc',
      ],
    };
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get DeFi summary for space',
    description: 'Returns aggregated DeFi positions across all crypto accounts',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'DeFi summary with positions grouped by protocol and type' })
  getSpaceSummary(@Param('spaceId') spaceId: string, @Req() req: Request) {
    void req.user!.id;
    return this.defiService.getSpaceDeFiSummary(spaceId);
  }

  @Get('accounts/:accountId')
  @ApiOperation({
    summary: 'Get DeFi positions for an account',
    description: 'Returns all DeFi positions for a specific crypto account',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiOkResponse({ description: 'Account DeFi positions' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  getAccountPositions(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string,
    @Req() req: Request
  ) {
    void req.user!.id;
    return this.defiService.getAccountPositions(spaceId, accountId);
  }

  @Post('accounts/:accountId/sync')
  @ApiOperation({
    summary: 'Sync DeFi positions for an account',
    description: 'Refresh DeFi positions from external sources',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiOkResponse({ description: 'Sync result with updated positions' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  syncAccountPositions(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string,
    @Req() req: Request
  ) {
    void req.user!.id;
    return this.defiService.syncAccountPositions(spaceId, accountId);
  }

  @Post('sync-all')
  @ApiOperation({
    summary: 'Sync all DeFi positions in space',
    description: 'Refresh DeFi positions for all crypto accounts',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Sync results for all accounts' })
  syncAllPositions(@Param('spaceId') spaceId: string, @Req() req: Request) {
    void req.user!.id;
    return this.defiService.syncAllAccountsInSpace(spaceId);
  }
}
