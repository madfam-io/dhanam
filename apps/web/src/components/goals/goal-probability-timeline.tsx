'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { type Goal } from '@/hooks/useGoals';

interface GoalProbabilityTimelineProps {
  goals: Goal[];
}

interface ProbabilityHistoryEntry {
  month: number;
  probability: number;
}

export function GoalProbabilityTimeline({ goals }: GoalProbabilityTimelineProps) {
  // Filter goals that have probability data
  const goalsWithProbability = goals.filter(
    (g) => g.status === 'active' && typeof g.currentProbability === 'number'
  );

  if (goalsWithProbability.length === 0) {
    return null;
  }

  // Calculate overall trend across all goals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculateTrend = (goal: any) => {
    if (!goal.probabilityHistory || !Array.isArray(goal.probabilityHistory)) {
      return { trend: 'stable', change: 0 };
    }

    const history = goal.probabilityHistory as ProbabilityHistoryEntry[];
    if (history.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    const oldest = history[0]?.probability ?? 0;
    const newest = history[history.length - 1]?.probability ?? 0;
    const change = newest - oldest;

    if (Math.abs(change) < 1) return { trend: 'stable', change: 0 };
    return { trend: change > 0 ? 'improving' : 'declining', change };
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatPercentageChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Calculate SVG path for sparkline
  const generateSparkline = (history: ProbabilityHistoryEntry[], width: number, height: number) => {
    if (!history || history.length < 2) return '';

    const points = history.map((entry, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = height - (entry.probability / 100) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Probability Trends</CardTitle>
        <CardDescription>90-day probability history for your active goals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goalsWithProbability.map((goal) => {
            const { trend, change } = calculateTrend(goal);
            const history = (goal.probabilityHistory || []) as ProbabilityHistoryEntry[];
            const currentProb =
              typeof goal.currentProbability === 'number' ? goal.currentProbability : 0;

            return (
              <div
                key={goal.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{goal.name}</h4>
                    {getTrendIcon(trend)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-lg">{currentProb.toFixed(1)}%</span>
                    {change !== 0 && (
                      <span className={`text-xs ${getTrendColor(trend)}`}>
                        {formatPercentageChange(change)} this quarter
                      </span>
                    )}
                  </div>
                </div>

                {/* Sparkline */}
                {history.length >= 2 && (
                  <div className="w-32 h-12">
                    <svg width="128" height="48" className="overflow-visible">
                      {/* Background grid */}
                      <line
                        x1="0"
                        y1="24"
                        x2="128"
                        y2="24"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gray-200"
                        strokeDasharray="2,2"
                      />

                      {/* Trend line */}
                      <path
                        d={generateSparkline(history, 128, 48)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={
                          trend === 'improving'
                            ? 'text-green-600'
                            : trend === 'declining'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }
                      />

                      {/* Data points */}
                      {history.map((entry, index) => {
                        const x = (index / (history.length - 1)) * 128;
                        const y = 48 - (entry.probability / 100) * 48;
                        return (
                          <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="2"
                            fill="currentColor"
                            className={
                              trend === 'improving'
                                ? 'text-green-600'
                                : trend === 'declining'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Improving</p>
              <p className="text-2xl font-bold text-green-600">
                {goalsWithProbability.filter((g) => calculateTrend(g).trend === 'improving').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stable</p>
              <p className="text-2xl font-bold text-gray-600">
                {goalsWithProbability.filter((g) => calculateTrend(g).trend === 'stable').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Declining</p>
              <p className="text-2xl font-bold text-red-600">
                {goalsWithProbability.filter((g) => calculateTrend(g).trend === 'declining').length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
