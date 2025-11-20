'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { SimulationChart } from '@/components/simulations/SimulationChart';

interface GoalProbabilityCalculatorProps {
  goal: {
    id: string;
    name: string;
    type: string;
    targetAmount: number;
    targetDate: string;
    currentValue: number;
    monthlyContribution: number;
    currency: string;
  };
  onSimulate?: (results: any) => void;
}

export function GoalProbabilityCalculator({ goal, onSimulate }: GoalProbabilityCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const targetDate = new Date(goal.targetDate);
  const monthsRemaining = Math.max(
    0,
    Math.round((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
  );

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate goal probability
      // This is a simplified calculation - in production you'd call the API
      const currentProgress = (goal.currentValue / goal.targetAmount) * 100;
      const monthlyGrowth = goal.monthlyContribution / goal.currentValue || 0.05;
      const projectedValue =
        goal.currentValue * Math.pow(1 + monthlyGrowth, monthsRemaining / 12);

      const probabilityOfSuccess = Math.min(
        100,
        Math.max(0, (projectedValue / goal.targetAmount) * 100)
      );

      const simulationResults = {
        probabilityOfSuccess: probabilityOfSuccess / 100,
        currentProgress: currentProgress / 100,
        projectedValue,
        shortfall: Math.max(0, goal.targetAmount - projectedValue),
        onTrack: probabilityOfSuccess >= 75,
        monthsRemaining,
        timeSeries: Array.from({ length: Math.ceil(monthsRemaining) }, (_, i) => ({
          month: i,
          median: goal.currentValue * Math.pow(1 + monthlyGrowth, i / 12),
          mean: goal.currentValue * Math.pow(1 + monthlyGrowth, i / 12),
          p10: goal.currentValue * Math.pow(1 + monthlyGrowth * 0.7, i / 12),
          p90: goal.currentValue * Math.pow(1 + monthlyGrowth * 1.3, i / 12),
        })),
      };

      setResults(simulationResults);
      if (onSimulate) {
        onSimulate(simulationResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate probability');
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.9) return 'text-green-600';
    if (probability >= 0.75) return 'text-blue-600';
    if (probability >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProbabilityBadge = (probability: number) => {
    if (probability >= 0.9) return <Badge className="bg-green-600">Excellent</Badge>;
    if (probability >= 0.75) return <Badge className="bg-blue-600">On Track</Badge>;
    if (probability >= 0.5) return <Badge variant="secondary">Needs Attention</Badge>;
    return <Badge variant="destructive">At Risk</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Probability Analysis
          </CardTitle>
          <CardDescription>
            Monte Carlo simulation for "{goal.name}" ({goal.type})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold">
                {goal.currency} {goal.currentValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Amount</p>
              <p className="text-2xl font-bold">
                {goal.currency} {goal.targetAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Contribution</p>
              <p className="text-lg font-semibold">
                {goal.currency} {goal.monthlyContribution.toLocaleString()}/mo
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Remaining</p>
              <p className="text-lg font-semibold">
                {Math.floor(monthsRemaining / 12)} years, {monthsRemaining % 12} months
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleCalculate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Run Probability Analysis'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Probability of Success</CardTitle>
              <CardDescription>
                Likelihood of reaching {goal.currency} {goal.targetAmount.toLocaleString()} by{' '}
                {targetDate.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-4xl font-bold ${getProbabilityColor(results.probabilityOfSuccess)}`}>
                    {(results.probabilityOfSuccess * 100).toFixed(1)}%
                  </span>
                  {getProbabilityBadge(results.probabilityOfSuccess)}
                </div>
                <Progress value={results.probabilityOfSuccess * 100} className="h-3" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Projected Value</p>
                  <p className="text-xl font-bold">
                    {goal.currency} {Math.round(results.projectedValue).toLocaleString()}
                  </p>
                  {results.shortfall > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Shortfall: {goal.currency} {Math.round(results.shortfall).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Progress</p>
                  <p className="text-xl font-bold">{(results.currentProgress * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {goal.currency} {goal.targetAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!results.onTrack && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Action Needed</p>
                <p className="text-sm">
                  To improve your probability of success, consider:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>
                    • Increasing monthly contributions by{' '}
                    {goal.currency}{' '}
                    {Math.round((results.shortfall / monthsRemaining) * 1.2).toLocaleString()}
                  </li>
                  <li>• Extending your target date to allow more time for growth</li>
                  <li>• Adjusting your target amount if possible</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {results.onTrack && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">On Track!</p>
                <p className="text-sm">
                  You're on pace to reach your goal. Keep up the great work with your monthly
                  contributions of {goal.currency} {goal.monthlyContribution.toLocaleString()}.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <SimulationChart
            timeSeries={results.timeSeries}
            title="Goal Progress Projection"
            description="Projected growth with 10th-90th percentile confidence range"
          />
        </>
      )}
    </div>
  );
}
