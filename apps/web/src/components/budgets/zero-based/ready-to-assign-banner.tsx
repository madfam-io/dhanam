'use client';

import { Card, CardContent, Button } from '@dhanam/ui';
import { Currency } from '@dhanam/shared';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ReadyToAssignBannerProps {
  totalIncome: number;
  totalAllocated: number;
  unallocated: number;
  totalSpent: number;
  isFullyAllocated: boolean;
  currency: Currency;
  onAllocate: () => void;
  onAutoAllocate: () => void;
  isAutoAllocating?: boolean;
}

type AllocationStatus = 'all-assigned' | 'under-allocated' | 'over-allocated';

function getStatus(unallocated: number): AllocationStatus {
  if (Math.abs(unallocated) < 0.01) return 'all-assigned';
  if (unallocated > 0) return 'under-allocated';
  return 'over-allocated';
}

export function ReadyToAssignBanner({
  totalIncome,
  totalAllocated,
  unallocated,
  totalSpent,
  currency,
  onAllocate,
  onAutoAllocate,
  isAutoAllocating = false,
}: ReadyToAssignBannerProps) {
  const status = getStatus(unallocated);

  const statusConfig = {
    'all-assigned': {
      bgClass: 'bg-emerald-50 border-emerald-200',
      textClass: 'text-emerald-700',
      amountClass: 'text-emerald-600',
      icon: CheckCircle2,
      title: 'All Assigned!',
      subtitle: "Every dollar has a job. You're on track.",
    },
    'under-allocated': {
      bgClass: 'bg-amber-50 border-amber-200',
      textClass: 'text-amber-700',
      amountClass: 'text-amber-600',
      icon: AlertTriangle,
      title: 'Ready to Assign',
      subtitle: 'Give every dollar a job by allocating to categories.',
    },
    'over-allocated': {
      bgClass: 'bg-red-50 border-red-200',
      textClass: 'text-red-700',
      amountClass: 'text-red-600',
      icon: AlertCircle,
      title: 'Overallocated!',
      subtitle: 'You have allocated more than your income. Adjust your categories.',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={cn('border-2', config.bgClass)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Section */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                status === 'all-assigned' && 'bg-emerald-100',
                status === 'under-allocated' && 'bg-amber-100',
                status === 'over-allocated' && 'bg-red-100'
              )}
            >
              <Icon className={cn('h-6 w-6', config.textClass)} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className={cn('text-lg font-semibold', config.textClass)}>{config.title}</h3>
                <span className={cn('text-2xl font-bold', config.amountClass)}>
                  {formatCurrency(Math.abs(unallocated), currency)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {status !== 'all-assigned' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onAutoAllocate}
                disabled={isAutoAllocating}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isAutoAllocating ? 'Allocating...' : 'Auto-Allocate'}
              </Button>
              <Button onClick={onAllocate} className="gap-2">
                Allocate
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Income
            </p>
            <p className="text-lg font-semibold">{formatCurrency(totalIncome, currency)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Allocated
            </p>
            <p className="text-lg font-semibold">{formatCurrency(totalAllocated, currency)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Spent
            </p>
            <p className="text-lg font-semibold">{formatCurrency(totalSpent, currency)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Unallocated
            </p>
            <p className={cn('text-lg font-semibold', config.amountClass)}>
              {formatCurrency(unallocated, currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
