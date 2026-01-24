import {
  NetWorthResponse,
  CashflowForecast,
  SpendingByCategory,
  IncomeVsExpenses,
  AccountBalanceAnalytics,
  PortfolioAllocation,
  Currency,
} from '@dhanam/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { FxRatesService } from '../fx-rates/fx-rates.service';
import { SpacesService } from '../spaces/spaces.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private fxRatesService: FxRatesService
  ) {}

  /**
   * Calculate net worth with multi-currency support.
   * Converts all account balances to the target currency (defaults to space's base currency).
   * @param userId - The user ID
   * @param spaceId - The space ID
   * @param targetCurrency - Optional target currency for conversion (defaults to space currency)
   */
  async getNetWorth(
    userId: string,
    spaceId: string,
    targetCurrency?: Currency
  ): Promise<NetWorthResponse> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Get space to determine default currency
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    const displayCurrency = targetCurrency || (space?.currency as Currency) || Currency.MXN;

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
      include: {
        assetValuations: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    // Also fetch manual assets for comprehensive net worth
    const manualAssets = await this.prisma.manualAsset.findMany({
      where: { spaceId },
    });

    // Convert all account balances to target currency
    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const account of accounts) {
      const balance = account.balance.toNumber();
      const accountCurrency = account.currency as Currency;

      // Convert to target currency if different
      let convertedBalance = balance;
      if (accountCurrency !== displayCurrency) {
        convertedBalance = await this.fxRatesService.convertAmount(
          Math.abs(balance),
          accountCurrency,
          displayCurrency
        );
        // Preserve sign after conversion
        if (balance < 0) convertedBalance = -convertedBalance;
      }

      if (convertedBalance > 0) {
        totalAssets += convertedBalance;
      } else {
        totalLiabilities += Math.abs(convertedBalance);
      }
    }

    // Add manual assets (converted to target currency)
    for (const asset of manualAssets) {
      const value = asset.currentValue.toNumber();
      const assetCurrency = asset.currency as Currency;

      let convertedValue = value;
      if (assetCurrency !== displayCurrency) {
        convertedValue = await this.fxRatesService.convertAmount(
          value,
          assetCurrency,
          displayCurrency
        );
      }

      totalAssets += convertedValue;
    }

    const netWorth = totalAssets - totalLiabilities;

    // Get historical data for trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalValuations = await this.prisma.assetValuation.findMany({
      where: {
        accountId: { in: accounts.map((a) => a.id) },
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Convert historical valuations to target currency for consistent trend
    const trendPromises = historicalValuations.map(async (v) => {
      const account = accounts.find((a) => a.id === v.accountId);
      const valuationCurrency = (v.currency || account?.currency || Currency.MXN) as Currency;
      let value = v.value.toNumber();

      if (valuationCurrency !== displayCurrency) {
        value = await this.fxRatesService.convertAmount(value, valuationCurrency, displayCurrency);
      }

      return {
        date: v.date.toISOString(),
        value,
      };
    });

    const trend = await Promise.all(trendPromises);

    // Calculate change from earliest to latest
    let changeAmount = 0;
    let changePercent = 0;
    if (trend.length >= 2) {
      const earliest = trend[0]?.value || 0;
      const latest = trend[trend.length - 1]?.value || 0;
      changeAmount = latest - earliest;
      changePercent = earliest > 0 ? ((latest - earliest) / earliest) * 100 : 0;
    }

    return {
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      netWorth: Math.round(netWorth * 100) / 100,
      currency: displayCurrency,
      lastUpdated: new Date().toISOString(),
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
      changeAmount: Math.round(changeAmount * 100) / 100,
    };
  }

  async getCashflowForecast(userId: string, spaceId: string, days = 60): Promise<CashflowForecast> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Get current liquid account balances
    const liquidAccounts = await this.prisma.account.findMany({
      where: {
        spaceId,
        type: { in: ['checking', 'savings'] },
      },
    });

    const currentBalance = liquidAccounts.reduce(
      (sum, account) => sum + account.balance.toNumber(),
      0
    );

    // Analyze historical patterns for forecasting
    const historicalData = await this.getHistoricalCashflowPatterns(spaceId, 90); // Last 90 days

    const forecast = [];
    let runningBalance = currentBalance;
    const today = new Date();

    for (let i = 0; i < days; i += 7) {
      // Weekly granularity
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      // Predict weekly income/expenses based on historical averages
      const weeklyIncome = historicalData.avgWeeklyIncome || 0;
      const weeklyExpenses = historicalData.avgWeeklyExpenses || 0;
      const weeklyNet = weeklyIncome - weeklyExpenses;

      runningBalance += weeklyNet;

      forecast.push({
        date: forecastDate.toISOString(),
        income: weeklyIncome,
        expenses: weeklyExpenses,
        balance: runningBalance,
      });
    }

    const totalProjectedIncome = forecast.reduce((sum, week) => sum + week.income, 0);
    const totalProjectedExpenses = forecast.reduce((sum, week) => sum + week.expenses, 0);

    return {
      forecast,
      summary: {
        currentBalance,
        projectedBalance: runningBalance,
        totalIncome: totalProjectedIncome,
        totalExpenses: totalProjectedExpenses,
        currency: Currency.MXN,
      },
    };
  }

  private async getHistoricalCashflowPatterns(
    spaceId: string,
    days: number
  ): Promise<{
    avgWeeklyIncome: number;
    avgWeeklyExpenses: number;
    incomeVariability: number;
    expenseVariability: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get income transactions (positive amounts)
    const incomeData = await this.prisma.transaction.aggregate({
      where: {
        account: { spaceId },
        date: { gte: startDate },
        amount: { gt: 0 },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get expense transactions (negative amounts)
    const expenseData = await this.prisma.transaction.aggregate({
      where: {
        account: { spaceId },
        date: { gte: startDate },
        amount: { lt: 0 },
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalIncome = incomeData._sum.amount?.toNumber() || 0;
    const totalExpenses = Math.abs(expenseData._sum.amount?.toNumber() || 0);

    const weeksInPeriod = days / 7;

    return {
      avgWeeklyIncome: totalIncome / weeksInPeriod,
      avgWeeklyExpenses: totalExpenses / weeksInPeriod,
      incomeVariability: 0.1, // 10% variance
      expenseVariability: 0.15, // 15% variance
    };
  }

  async getSpendingByCategory(
    userId: string,
    spaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SpendingByCategory[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const transactions = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        account: { spaceId },
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 },
      },
      _sum: { amount: true },
      _count: true,
    });

    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: transactions.map((t) => t.categoryId).filter(Boolean) as string[] },
      },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return transactions
      .filter((t) => t.categoryId)
      .map((t) => {
        const category = categoryMap.get(t.categoryId!) as (typeof categories)[0] | undefined;
        return {
          categoryId: t.categoryId!,
          categoryName: category?.name || 'Unknown',
          amount: Math.abs(t._sum.amount?.toNumber() || 0),
          percentage: 0, // TODO: Calculate percentage
          transactionCount: t._count,
          icon: category?.icon || undefined,
          color: category?.color || undefined,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  async getIncomeVsExpenses(
    userId: string,
    spaceId: string,
    months = 6
  ): Promise<IncomeVsExpenses[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const result: IncomeVsExpenses[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const [income, expenses] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            account: { spaceId },
            date: { gte: startDate, lte: endDate },
            amount: { gt: 0 },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            account: { spaceId },
            date: { gte: startDate, lte: endDate },
            amount: { lt: 0 },
          },
          _sum: { amount: true },
        }),
      ]);

      result.push({
        month: startDate.toISOString().slice(0, 7),
        income: income._sum.amount?.toNumber() || 0,
        expenses: Math.abs(expenses._sum.amount?.toNumber() || 0),
        net: (income._sum.amount?.toNumber() || 0) + (expenses._sum.amount?.toNumber() || 0),
      });
    }

    return result;
  }

  async getAccountBalances(userId: string, spaceId: string): Promise<AccountBalanceAnalytics[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
      orderBy: { balance: 'desc' },
    });

    return accounts.map((account) => ({
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      balance: account.balance.toNumber(),
      currency: account.currency as Currency,
      lastSynced: account.lastSyncedAt?.toISOString(),
    }));
  }

  async getPortfolioAllocation(userId: string, spaceId: string): Promise<PortfolioAllocation[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
    });

    const totalValue = accounts.reduce(
      (sum, account) => sum + Math.abs(account.balance.toNumber()),
      0
    );

    const typeGroups = accounts.reduce(
      (groups, account) => {
        const type = account.type;
        if (!groups[type]) {
          groups[type] = { value: 0, count: 0 };
        }
        groups[type]!.value += Math.abs(account.balance.toNumber());
        groups[type]!.count += 1;
        return groups;
      },
      {} as Record<string, { value: number; count: number }>
    );

    return Object.entries(typeGroups).map(([type, data]) => {
      const typedData = data as { value: number; count: number };
      return {
        assetType: type,
        value: typedData.value,
        percentage: totalValue > 0 ? (typedData.value / totalValue) * 100 : 0,
        accountCount: typedData.count,
      };
    });
  }

  /**
   * Combined dashboard data endpoint to reduce waterfall requests
   * Returns all data needed for dashboard in a single API call
   */
  async getDashboardData(userId: string, spaceId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Fetch all data in parallel
    const [
      accounts,
      recentTransactions,
      budgetsWithSummary,
      netWorth,
      cashflowForecast,
      portfolioAllocation,
      goals,
    ] = await Promise.all([
      // Accounts
      this.prisma.account.findMany({
        where: { spaceId },
        orderBy: { balance: 'desc' },
      }),
      // Recent transactions (limit 5)
      this.prisma.transaction.findMany({
        where: { account: { spaceId } },
        orderBy: { date: 'desc' },
        take: 5,
        include: { account: true },
      }),
      // Budgets with first budget summary
      this.getBudgetsWithSummary(spaceId),
      // Net worth
      this.getNetWorth(userId, spaceId),
      // Cashflow forecast
      this.getCashflowForecast(userId, spaceId, 60),
      // Portfolio allocation
      this.getPortfolioAllocation(userId, spaceId),
      // Goals
      this.prisma.goal.findMany({
        where: { spaceId },
        include: {
          allocations: {
            include: {
              account: {
                select: {
                  id: true,
                  name: true,
                  balance: true,
                  currency: true,
                },
              },
            },
          },
        },
        orderBy: [{ priority: 'asc' }, { targetDate: 'asc' }],
        take: 10,
      }),
    ]);

    return {
      accounts: accounts.map((a) => ({
        ...a,
        balance: a.balance.toNumber(),
      })),
      recentTransactions: {
        data: recentTransactions.map((t) => ({
          ...t,
          amount: t.amount.toNumber(),
          date: t.date.toISOString(),
        })),
        total: recentTransactions.length,
      },
      budgets: budgetsWithSummary.budgets,
      currentBudgetSummary: budgetsWithSummary.summary,
      netWorth,
      cashflowForecast,
      portfolioAllocation,
      goals: goals.map((g) => ({
        ...g,
        targetAmount: g.targetAmount.toNumber(),
        currentProbability: g.currentProbability?.toNumber() ?? null,
        confidenceLow: g.confidenceLow?.toNumber() ?? null,
        confidenceHigh: g.confidenceHigh?.toNumber() ?? null,
        currentProgress: g.currentProgress?.toNumber() ?? null,
        expectedReturn: g.expectedReturn?.toNumber() ?? null,
        volatility: g.volatility?.toNumber() ?? null,
        monthlyContribution: g.monthlyContribution?.toNumber() ?? null,
        allocations: g.allocations.map((a) => ({
          ...a,
          percentage: a.percentage.toNumber(),
          account: {
            ...a.account,
            balance: a.account.balance.toNumber(),
          },
        })),
      })),
    };
  }

  private async getBudgetsWithSummary(spaceId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { spaceId },
      include: {
        categories: {
          include: {
            _count: {
              select: { transactions: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (budgets.length === 0) {
      return { budgets: [], summary: null };
    }

    const currentBudget = budgets[0];
    if (!currentBudget) {
      return { budgets: [], summary: null };
    }

    // Get transactions for current budget
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: {
          gte: currentBudget.startDate,
          lte: currentBudget.endDate || undefined,
        },
        categoryId: {
          in: currentBudget.categories.map((c) => c.id),
        },
      },
    });

    // Calculate category summaries
    const categories = currentBudget.categories.map((category) => {
      const categoryTransactions = transactions.filter((t) => t.categoryId === category.id);
      const spent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount.toNumber()), 0);
      const budgetedAmount = category.budgetedAmount.toNumber();
      const carryoverAmount = category.carryoverAmount.toNumber();
      const remaining = budgetedAmount + carryoverAmount - spent;
      const percentUsed =
        budgetedAmount + carryoverAmount > 0
          ? (spent / (budgetedAmount + carryoverAmount)) * 100
          : 0;

      return {
        id: category.id,
        budgetId: category.budgetId,
        name: category.name,
        budgetedAmount,
        carryoverAmount,
        icon: category.icon,
        color: category.color,
        description: category.description,
        spent,
        remaining,
        percentUsed,
        transactionCount: categoryTransactions.length,
      };
    });

    const totalIncome = currentBudget.income.toNumber();
    const totalBudgeted = currentBudget.categories.reduce(
      (sum, c) => sum + c.budgetedAmount.toNumber(),
      0
    );
    const totalCarryover = currentBudget.categories.reduce(
      (sum, c) => sum + c.carryoverAmount.toNumber(),
      0
    );
    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
    const totalRemaining = totalBudgeted + totalCarryover - totalSpent;
    const totalPercentUsed =
      totalBudgeted + totalCarryover > 0
        ? (totalSpent / (totalBudgeted + totalCarryover)) * 100
        : 0;

    return {
      budgets: budgets.map((b) => ({
        id: b.id,
        name: b.name,
        period: b.period,
        startDate: b.startDate.toISOString(),
        endDate: b.endDate?.toISOString() || null,
        income: b.income.toNumber(),
      })),
      summary: {
        id: currentBudget.id,
        name: currentBudget.name,
        categories,
        summary: {
          totalBudgeted,
          totalSpent,
          totalRemaining,
          totalPercentUsed,
          totalIncome,
          readyToAssign: totalIncome + totalCarryover - totalBudgeted,
          totalCarryover,
        },
      },
    };
  }
}
