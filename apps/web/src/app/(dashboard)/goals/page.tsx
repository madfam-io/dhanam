'use client';

import { useState, useEffect } from 'react';
import { useGoals, type Goal, type GoalProgress, type GoalSummary } from '@/hooks/useGoals';
import { useSimulations } from '@/hooks/useSimulations';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calculator,
  Loader2,
} from 'lucide-react';

export default function GoalsPage() {
  const {
    getGoalsBySpace,
    getGoalSummary,
    getGoalProgress,
    loading: _loading,
    error: _error,
  } = useGoals();
  const { calculateGoalProbability } = useSimulations();
  const analytics = useAnalytics();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [probability, setProbability] = useState<any | null>(null);
  const [loadingProbability, setLoadingProbability] = useState(false);

  // TODO: Get actual spaceId from user context
  const spaceId = 'default-space-id';

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const [goalsData, summaryData] = await Promise.all([
      getGoalsBySpace(spaceId),
      getGoalSummary(spaceId),
    ]);

    if (goalsData) setGoals(goalsData);
    if (summaryData) setSummary(summaryData);
  };

  const handleGoalClick = async (goal: Goal) => {
    setSelectedGoal(goal);
    setProbability(null);

    const progress = await getGoalProgress(goal.id);
    setGoalProgress(progress);

    // Track goal progress view
    if (progress) {
      analytics.trackGoalProgressViewed(goal.id, progress.percentComplete, progress.onTrack);
    }
  };

  const calculateProbability = async () => {
    if (!selectedGoal || !goalProgress) return;

    setLoadingProbability(true);
    const targetDate = new Date(selectedGoal.targetDate);
    const now = new Date();
    const monthsRemaining = Math.max(
      1,
      (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth())
    );

    const result = await calculateGoalProbability({
      goalId: selectedGoal.id,
      currentValue: goalProgress.currentValue,
      targetAmount: parseFloat(selectedGoal.targetAmount.toString()),
      monthsRemaining,
      monthlyContribution: goalProgress.monthlyContributionNeeded || 0,
      expectedReturn: 0.07, // TODO: Get from user preferences
      volatility: 0.15,
    });

    if (result) {
      setProbability(result);

      // Track goal probability calculation
      analytics.trackGoalProbabilityCalculated(
        selectedGoal.id,
        result.probabilityOfSuccess,
        result.medianOutcome,
        parseFloat(selectedGoal.targetAmount.toString())
      );
    }

    setLoadingProbability(false);
  };

  const getGoalTypeLabel = (type: Goal['type']): string => {
    const labels: Record<Goal['type'], string> = {
      retirement: 'Retirement',
      education: 'Education',
      house_purchase: 'House Purchase',
      emergency_fund: 'Emergency Fund',
      legacy: 'Legacy',
      travel: 'Travel',
      business: 'Business',
      debt_payoff: 'Debt Payoff',
      other: 'Other',
    };
    return labels[type];
  };

  const getStatusColor = (status: Goal['status']) => {
    const colors = {
      active: 'bg-blue-600',
      paused: 'bg-yellow-600',
      achieved: 'bg-green-600',
      abandoned: 'bg-gray-600',
    };
    return colors[status];
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Financial Goals</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress and calculate probability of success
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalGoals}</div>
              <p className="text-xs text-muted-foreground">{summary.activeGoals} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalTargetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground">Across all goals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground">Total saved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overallProgress.toFixed(1)}%</div>
              <Progress value={summary.overallProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goals List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Goals</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No goals yet</p>
                  <p className="text-sm">Create your first financial goal to get started</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => handleGoalClick(goal)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleGoalClick(goal);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${
                      selectedGoal?.id === goal.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getGoalTypeLabel(goal.type)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Target:</span>
                        <span className="font-semibold">
                          $
                          {parseFloat(goal.targetAmount.toString()).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Due:</span>
                        <span>{new Date(goal.targetDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goal Details & Probability */}
        <div className="lg:col-span-2">
          {selectedGoal && goalProgress ? (
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="probability">Probability</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedGoal.name}</CardTitle>
                    <CardDescription>{selectedGoal.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Goal Progress</span>
                        <span className="text-sm font-bold">
                          {goalProgress.percentComplete.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={goalProgress.percentComplete} className="h-3" />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>${goalProgress.currentValue.toLocaleString()}</span>
                        <span>
                          ${parseFloat(selectedGoal.targetAmount.toString()).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* On Track Status */}
                    <Alert variant={goalProgress.onTrack ? 'default' : 'destructive'}>
                      {goalProgress.onTrack ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {goalProgress.onTrack ? (
                          <p>You&apos;re on track to reach this goal!</p>
                        ) : (
                          <div>
                            <p className="font-semibold mb-1">You&apos;re behind schedule</p>
                            <p className="text-sm">
                              Increase monthly contribution to $
                              {goalProgress.monthlyContributionNeeded.toLocaleString()} to stay on
                              track
                            </p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>

                    {/* Time Progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Time Progress</span>
                        <span className="text-sm font-bold">
                          {goalProgress.timeProgress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={goalProgress.timeProgress} className="h-2" />
                    </div>

                    {/* Allocations */}
                    {goalProgress.allocations && goalProgress.allocations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Account Allocations</h4>
                        <div className="space-y-2">
                          {goalProgress.allocations.map((alloc) => (
                            <div
                              key={alloc.accountId}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div>
                                <p className="font-medium">{alloc.accountName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {alloc.percentage}% allocated
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  $
                                  {alloc.contributedValue.toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="probability" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Success Probability Analysis
                    </CardTitle>
                    <CardDescription>
                      Monte Carlo simulation to calculate likelihood of achieving this goal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!probability ? (
                      <div className="text-center py-8">
                        <Button
                          onClick={calculateProbability}
                          disabled={loadingProbability}
                          size="lg"
                        >
                          {loadingProbability ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Running simulation...
                            </>
                          ) : (
                            <>
                              <Calculator className="mr-2 h-4 w-4" />
                              Calculate Probability
                            </>
                          )}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">Requires Premium tier</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Success Rate */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Probability of Success
                          </p>
                          <p className="text-4xl font-bold">
                            {(probability.probabilityOfSuccess * 100).toFixed(1)}%
                          </p>
                          <Progress
                            value={probability.probabilityOfSuccess * 100}
                            className="mt-2 h-3"
                          />
                        </div>

                        {/* Median Outcome */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Expected Outcome (Median)
                            </p>
                            <p className="text-2xl font-semibold">
                              $
                              {probability.medianOutcome.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Expected Shortfall</p>
                            <p className="text-2xl font-semibold">
                              $
                              {probability.expectedShortfall.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                        </div>

                        {/* 90% Confidence Range */}
                        <div>
                          <p className="text-sm font-semibold mb-2">90% Confidence Range</p>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-muted-foreground">Worst 10%</p>
                              <p className="text-lg font-semibold">
                                $
                                {probability.confidence90Range.low.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </p>
                            </div>
                            <TrendingUp className="h-6 w-6 text-muted-foreground" />
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Best 10%</p>
                              <p className="text-lg font-semibold">
                                $
                                {probability.confidence90Range.high.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation */}
                        {probability.recommendedMonthlyContribution >
                          probability.currentMonthlyContribution && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <p className="font-semibold mb-1">Increase savings to improve odds</p>
                              <p className="text-sm">
                                Recommended monthly contribution: $
                                {probability.recommendedMonthlyContribution.toLocaleString()}
                                (current: ${probability.currentMonthlyContribution.toLocaleString()}
                                )
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-[600px] border border-dashed rounded-lg">
              <div className="text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No goal selected</p>
                <p className="text-sm text-muted-foreground">
                  Select a goal from the list to view progress and probability
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
