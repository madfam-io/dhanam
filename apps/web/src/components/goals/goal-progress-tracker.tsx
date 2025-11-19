'use client';

import { useState, useEffect } from 'react';
import { Button } from '@dhanam/ui';
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { GoalProgress, ordersApi } from '../../lib/api/orders';

interface GoalProgressTrackerProps {
  spaceId: string;
  goalId: string;
}

export function GoalProgressTracker({ spaceId, goalId }: GoalProgressTrackerProps) {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, [spaceId, goalId]);

  const loadProgress = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await ordersApi.getGoalProgress(spaceId, goalId);
      setProgress(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load goal progress');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <p className="text-sm text-destructive">{error || 'Failed to load progress'}</p>
      </div>
    );
  }

  const progressPercentage = Math.min(100, progress.progress);
  const shortfall = Math.max(0, progress.targetValue - progress.currentValue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{progress.goalName}</h3>
          <div className="flex items-center gap-2 mt-2">
            {progress.onTrack ? (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">On Track</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Needs Attention</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadProgress} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{formatPercentage(progress.progress)}</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progress.onTrack
                ? 'bg-green-500 dark:bg-green-600'
                : 'bg-amber-500 dark:bg-amber-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(progress.currentValue)}</span>
          <span>{formatCurrency(progress.targetValue)}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <p className="text-sm">Target</p>
          </div>
          <p className="text-lg font-bold">{formatCurrency(progress.targetValue)}</p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <p className="text-sm">Current</p>
          </div>
          <p className="text-lg font-bold">{formatCurrency(progress.currentValue)}</p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <p className="text-sm">Days Left</p>
          </div>
          <p className="text-lg font-bold">{progress.daysRemaining}</p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <p className="text-sm">Monthly Need</p>
          </div>
          <p className="text-lg font-bold">
            {formatCurrency(progress.requiredMonthlyContribution)}
          </p>
        </div>
      </div>

      {/* Shortfall Warning */}
      {shortfall > 0 && !progress.onTrack && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              You need {formatCurrency(shortfall)} more to reach your goal
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Consider increasing your monthly contributions to{' '}
              {formatCurrency(progress.requiredMonthlyContribution)}
            </p>
          </div>
        </div>
      )}

      {/* Allocation Breakdown */}
      {progress.allocations && progress.allocations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold">Account Allocations</h4>

          <div className="space-y-2">
            {progress.allocations.map((allocation) => {
              const allocationProgress =
                (allocation.currentValue / allocation.targetValue) * 100;
              const drift = Math.abs(allocation.currentValue - allocation.targetValue);
              const driftPercentage = (drift / allocation.targetValue) * 100;
              const isOverAllocated = allocation.currentValue > allocation.targetValue;

              return (
                <div key={allocation.accountId} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{allocation.accountName}</p>
                      <p className="text-sm text-muted-foreground">
                        Target: {formatPercentage(allocation.targetPercentage)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(allocation.currentValue)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        of {formatCurrency(allocation.targetValue)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          Math.abs(allocationProgress - 100) < 5
                            ? 'bg-green-500'
                            : isOverAllocated
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, allocationProgress)}%` }}
                      />
                    </div>

                    {driftPercentage > 5 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        {isOverAllocated ? (
                          <TrendingUp className="h-3 w-3 text-red-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-amber-600" />
                        )}
                        <span
                          className={
                            isOverAllocated
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {isOverAllocated ? 'Over' : 'Under'} by {formatCurrency(drift)} (
                          {formatPercentage(driftPercentage)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Success State */}
      {progress.progress >= 100 && (
        <div className="flex flex-col items-center justify-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mb-4" />
          <h4 className="text-xl font-bold mb-2">Goal Achieved! 🎉</h4>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Congratulations! You've reached your target of {formatCurrency(progress.targetValue)}.
          </p>
        </div>
      )}
    </div>
  );
}
