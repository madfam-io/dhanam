import {
  NetWorthResponse,
  CashflowForecast,
  SpendingByCategory,
  IncomeVsExpenses,
  AccountBalanceAnalytics,
  PortfolioAllocation,
  Currency,
} from '@dhanam/shared';
import { Controller, Get, Post, Query, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import {
  NetWorthHistoryPoint,
  NetWorthByOwnership,
  OwnershipFilter,
  AnalyticsService,
} from './analytics.service';
import { AnomalyService } from './anomaly.service';
import {
  LongTermForecastService,
  CreateProjectionDto,
  WhatIfComparisonDto,
} from './long-term-forecast.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly anomalyService: AnomalyService,
    private readonly longTermForecastService: LongTermForecastService
  ) {}

  @Get(':spaceId/net-worth')
  @ApiOperation({ summary: 'Get net worth for a space (with multi-currency conversion)' })
  async getNetWorth(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('currency') currency?: string
  ): Promise<NetWorthResponse> {
    const targetCurrency = currency ? (currency.toUpperCase() as Currency) : undefined;
    return this.analyticsService.getNetWorth(req.user!.userId, spaceId, targetCurrency);
  }

  @Get(':spaceId/net-worth-history')
  @ApiOperation({ summary: 'Get net worth history for charting' })
  async getNetWorthHistory(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('days') days?: string
  ): Promise<NetWorthHistoryPoint[]> {
    return this.analyticsService.getNetWorthHistory(
      req.user!.userId,
      spaceId,
      days ? parseInt(days, 10) : 30
    );
  }

  @Get(':spaceId/net-worth-by-ownership')
  @ApiOperation({ summary: 'Get net worth breakdown by ownership (yours, mine, ours)' })
  async getNetWorthByOwnership(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('currency') currency?: string
  ): Promise<NetWorthByOwnership> {
    const targetCurrency = currency ? (currency.toUpperCase() as Currency) : undefined;
    return this.analyticsService.getNetWorthByOwnership(req.user!.userId, spaceId, targetCurrency);
  }

  @Get(':spaceId/accounts-by-ownership')
  @ApiOperation({ summary: 'Get accounts filtered by ownership type' })
  async getAccountsByOwnership(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('ownership') ownership?: string
  ) {
    const filter = (ownership as OwnershipFilter) || 'all';
    return this.analyticsService.getAccountsByOwnership(req.user!.userId, spaceId, filter);
  }

  @Get(':spaceId/cashflow-forecast')
  @ApiOperation({ summary: 'Get cashflow forecast' })
  async getCashflowForecast(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('days') days?: string
  ): Promise<CashflowForecast> {
    return this.analyticsService.getCashflowForecast(
      req.user!.userId,
      spaceId,
      days ? parseInt(days, 10) : 60
    );
  }

  @Get(':spaceId/spending-by-category')
  @ApiOperation({ summary: 'Get spending breakdown by category' })
  async getSpendingByCategory(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<SpendingByCategory[]> {
    return this.analyticsService.getSpendingByCategory(
      req.user!.userId,
      spaceId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get(':spaceId/income-vs-expenses')
  @ApiOperation({ summary: 'Get income vs expenses trend' })
  async getIncomeVsExpenses(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('months') months?: string
  ): Promise<IncomeVsExpenses[]> {
    return this.analyticsService.getIncomeVsExpenses(
      req.user!.userId,
      spaceId,
      months ? parseInt(months, 10) : 6
    );
  }

  @Get(':spaceId/account-balances')
  @ApiOperation({ summary: 'Get all account balances' })
  async getAccountBalances(
    @Request() req: any,
    @Param('spaceId') spaceId: string
  ): Promise<AccountBalanceAnalytics[]> {
    return this.analyticsService.getAccountBalances(req.user!.userId, spaceId);
  }

  @Get(':spaceId/portfolio-allocation')
  @ApiOperation({ summary: 'Get portfolio allocation breakdown' })
  async getPortfolioAllocation(
    @Request() req: any,
    @Param('spaceId') spaceId: string
  ): Promise<PortfolioAllocation[]> {
    return this.analyticsService.getPortfolioAllocation(req.user!.userId, spaceId);
  }

  @Get(':spaceId/dashboard-data')
  @ApiOperation({ summary: 'Get combined dashboard data in a single request' })
  async getDashboardData(@Request() req: any, @Param('spaceId') spaceId: string) {
    return this.analyticsService.getDashboardData(req.user!.userId, spaceId);
  }

  @Get(':spaceId/anomalies')
  @ApiOperation({ summary: 'Detect spending anomalies' })
  async getAnomalies(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string
  ) {
    return this.anomalyService.detectAnomalies(req.user!.userId, spaceId, {
      days: days ? parseInt(days, 10) : 30,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':spaceId/anomalies/summary')
  @ApiOperation({ summary: 'Get anomaly detection summary' })
  async getAnomalySummary(@Request() req: any, @Param('spaceId') spaceId: string) {
    return this.anomalyService.getAnomalySummary(spaceId, req.user!.userId);
  }

  // Long-Term Projection Endpoints

  @Post(':spaceId/projections')
  @ApiOperation({ summary: 'Generate a long-term financial projection (10-30 years)' })
  async generateProjection(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateProjectionDto
  ) {
    return this.longTermForecastService.generateProjection(req.user!.userId, spaceId, dto);
  }

  @Post(':spaceId/projections/compare')
  @ApiOperation({ summary: 'Compare what-if scenarios against baseline projection' })
  async compareScenarios(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Body() dto: WhatIfComparisonDto
  ) {
    return this.longTermForecastService.compareScenarios(req.user!.userId, spaceId, dto);
  }

  @Get(':spaceId/projections/quick')
  @ApiOperation({ summary: 'Get quick projection summary for dashboard' })
  async getQuickProjection(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('currentAge') currentAge: string,
    @Query('retirementAge') retirementAge: string
  ) {
    return this.longTermForecastService.getQuickProjection(
      req.user!.userId,
      spaceId,
      parseInt(currentAge, 10),
      parseInt(retirementAge, 10)
    );
  }

  @Get(':spaceId/projections/scenario-templates')
  @ApiOperation({ summary: 'Get predefined what-if scenario templates' })
  getScenarioTemplates() {
    return this.longTermForecastService.getScenarioTemplates();
  }
}
