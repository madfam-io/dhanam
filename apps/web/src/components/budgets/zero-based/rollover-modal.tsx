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
} from '@dhanam/ui';
import { Currency } from '@dhanam/shared';
import { RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { CategoryAllocationStatus, RolloverMonthDto } from '@/lib/api/zero-based';

interface RolloverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonth: string; // YYYY-MM format
  categories: CategoryAllocationStatus[];
  currency: Currency;
  onRollover: (dto: RolloverMonthDto) => Promise<void>;
  isLoading?: boolean;
}

function formatMonthDisplay(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year!, monthNum! - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year!, monthNum! - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function RolloverModal({
  open,
  onOpenChange,
  currentMonth,
  categories,
  currency,
  onRollover,
  isLoading = false,
}: RolloverModalProps) {
  const [error, setError] = useState<string | null>(null);

  // Reset error when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  // Categories with positive available balance (can be rolled over)
  const rolloverCategories = categories.filter((cat) => cat.available > 0);
  const totalRollover = rolloverCategories.reduce((sum, cat) => sum + cat.available, 0);

  const previousMonth = getPreviousMonth(currentMonth);

  const handleRollover = async () => {
    setError(null);

    if (rolloverCategories.length === 0) {
      setError('No categories with positive balance to roll over');
      return;
    }

    try {
      await onRollover({
        fromMonth: previousMonth,
        toMonth: currentMonth,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rollover funds');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <RotateCcw className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Rollover Funds</DialogTitle>
              <DialogDescription>Carry unspent funds to the next month</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rollover Summary */}
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">From</p>
              <p className="font-semibold">{formatMonthDisplay(previousMonth)}</p>
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">To</p>
              <p className="font-semibold">{formatMonthDisplay(currentMonth)}</p>
            </div>
          </div>

          {/* Total Rollover Amount */}
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Total to Rollover</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(totalRollover, currency)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              From {rolloverCategories.length}{' '}
              {rolloverCategories.length === 1 ? 'category' : 'categories'}
            </p>
          </div>

          {/* Categories to Rollover */}
          {rolloverCategories.length > 0 ? (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              <p className="text-sm font-medium">Categories with unspent funds:</p>
              {rolloverCategories.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <span>{cat.categoryName}</span>
                  <span className="font-medium text-emerald-600">
                    +{formatCurrency(cat.available, currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
              <p>No funds to rollover.</p>
              <p className="text-sm">All category budgets have been spent.</p>
            </div>
          )}

          {/* Warning about overspent categories */}
          {categories.some((cat) => cat.isOverspent) && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <strong>Note:</strong> Overspent categories will carry their negative balance forward.
              Consider covering the deficit before rolling over.
            </div>
          )}

          {/* Error Message */}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRollover} disabled={rolloverCategories.length === 0 || isLoading}>
            {isLoading ? 'Rolling over...' : `Rollover ${formatCurrency(totalRollover, currency)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
