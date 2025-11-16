'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@dhanam/ui';
import { Badge } from '@dhanam/ui';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { budgetsApi } from '@/lib/api/budgets';
import { formatCurrency } from '@/lib/utils';
import { Currency } from '@dhanam/shared';

interface BudgetAnalyticsProps {
  spaceId: string;
  budgetId: string;
  currency: Currency;
}

interface CategoryData {
  name: string;
  spent: number;
  budgeted: number;
  color: string;
}

export function BudgetAnalytics({ spaceId, budgetId, currency }: BudgetAnalyticsProps) {
  const { data: analytics } = useQuery({
    queryKey: ['budget-analytics', spaceId, budgetId],
    queryFn: () => budgetsApi.getBudgetAnalytics(spaceId, budgetId),
    enabled: !!spaceId && !!budgetId,
  });

  if (!analytics) {
    return null;
  }

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const categorySpendingData: CategoryData[] = analytics.categories.map(
    (cat: any, index: number) => ({
      name: cat.name,
      spent: cat.spent,
      budgeted: cat.budgeted,
      color: cat.color || COLORS[index % COLORS.length],
    })
  );

  const weeklyTrendData =
    analytics.weeklyTrend?.map((week: any) => ({
      week: new Date(week.weekStart).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      spent: week.spent,
      budget: week.budgetedForWeek,
    })) || [];

  const categoryPieData = categorySpendingData.map((cat) => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color,
  }));

  const overBudgetCategories = categorySpendingData.filter((cat) => cat.spent > cat.budgeted);
  const underBudgetCategories = categorySpendingData.filter(
    (cat) => cat.spent < cat.budgeted * 0.5
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            {analytics.summary.totalPercentUsed > 90 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : analytics.summary.totalPercentUsed > 75 ? (
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.totalPercentUsed.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">of total budget used</p>
            <div className="mt-2">
              <Badge
                variant={analytics.summary.totalPercentUsed > 90 ? 'destructive' : 'secondary'}
              >
                {formatCurrency(analytics.summary.totalRemaining, currency)} remaining
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories at Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overBudgetCategories.length}</div>
            <p className="text-xs text-muted-foreground">over budget</p>
            {overBudgetCategories.length > 0 && (
              <div className="mt-2 text-xs">
                {overBudgetCategories.slice(0, 2).map((cat) => (
                  <div key={cat.name} className="text-red-600">
                    • {cat.name}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.daysRemaining || 0}</div>
            <p className="text-xs text-muted-foreground">in this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categorySpendingData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }} height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: string | number | (string | number)[]) => {
                      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                      return [formatCurrency(numValue, currency), ''];
                    }}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar dataKey="budgeted" fill="#e5e7eb" name="Budgeted" />
                  <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spending Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value, currency), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryPieData.slice(0, 6).map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      {weeklyTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyTrendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value, currency), '']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Spent"
                  />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    stroke="#e5e7eb"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Budget"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {underBudgetCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-green-600">Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Categories with room to grow:</p>
              <div className="space-y-2">
                {underBudgetCategories.slice(0, 3).map((cat) => (
                  <div key={cat.name} className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="text-green-600">
                      {formatCurrency(cat.budgeted - cat.spent, currency)} available
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {overBudgetCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-600">Attention Needed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Categories over budget:</p>
              <div className="space-y-2">
                {overBudgetCategories.slice(0, 3).map((cat) => (
                  <div key={cat.name} className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="text-red-600">
                      {formatCurrency(cat.spent - cat.budgeted, currency)} over
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
