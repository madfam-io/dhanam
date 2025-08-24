'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam/ui';
import { Skeleton } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Progress } from '@dhanam/ui';
import { useAuth } from '~/lib/hooks/use-auth';
import { useSpaceStore } from '~/stores/space';
import { accountsApi } from '~/lib/api/accounts';
import { transactionsApi } from '~/lib/api/transactions';
import { budgetsApi } from '~/lib/api/budgets';
import { analyticsApi } from '~/lib/api/analytics';
import { formatCurrency } from '~/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  PiggyBank, 
  Target,
  Wallet,
  Receipt,
  Building2,
  Loader2
} from 'lucide-react';
import { SyncStatus } from '@/components/sync/sync-status';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentSpace } = useSpaceStore();

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts', currentSpace?.id],
    queryFn: () => accountsApi.getAccounts(currentSpace!.id),
    enabled: !!currentSpace,
  });

  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['recent-transactions', currentSpace?.id],
    queryFn: () => transactionsApi.getTransactions(currentSpace!.id, { limit: 5 }),
    enabled: !!currentSpace,
  });

  const { data: budgets, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets', currentSpace?.id],
    queryFn: () => budgetsApi.getBudgets(currentSpace!.id),
    enabled: !!currentSpace,
  });

  const { data: currentBudgetSummary } = useQuery({
    queryKey: ['current-budget-summary', currentSpace?.id, budgets?.[0]?.id],
    queryFn: () => {
      if (!budgets || budgets.length === 0 || !budgets[0]) return null;
      return budgetsApi.getBudgetSummary(currentSpace!.id, budgets[0].id);
    },
    enabled: !!currentSpace && !!budgets && budgets.length > 0 && !!budgets[0],
  });

  // New analytics queries
  const { data: netWorthData } = useQuery({
    queryKey: ['net-worth', currentSpace?.id],
    queryFn: () => analyticsApi.getNetWorth(currentSpace!.id),
    enabled: !!currentSpace,
  });

  const { data: cashflowForecast } = useQuery({
    queryKey: ['cashflow-forecast', currentSpace?.id],
    queryFn: () => analyticsApi.getCashflowForecast(currentSpace!.id),
    enabled: !!currentSpace,
  });

  const { data: portfolioAllocation } = useQuery({
    queryKey: ['portfolio-allocation', currentSpace?.id],
    queryFn: () => analyticsApi.getPortfolioAllocation(currentSpace!.id),
    enabled: !!currentSpace,
  });

  if (!currentSpace) {
    return <EmptyState />;
  }

  // Use analytics data when available, fallback to account calculations
  const totalAssets = netWorthData?.totalAssets ?? (accounts?.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0) || 0);
  const totalLiabilities = netWorthData?.totalLiabilities ?? Math.abs(accounts?.filter(a => a.balance < 0).reduce((sum, a) => sum + a.balance, 0) || 0);
  const netWorth = netWorthData?.netWorth ?? (totalAssets - totalLiabilities);
  const netWorthChange = netWorthData?.changePercent ?? 0;

  const accountTypeIcons: Record<string, React.ElementType> = {
    checking: Building2,
    savings: PiggyBank,
    credit: CreditCard,
    investment: TrendingUp,
    crypto: Wallet,
    other: Building2,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name}
        </h2>
        <p className="text-muted-foreground">
          Here's an overview of your financial status
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAccounts ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(netWorth, currentSpace.currency)
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {netWorthChange !== 0 && (
                <>
                  {netWorthChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={netWorthChange > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(netWorthChange).toFixed(1)}%
                  </span>
                </>
              )}
              {netWorth > 0 ? 'Positive' : 'Negative'} net worth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAccounts ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(totalAssets, currentSpace.currency)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {accounts?.filter(a => a.balance > 0).length || 0} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAccounts ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(totalLiabilities, currentSpace.currency)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {accounts?.filter(a => a.balance < 0).length || 0} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingBudgets ? (
                <Skeleton className="h-8 w-24" />
              ) : currentBudgetSummary ? (
                `${currentBudgetSummary.summary.totalPercentUsed.toFixed(0)}%`
              ) : (
                'No budget'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentBudgetSummary 
                ? `${formatCurrency(currentBudgetSummary.summary.totalRemaining, currentSpace.currency)} remaining`
                : 'Create a budget to track'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Accounts Overview */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              Your connected accounts and balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : accounts?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No accounts connected yet
              </p>
            ) : (
              <div className="space-y-4">
                {accounts?.map((account) => {
                  const Icon = accountTypeIcons[account.type] || Building2;
                  return (
                    <div key={account.id} className="flex items-center">
                      <Icon className="h-4 w-4 text-muted-foreground mr-2" />
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">
                          {account.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {account.type} • {account.provider}
                        </p>
                      </div>
                      <div className={`font-medium ${account.balance < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(account.balance, account.currency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentTransactions?.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentTransactions?.data.map((transaction) => (
                  <div key={transaction.id} className="flex items-center">
                    <Receipt className="h-4 w-4 text-muted-foreground mr-2" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(transaction.amount, currentSpace.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Forecast */}
      {cashflowForecast && (
        <Card>
          <CardHeader>
            <CardTitle>60-Day Cashflow Forecast</CardTitle>
            <CardDescription>
              Projected income, expenses, and balance trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Projected Income</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(cashflowForecast.summary.totalIncome, currentSpace.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected Expenses</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(cashflowForecast.summary.totalExpenses, currentSpace.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Cashflow</p>
                  <p className={`text-lg font-semibold ${(cashflowForecast.summary.totalIncome - cashflowForecast.summary.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cashflowForecast.summary.totalIncome - cashflowForecast.summary.totalExpenses, currentSpace.currency)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Balance</span>
                  <span>{formatCurrency(cashflowForecast.summary.currentBalance, currentSpace.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Projected Balance (60d)</span>
                  <span className={cashflowForecast.summary.projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(cashflowForecast.summary.projectedBalance, currentSpace.currency)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Allocation */}
      {portfolioAllocation && portfolioAllocation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>
              Asset distribution across your accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioAllocation.slice(0, 6).map((allocation) => (
                <div key={allocation.assetType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: '#6366f1' }}
                    />
                    <span className="text-sm font-medium">{allocation.assetType}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(allocation.value, currentSpace.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {allocation.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Overview */}
      {currentBudgetSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Current Budget: {budgets?.[0]?.name || 'N/A'}</CardTitle>
            <CardDescription>
              Track your spending across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentBudgetSummary.categories.slice(0, 5).map((category: any) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(category.spent, currentSpace.currency)} / {formatCurrency(category.budgetedAmount, currentSpace.currency)}
                    </span>
                  </div>
                  <Progress value={category.percentUsed} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      <SyncStatus spaceId={currentSpace.id} />
    </div>
  );
}

function EmptyState() {
  const router = useRouter();
  
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Get Started</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Create a space to start tracking your finances
        </p>
        <Button onClick={() => router.push('/spaces/new')}>
          Create Your First Space
        </Button>
      </CardContent>
    </Card>
  );
}