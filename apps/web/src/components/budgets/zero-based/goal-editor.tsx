'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from '@dhanam/ui';
import { Currency } from '@dhanam/shared';
import { Target, Calendar, Percent, TrendingUp } from 'lucide-react';

import { formatCurrency, cn } from '@/lib/utils';
import { SetCategoryGoalDto, CategoryAllocationStatus } from '@/lib/api/zero-based';

interface GoalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryAllocationStatus | null;
  currency: Currency;
  onSaveGoal: (categoryId: string, dto: SetCategoryGoalDto) => Promise<void>;
  isLoading?: boolean;
}

type GoalType = 'monthly_spending' | 'target_balance' | 'weekly_spending' | 'percentage_income';

const GOAL_TYPES = [
  {
    value: 'monthly_spending' as GoalType,
    label: 'Monthly Spending',
    description: 'Set a target amount to spend per month',
    icon: TrendingUp,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    value: 'target_balance' as GoalType,
    label: 'Target Balance',
    description: 'Save a specific amount by a target date',
    icon: Target,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    value: 'weekly_spending' as GoalType,
    label: 'Weekly Spending',
    description: 'Set a target amount to spend per week',
    icon: Calendar,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    value: 'percentage_income' as GoalType,
    label: 'Percentage of Income',
    description: 'Allocate a percentage of your income',
    icon: Percent,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
];

export function GoalEditor({
  open,
  onOpenChange,
  category,
  currency,
  onSaveGoal,
  isLoading = false,
}: GoalEditorProps) {
  const [goalType, setGoalType] = useState<GoalType>('monthly_spending');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [percentageTarget, setPercentageTarget] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or category changes
  useEffect(() => {
    if (open && category) {
      // Pre-fill with existing goal if any
      if (category.goalType) {
        setGoalType(category.goalType as GoalType);
      } else {
        setGoalType('monthly_spending');
      }
      if (category.goalTarget) {
        setTargetAmount(category.goalTarget.toString());
      } else {
        setTargetAmount('');
      }
      setTargetDate('');
      setPercentageTarget('');
      setNotes('');
      setError(null);
    }
  }, [open, category]);

  const numericAmount = parseFloat(targetAmount) || 0;
  const numericPercentage = parseFloat(percentageTarget) || 0;

  const canSubmit = (() => {
    if (isLoading) return false;
    switch (goalType) {
      case 'monthly_spending':
      case 'weekly_spending':
        return numericAmount > 0;
      case 'target_balance':
        return numericAmount > 0 && targetDate;
      case 'percentage_income':
        return numericPercentage > 0 && numericPercentage <= 100;
      default:
        return false;
    }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category) {
      setError('No category selected');
      return;
    }

    const dto: SetCategoryGoalDto = {
      goalType,
      notes: notes || undefined,
    };

    switch (goalType) {
      case 'monthly_spending':
      case 'weekly_spending':
        if (numericAmount <= 0) {
          setError('Amount must be greater than zero');
          return;
        }
        dto.targetAmount = numericAmount;
        break;
      case 'target_balance':
        if (numericAmount <= 0) {
          setError('Target amount must be greater than zero');
          return;
        }
        if (!targetDate) {
          setError('Please select a target date');
          return;
        }
        dto.targetAmount = numericAmount;
        dto.targetDate = targetDate;
        break;
      case 'percentage_income':
        if (numericPercentage <= 0 || numericPercentage > 100) {
          setError('Percentage must be between 1 and 100');
          return;
        }
        dto.percentageTarget = numericPercentage;
        break;
    }

    try {
      await onSaveGoal(category.categoryId, dto);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Set Funding Goal</DialogTitle>
              <DialogDescription>{category?.categoryName || 'Category'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Type Selection */}
          <div className="space-y-2">
            <Label>Goal Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = goalType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setGoalType(type.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('rounded p-1', type.bgColor)}>
                        <Icon className={cn('h-4 w-4', type.iconColor)} />
                      </div>
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal-specific Fields */}
          {(goalType === 'monthly_spending' || goalType === 'weekly_spending') && (
            <div className="space-y-2">
              <Label htmlFor="target-amount">
                Target Amount ({goalType === 'monthly_spending' ? 'per month' : 'per week'})
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="target-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTargetAmount(e.target.value)
                  }
                  className="pl-7"
                />
              </div>
              {goalType === 'monthly_spending' && numericAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  ~{formatCurrency(numericAmount / 4, currency)} per week
                </p>
              )}
              {goalType === 'weekly_spending' && numericAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  ~{formatCurrency(numericAmount * 4, currency)} per month
                </p>
              )}
            </div>
          )}

          {goalType === 'target_balance' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="target-amount">Target Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="target-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTargetAmount(e.target.value)
                    }
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-date">Target Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTargetDate(e.target.value)
                    }
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              {numericAmount > 0 && targetDate && (
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const months = Math.max(
                      1,
                      Math.ceil(
                        (new Date(targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)
                      )
                    );
                    const monthly = numericAmount / months;
                    return `Save ~${formatCurrency(monthly, currency)}/month over ${months} months`;
                  })()}
                </p>
              )}
            </>
          )}

          {goalType === 'percentage_income' && (
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage of Income</Label>
              <div className="relative">
                <Input
                  id="percentage"
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  placeholder="10"
                  value={percentageTarget}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPercentageTarget(e.target.value)
                  }
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          )}

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Describe your goal..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
            />
          </div>

          {/* Current Progress (if category has existing goal) */}
          {category?.goalProgress !== undefined && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Current Progress</p>
              <p className="text-lg font-semibold">{Math.round(category.goalProgress)}% funded</p>
            </div>
          )}

          {/* Error Message */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading ? 'Saving...' : 'Save Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
