'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam/ui';
import { Skeleton } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Progress } from '@dhanam/ui';
import { useAuth } from '~/lib/hooks/use-auth';
import { useSpaceStore } from '~/stores/space';
import { analyticsApi } from '~/lib/api/analytics';
import { CategorySummary } from '~/lib/api/budgets';
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
  Loader2,
  Gamepad2,
} from 'lucide-react';
import { SyncStatus } from '@/components/sync/sync-status';
import { HelpTooltip } from '@/components/demo/help-tooltip';
import { AnalyticsEmptyState } from '@/components/demo/analytics-empty-state';
import { ProbabilisticGoalCard } from '@/components/goals/probabilistic-goal-card';
import { GoalHealthScore } from '@/components/goals/goal-health-score';
import { GoalProbabilityTimeline } from '@/components/goals/goal-probability-timeline';
import { PremiumGate } from '@/components/billing/PremiumGate';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentSpace } = useSpaceStore();
  const isGuestDemo = user?.email === 'guest@dhanam.demo';

  // Single combined query for all dashboard data - eliminates waterfall
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-data', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getDashboardData(currentSpace.id);
    },
    enabled: !!currentSpace,
    staleTime: 30000, // 30 seconds
  });

  // Extract data from combined response
  const accounts = dashboardData?.accounts;
  const recentTransactions = dashboardData?.recentTransactions;
  const budgets = dashboardData?.budgets;
  const currentBudgetSummary = dashboardData?.currentBudgetSummary;
  const netWorthData = dashboardData?.netWorth;
  const cashflowForecast = dashboardData?.cashflowForecast;
  const portfolioAllocation = dashboardData?.portfolioAllocation;
  const goals = dashboardData?.goals;

  // Filter active goals for display
  const activeGoals = goals?.filter((g) => g.status === 'active') || [];

  if (!currentSpace) {
    return <EmptyState />;
  }

  // Use analytics data when available, fallback to account calculations
  const totalAssets =
    netWorthData?.totalAssets ??
    (accounts?.filter((a) => a.balance > 0).reduce((sum, a) => sum + a.balance, 0) || 0);
  const totalLiabilities =
    netWorthData?.totalLiabilities ??
    Math.abs(accounts?.filter((a) => a.balance < 0).reduce((sum, a) => sum + a.balance, 0) || 0);
  const netWorth = netWorthData?.netWorth ?? totalAssets - totalLiabilities;
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
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h2>
        <p className="text-muted-foreground">Here&apos;s an overview of your financial status</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <HelpTooltip
                title="Net Worth"
                content="Total value of all your assets (savings, investments, crypto) minus liabilities (credit cards, loans). Updated in real-time as your accounts sync."
              />
            </div>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
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
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(totalAssets, currentSpace.currency)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {accounts?.filter((a) => a.balance > 0).length || 0} accounts
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
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(totalLiabilities, currentSpace.currency)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {accounts?.filter((a) => a.balance < 0).length || 0} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
              <HelpTooltip
                title="Budget Usage"
                content="Track spending against your monthly budget across categories. Dhanam auto-categorizes transactions using smart rules to help you stay on track."
              />
            </div>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
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

        {/* Goal Health Score - Only show if there are goals with probability data */}
        {!isLoading && goals && goals.length > 0 && (
          <PremiumGate feature="Goal Probability Tracking">
            <GoalHealthScore goals={goals} />
          </PremiumGate>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Accounts Overview */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>Your connected accounts and balances</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                        <p className="text-sm font-medium leading-none">{account.name}</p>
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
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentTransactions?.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions?.data.map((transaction) => (
                  <div key={transaction.id} className="flex items-center">
                    <Receipt className="h-4 w-4 text-muted-foreground mr-2" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
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
      {cashflowForecast ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>60-Day Cashflow Forecast</CardTitle>
              <HelpTooltip
                title="Cashflow Forecast"
                content="AI-powered prediction of your income and expenses for the next 60 days based on historical patterns. Helps you anticipate cash shortages and plan ahead."
              />
            </div>
            <CardDescription>Projected income, expenses, and balance trends</CardDescription>
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
                  <p
                    className={`text-lg font-semibold ${cashflowForecast.summary.totalIncome - cashflowForecast.summary.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(
                      cashflowForecast.summary.totalIncome - cashflowForecast.summary.totalExpenses,
                      currentSpace.currency
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Balance</span>
                  <span>
                    {formatCurrency(cashflowForecast.summary.currentBalance, currentSpace.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Projected Balance (60d)</span>
                  <span
                    className={
                      cashflowForecast.summary.projectedBalance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {formatCurrency(
                      cashflowForecast.summary.projectedBalance,
                      currentSpace.currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AnalyticsEmptyState
          title="60-Day Cashflow Forecast"
          description="Projected income, expenses, and balance trends"
          isDemoMode={isGuestDemo}
        />
      )}

      {/* Portfolio Allocation */}
      {portfolioAllocation && portfolioAllocation.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>Asset distribution across your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioAllocation.slice(0, 6).map((allocation) => (
                <div key={allocation.assetType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6366f1' }} />
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
      ) : null}

      {/* Probabilistic Goals */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeGoals.length > 0 ? (
        <PremiumGate feature="Goal Probability Tracking">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Financial Goals</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  Track probability of achieving your goals with Monte Carlo simulations
                  <HelpTooltip content="Each goal shows success probability based on 10,000 Monte Carlo simulations, considering your current savings, monthly contributions, and market volatility." />
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push('/goals')}>
                View All Goals
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeGoals.slice(0, 3).map((goal) => (
                <ProbabilisticGoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={() => router.push('/goals')}
                  showActions={false}
                />
              ))}
            </div>

            {/* Probability Timeline */}
            {activeGoals.length > 0 && <GoalProbabilityTimeline goals={activeGoals} />}
          </div>
        </PremiumGate>
      ) : null}

      {/* Gaming Assets Widget */}
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => router.push('/gaming')}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Gaming Assets
              </CardTitle>
              <CardDescription>Metaverse holdings, NFTs, and staking</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/gaming');
              }}
            >
              View Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">SAND Staked</p>
              <p className="text-lg font-semibold">15,000</p>
              <p className="text-xs text-green-600">8.5% APY</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">LAND Parcels</p>
              <p className="text-lg font-semibold">5</p>
              <p className="text-xs text-muted-foreground">2 rented</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NFTs</p>
              <p className="text-lg font-semibold">14</p>
              <p className="text-xs text-muted-foreground">$22.5K value</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <p className="text-lg font-semibold text-green-600">$597</p>
              <p className="text-xs text-muted-foreground">All sources</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      {currentBudgetSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Current Budget: {budgets?.[0]?.name || 'N/A'}</CardTitle>
            <CardDescription>Track your spending across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentBudgetSummary.categories.slice(0, 5).map((category: CategorySummary) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(category.spent, currentSpace.currency)} /{' '}
                      {formatCurrency(category.budgetedAmount, currentSpace.currency)}
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
        <Button onClick={() => router.push('/spaces/new')}>Create Your First Space</Button>
      </CardContent>
    </Card>
  );
}
