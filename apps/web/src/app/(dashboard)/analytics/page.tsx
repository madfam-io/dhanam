'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@dhanam/ui';
import { Skeleton } from '@dhanam/ui';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  BarChart3,
  Calendar,
  Loader2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useSpaceStore } from '@/stores/space';
import { analyticsApi } from '@/lib/api/analytics';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const { currentSpace } = useSpaceStore();

  const { data: netWorthData, isLoading: isLoadingNetWorth } = useQuery({
    queryKey: ['net-worth', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getNetWorth(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  const { data: spendingData, isLoading: isLoadingSpending } = useQuery({
    queryKey: ['spending-by-category', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return analyticsApi.getSpendingByCategory(currentSpace.id, startDate, endDate);
    },
    enabled: !!currentSpace,
  });

  const { data: incomeVsExpenses, isLoading: isLoadingIncomeExpenses } = useQuery({
    queryKey: ['income-vs-expenses', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getIncomeVsExpenses(currentSpace.id, 6);
    },
    enabled: !!currentSpace,
  });

  const { data: cashflowForecast, isLoading: isLoadingCashflow } = useQuery({
    queryKey: ['cashflow-forecast', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getCashflowForecast(currentSpace.id, 60);
    },
    enabled: !!currentSpace,
  });

  const { data: portfolioAllocation, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['portfolio-allocation', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getPortfolioAllocation(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No space selected</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Please select a space from the sidebar to view your analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your financial health</p>
      </div>

      {/* Net Worth Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingNetWorth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(netWorthData?.netWorth || 0, currentSpace.currency)}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {netWorthData?.changePercent !== undefined &&
                    netWorthData.changePercent !== 0 && (
                      <>
                        {netWorthData.changePercent > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span
                          className={
                            netWorthData.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {Math.abs(netWorthData.changePercent).toFixed(1)}%
                        </span>
                      </>
                    )}
                  vs last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingNetWorth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(netWorthData?.totalAssets || 0, currentSpace.currency)}
                </div>
                <p className="text-xs text-muted-foreground">Savings, investments, and crypto</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingNetWorth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(netWorthData?.totalLiabilities || 0, currentSpace.currency)}
                </div>
                <p className="text-xs text-muted-foreground">Credit cards and loans</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debt Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingNetWorth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {netWorthData?.totalAssets
                    ? ((netWorthData.totalLiabilities / netWorthData.totalAssets) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Liabilities to assets</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Spending by Category
            </CardTitle>
            <CardDescription>Last 30 days breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSpending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : spendingData && spendingData.length > 0 ? (
              <div className="space-y-4">
                {spendingData.slice(0, 8).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: `hsl(${(index * 45) % 360}, 70%, 50%)`,
                        }}
                      />
                      <span className="text-sm font-medium">{category.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(Math.abs(category.amount), currentSpace.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <PieChart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  No spending data available for this period
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/transactions">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Income vs Expenses
            </CardTitle>
            <CardDescription>Last 6 months trend</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingIncomeExpenses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : incomeVsExpenses && incomeVsExpenses.length > 0 ? (
              <div className="space-y-4">
                {incomeVsExpenses.map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <span
                        className={
                          month.income - month.expenses >= 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {formatCurrency(month.income - month.expenses, currentSpace.currency)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Income</span>
                        <span className="text-green-600">
                          {formatCurrency(month.income, currentSpace.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expenses</span>
                        <span className="text-red-600">
                          {formatCurrency(month.expenses, currentSpace.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  No income/expense data available
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/accounts">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Account
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            60-Day Cashflow Forecast
          </CardTitle>
          <CardDescription>Projected income, expenses, and balance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCashflow ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cashflowForecast ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(cashflowForecast.summary.currentBalance, currentSpace.currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Projected Income</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(cashflowForecast.summary.totalIncome, currentSpace.currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Projected Expenses</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(cashflowForecast.summary.totalExpenses, currentSpace.currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Projected Balance</p>
                  <p
                    className={`text-lg font-semibold ${
                      cashflowForecast.summary.projectedBalance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(
                      cashflowForecast.summary.projectedBalance,
                      currentSpace.currency
                    )}
                  </p>
                </div>
              </div>

              {cashflowForecast.forecast && cashflowForecast.forecast.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Forecast Timeline</h4>
                  <div className="space-y-2">
                    {cashflowForecast.forecast.slice(0, 8).map((point, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">Day {index + 1}</p>
                          <p className="text-xs text-muted-foreground">{point.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            <span className="text-green-600">
                              +{formatCurrency(point.income, currentSpace.currency)}
                            </span>
                            {' / '}
                            <span className="text-red-600">
                              -{formatCurrency(point.expenses, currentSpace.currency)}
                            </span>
                          </p>
                          <p
                            className={`text-xs ${
                              point.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            Balance: {formatCurrency(point.balance, currentSpace.currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">No cashflow forecast available</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/accounts">
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Account
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Allocation
          </CardTitle>
          <CardDescription>Asset distribution across your accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPortfolio ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : portfolioAllocation && portfolioAllocation.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {portfolioAllocation.map((allocation, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                      }}
                    />
                    <div>
                      <p className="font-medium">{allocation.assetType}</p>
                      <p className="text-xs text-muted-foreground">
                        {allocation.percentage.toFixed(1)}% of portfolio
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(allocation.value, currentSpace.currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <PieChart className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                No portfolio allocation data available
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/accounts">
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Account
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
