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
import { useTranslation } from '@dhanam/shared';
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
import { DemoTour } from '@/components/demo/demo-tour';
import { SavingsStreak } from '@/components/insights/savings-streak';
import { InsightCards } from '@/components/insights/insight-cards';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentSpace } = useSpaceStore();
  const isGuestDemo = user?.email === 'guest@dhanam.demo';
  const { t } = useTranslation('dashboard');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-data', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getDashboardData(currentSpace.id);
    },
    enabled: !!currentSpace,
    staleTime: 30000,
  });

  const accounts = dashboardData?.accounts;
  const recentTransactions = dashboardData?.recentTransactions;
  const budgets = dashboardData?.budgets;
  const currentBudgetSummary = dashboardData?.currentBudgetSummary;
  const netWorthData = dashboardData?.netWorth;
  const cashflowForecast = dashboardData?.cashflowForecast;
  const portfolioAllocation = dashboardData?.portfolioAllocation;
  const goals = dashboardData?.goals;

  const activeGoals = goals?.filter((g) => g.status === 'active') || [];

  if (!currentSpace) {
    return <EmptyState />;
  }

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

  const isDemo = user?.email?.endsWith('@dhanam.demo') ?? false;
  const isNonGuestDemo = isDemo && !isGuestDemo;

  return (
    <div className="space-y-6">
      {isDemo && <DemoTour />}

      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {t('overview.welcomeBack', { name: user?.name ?? '' })}
        </h2>
        <p className="text-muted-foreground">{t('overview.financialOverview')}</p>
      </div>

      {/* Proactive Insights for demo personas */}
      {isNonGuestDemo && <InsightCards />}

      {/* Savings Streak for non-guest demo personas */}
      {isNonGuestDemo && <SavingsStreak />}

      {/* Meet the Personas for guest users */}
      {isGuestDemo && <MeetThePersonas />}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('overview.netWorth')}</CardTitle>
              <HelpTooltip title={t('overview.netWorth')} content={t('overview.netWorthTooltip')} />
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
              {netWorth > 0 ? t('overview.positiveNetWorth') : t('overview.negativeNetWorth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.totalAssets')}</CardTitle>
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
              {t('overview.acrossAccounts', {
                count: accounts?.filter((a) => a.balance > 0).length || 0,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.totalLiabilities')}</CardTitle>
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
              {t('overview.acrossAccounts', {
                count: accounts?.filter((a) => a.balance < 0).length || 0,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('overview.budgetUsage')}</CardTitle>
              <HelpTooltip
                title={t('overview.budgetUsage')}
                content={t('overview.budgetUsageTooltip')}
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
                t('overview.noBudget')
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentBudgetSummary
                ? t('overview.remaining', {
                    amount: formatCurrency(
                      currentBudgetSummary.summary.totalRemaining,
                      currentSpace.currency
                    ),
                  })
                : t('overview.createBudgetToTrack')}
            </p>
          </CardContent>
        </Card>

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
            <CardTitle>{t('overview.accountsTitle')}</CardTitle>
            <CardDescription>{t('overview.accountsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : accounts?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('overview.noAccountsConnected')}
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
                          {account.type} &bull; {account.provider}
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
            <CardTitle>{t('overview.recentTransactions')}</CardTitle>
            <CardDescription>{t('overview.latestActivity')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentTransactions?.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('overview.noTransactions')}
              </p>
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
              <CardTitle>{t('overview.cashflowForecast')}</CardTitle>
              <HelpTooltip
                title={t('overview.cashflowForecast')}
                content={t('overview.cashflowTooltip')}
              />
            </div>
            <CardDescription>{t('overview.projectedDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">{t('overview.projectedIncome')}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(cashflowForecast.summary.totalIncome, currentSpace.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('overview.projectedExpenses')}</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(cashflowForecast.summary.totalExpenses, currentSpace.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('overview.netCashflow')}</p>
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
                  <span>{t('overview.currentBalance')}</span>
                  <span>
                    {formatCurrency(cashflowForecast.summary.currentBalance, currentSpace.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('overview.projectedBalance')}</span>
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
          title={t('overview.cashflowForecast')}
          description={t('overview.projectedDescription')}
          isDemoMode={isGuestDemo}
        />
      )}

      {/* Portfolio Allocation */}
      {portfolioAllocation && portfolioAllocation.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.portfolioAllocation')}</CardTitle>
            <CardDescription>{t('overview.portfolioDescription')}</CardDescription>
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
                <h3 className="text-2xl font-bold tracking-tight">
                  {t('overview.financialGoals')}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {t('overview.goalsDescription')}
                  <HelpTooltip content={t('overview.goalsTooltip')} />
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push('/goals')}>
                {t('overview.viewAllGoals')}
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

            {activeGoals.length > 0 && <GoalProbabilityTimeline goals={activeGoals} />}
          </div>
        </PremiumGate>
      ) : null}

      {/* Persona-Aware Feature Widget */}
      {(user?.email === 'diego@dhanam.demo' || isGuestDemo) && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/gaming')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  {t('overview.gamingAssets')}
                </CardTitle>
                <CardDescription>{t('overview.gamingDescription')}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/gaming');
                }}
              >
                {t('overview.viewDashboard')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('overview.sandStaked')}</p>
                <p className="text-lg font-semibold">15,000</p>
                <p className="text-xs text-green-600">8.5% APY</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('overview.landParcels')}</p>
                <p className="text-lg font-semibold">3</p>
                <p className="text-xs text-muted-foreground">
                  {t('overview.rented', { count: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('overview.nfts')}</p>
                <p className="text-lg font-semibold">2</p>
                <p className="text-xs text-muted-foreground">
                  {t('overview.nftValue', { value: '$21.7K' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('overview.monthlyIncomeLabel')}</p>
                <p className="text-lg font-semibold text-green-600">$597</p>
                <p className="text-xs text-muted-foreground">{t('overview.allSources')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.email === 'maria@dhanam.demo' && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/budgets/zero-based')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              ESG & Savings Highlights
            </CardTitle>
            <CardDescription>Your sustainable finance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ESG Portfolio Score</p>
                <p className="text-lg font-semibold text-green-600">72/100</p>
                <p className="text-xs text-muted-foreground">Above average</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Savings Rate</p>
                <p className="text-lg font-semibold">29%</p>
                <p className="text-xs text-green-600">On track</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget Allocated</p>
                <p className="text-lg font-semibold">100%</p>
                <p className="text-xs text-muted-foreground">Zero-based</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscriptions Detected</p>
                <p className="text-lg font-semibold text-amber-600">6</p>
                <p className="text-xs text-muted-foreground">1 needs review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.email === 'carlos@dhanam.demo' && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/households')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business & Household
            </CardTitle>
            <CardDescription>Tacos El Patrón + Mendoza Family</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-lg font-semibold text-green-600">MXN 250K</p>
                <p className="text-xs text-green-600">+12% vs last month</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shared Expenses</p>
                <p className="text-lg font-semibold">15</p>
                <p className="text-xs text-muted-foreground">Yours/Mine/Ours</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Business Margin</p>
                <p className="text-lg font-semibold">22%</p>
                <p className="text-xs text-muted-foreground">Net operating</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payroll Next</p>
                <p className="text-lg font-semibold">MXN 120K</p>
                <p className="text-xs text-muted-foreground">In 8 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.email === 'patricia@dhanam.demo' && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/estate-planning/life-beat')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Estate Planning Summary
            </CardTitle>
            <CardDescription>Ruiz Family estate — Life Beat active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estate Value</p>
                <p className="text-lg font-semibold">$7.5M+</p>
                <p className="text-xs text-muted-foreground">Across all assets</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Beneficiaries</p>
                <p className="text-lg font-semibold">3</p>
                <p className="text-xs text-muted-foreground">Spouse + 2 children</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Life Beat</p>
                <p className="text-lg font-semibold text-green-600">Active</p>
                <p className="text-xs text-muted-foreground">Last check-in: 5d ago</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Will Status</p>
                <p className="text-lg font-semibold text-green-600">Current</p>
                <p className="text-xs text-muted-foreground">Reviewed 30d ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Overview */}
      {currentBudgetSummary && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('overview.currentBudget', { name: budgets?.[0]?.name || 'N/A' })}
            </CardTitle>
            <CardDescription>{t('overview.trackSpending')}</CardDescription>
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

function MeetThePersonas() {
  const personas = [
    {
      key: 'maria',
      emoji: '🧑‍💼',
      name: 'Maria Gonzalez',
      archetype: 'Young Professional',
      stat: '29% savings rate, ESG-conscious',
    },
    {
      key: 'carlos',
      emoji: '🏪',
      name: 'Carlos Mendoza',
      archetype: 'Business Owner',
      stat: 'MXN 250K/mo revenue, household splits',
    },
    {
      key: 'patricia',
      emoji: '💎',
      name: 'Patricia Ruiz',
      archetype: 'Enterprise CFO',
      stat: '$7.5M+ estate, Life Beat active',
    },
    {
      key: 'diego',
      emoji: '🎮',
      name: 'Diego Navarro',
      archetype: 'DeFi & Gaming',
      stat: '$28.5K DeFi, NFT portfolio',
    },
  ];

  const switchPersona = async (key: string) => {
    try {
      const res = await fetch('/api/auth/switch-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ persona: key }),
      });
      if (res.ok) window.location.reload();
    } catch {}
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Meet the Personas</CardTitle>
        <CardDescription>
          Each persona showcases different Dhanam features. Click to explore.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {personas.map((p) => (
            <button
              key={p.key}
              onClick={() => switchPersona(p.key)}
              className="text-left p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-colors"
            >
              <span className="text-2xl">{p.emoji}</span>
              <p className="font-medium text-sm mt-1">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.archetype}</p>
              <p className="text-xs text-primary mt-1">{p.stat}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  const router = useRouter();
  const { t } = useTranslation('dashboard');

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('emptyState.getStarted')}</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {t('emptyState.createSpaceDescription')}
        </p>
        <Button onClick={() => router.push('/spaces/new')}>
          {t('emptyState.createFirstSpace')}
        </Button>
      </CardContent>
    </Card>
  );
}
