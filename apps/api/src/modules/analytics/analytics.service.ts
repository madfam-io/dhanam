import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { 
  NetWorthResponse, 
  CashflowForecast, 
  SpendingByCategory,
  IncomeVsExpenses,
  AccountBalanceAnalytics,
  PortfolioAllocation
} from '@dhanam/shared';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
  ) {}

  async getNetWorth(userId: string, spaceId: string): Promise<NetWorthResponse> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
      include: {
        assetValuations: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const totalAssets = accounts
      .filter(a => a.balance.toNumber() > 0)
      .reduce((sum, account) => sum + account.balance.toNumber(), 0);

    const totalLiabilities = accounts
      .filter(a => a.balance.toNumber() < 0)
      .reduce((sum, account) => sum + Math.abs(account.balance.toNumber()), 0);

    const netWorth = totalAssets - totalLiabilities;

    // Get historical data for trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalValuations = await this.prisma.assetValuation.findMany({
      where: {
        accountId: { in: accounts.map(a => a.id) },
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    const trend = historicalValuations.map(v => ({
      date: v.date.toISOString(),
      value: v.value.toNumber(),
    }));

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      currency: 'MXN',
      lastUpdated: new Date().toISOString(),
      trend,
      changePercent: 0, // TODO: Calculate actual change
      changeAmount: 0,
    };
  }

  async getCashflowForecast(
    userId: string,
    spaceId: string,
    days = 60,
  ): Promise<CashflowForecast> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Simplified implementation
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < days; i += 7) { // Weekly forecast
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString(),
        income: 0,
        expenses: 0,
        balance: 0,
      });
    }

    return {
      forecast,
      summary: {
        currentBalance: 0,
        projectedBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        currency: 'MXN',
      },
    };
  }

  async getSpendingByCategory(
    userId: string,
    spaceId: string,
    startDate: Date,
    endDate: Date,
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
        id: { in: transactions.map(t => t.categoryId).filter(Boolean) as string[] },
      },
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    return transactions
      .filter(t => t.categoryId)
      .map(t => {
        const category = categoryMap.get(t.categoryId!);
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
    months = 6,
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

    return accounts.map(account => ({
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      balance: account.balance.toNumber(),
      currency: account.currency,
      lastSynced: account.lastSyncedAt?.toISOString(),
    }));
  }

  async getPortfolioAllocation(
    userId: string,
    spaceId: string,
  ): Promise<PortfolioAllocation[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
    });

    const totalValue = accounts.reduce(
      (sum, account) => sum + Math.abs(account.balance.toNumber()),
      0,
    );

    const typeGroups = accounts.reduce((groups, account) => {
      const type = account.type;
      if (!groups[type]) {
        groups[type] = { value: 0, count: 0 };
      }
      groups[type]!.value += Math.abs(account.balance.toNumber());
      groups[type]!.count += 1;
      return groups;
    }, {} as Record<string, { value: number; count: number }>);

    return Object.entries(typeGroups).map(([type, data]) => ({
      assetType: type,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      accountCount: data.count,
    }));
  }
}