import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { 
  NetWorthResponse,
  CashflowForecast,
  SpendingByCategory,
  IncomeVsExpenses,
  AccountBalanceAnalytics,
  PortfolioAllocation,
} from '@dhanam/shared';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':spaceId/net-worth')
  @ApiOperation({ summary: 'Get net worth for a space' })
  async getNetWorth(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
  ): Promise<NetWorthResponse> {
    return this.analyticsService.getNetWorth(req.user!.userId, spaceId);
  }

  @Get(':spaceId/cashflow-forecast')
  @ApiOperation({ summary: 'Get cashflow forecast' })
  async getCashflowForecast(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('days') days?: string,
  ): Promise<CashflowForecast> {
    return this.analyticsService.getCashflowForecast(
      req.user!.userId,
      spaceId,
      days ? parseInt(days, 10) : 60,
    );
  }

  @Get(':spaceId/spending-by-category')
  @ApiOperation({ summary: 'Get spending breakdown by category' })
  async getSpendingByCategory(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<SpendingByCategory[]> {
    return this.analyticsService.getSpendingByCategory(
      req.user!.userId,
      spaceId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':spaceId/income-vs-expenses')
  @ApiOperation({ summary: 'Get income vs expenses trend' })
  async getIncomeVsExpenses(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
    @Query('months') months?: string,
  ): Promise<IncomeVsExpenses[]> {
    return this.analyticsService.getIncomeVsExpenses(
      req.user!.userId,
      spaceId,
      months ? parseInt(months, 10) : 6,
    );
  }

  @Get(':spaceId/account-balances')
  @ApiOperation({ summary: 'Get all account balances' })
  async getAccountBalances(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
  ): Promise<AccountBalanceAnalytics[]> {
    return this.analyticsService.getAccountBalances(req.user!.userId, spaceId);
  }

  @Get(':spaceId/portfolio-allocation')
  @ApiOperation({ summary: 'Get portfolio allocation breakdown' })
  async getPortfolioAllocation(
    @Request() req: any,
    @Param('spaceId') spaceId: string,
  ): Promise<PortfolioAllocation[]> {
    return this.analyticsService.getPortfolioAllocation(req.user!.userId, spaceId);
  }
}