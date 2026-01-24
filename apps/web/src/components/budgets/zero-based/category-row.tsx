'use client';

import { useState } from 'react';
import { Button, Progress } from '@dhanam/ui';
import { Currency } from '@dhanam/shared';
import { Plus, ArrowLeftRight, Target, AlertCircle } from 'lucide-react';

import { formatCurrency, cn } from '@/lib/utils';
import { CategoryAllocationStatus } from '@/lib/api/zero-based';

interface CategoryRowProps {
  category: CategoryAllocationStatus;
  currency: Currency;
  onAllocate: (categoryId: string) => void;
  onMoveFunds: (categoryId: string) => void;
  onEditGoal: (categoryId: string) => void;
}

// Generate a consistent color based on category name
function getCategoryColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-cyan-500',
    'bg-rose-500',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] || 'bg-gray-500';
}

function getGoalTypeLabel(goalType: string | undefined): string {
  switch (goalType) {
    case 'monthly_spending':
      return 'Monthly';
    case 'target_balance':
      return 'Target';
    case 'weekly_spending':
      return 'Weekly';
    case 'percentage_income':
      return '% of Income';
    default:
      return '';
  }
}

export function CategoryRow({
  category,
  currency,
  onAllocate,
  onMoveFunds,
  onEditGoal,
}: CategoryRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colorClass = getCategoryColor(category.categoryName);

  const availableClass = cn(
    'text-right font-semibold',
    category.isOverspent
      ? 'text-red-600'
      : category.available > 0
        ? 'text-emerald-600'
        : 'text-muted-foreground'
  );

  return (
    <div
      className="group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Category Name with Color Dot */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={cn('h-3 w-3 flex-shrink-0 rounded-full', colorClass)} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{category.categoryName}</p>
            {category.goalType && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>{getGoalTypeLabel(category.goalType)}</span>
                {category.goalTarget && (
                  <span>• {formatCurrency(category.goalTarget, currency)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div className="w-24 text-right">
            <p className="text-xs text-muted-foreground">Allocated</p>
            <p className="font-medium">{formatCurrency(category.allocated, currency)}</p>
          </div>
          <div className="w-24 text-right">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="font-medium">{formatCurrency(category.spent, currency)}</p>
          </div>
          <div className="w-24">
            <p className="text-xs text-muted-foreground">Available</p>
            <div className="flex items-center justify-end gap-1">
              {category.isOverspent && <AlertCircle className="h-4 w-4 text-red-500" />}
              <p className={availableClass}>{formatCurrency(category.available, currency)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAllocate(category.categoryId)}
            title="Allocate funds"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveFunds(category.categoryId)}
            title="Move funds"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditGoal(category.categoryId)}
            title="Edit goal"
          >
            <Target className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Goal Progress Bar (if goal exists) */}
      {category.goalProgress !== undefined && category.goalTarget && (
        <div className="ml-6 flex items-center gap-3">
          <Progress
            value={category.goalProgress}
            className={cn(
              'h-2 flex-1',
              category.goalProgress >= 100 ? 'bg-emerald-100' : 'bg-gray-100'
            )}
          />
          <span className="text-xs text-muted-foreground">
            {Math.round(category.goalProgress)}% funded
          </span>
        </div>
      )}

      {/* Carryover Indicator */}
      {category.carryoverAmount > 0 && (
        <p className="ml-6 text-xs text-blue-600">
          +{formatCurrency(category.carryoverAmount, currency)} from last month
        </p>
      )}
    </div>
  );
}

// Compact version for mobile
export function CategoryRowCompact({
  category,
  currency,
  onAllocate,
}: {
  category: CategoryAllocationStatus;
  currency: Currency;
  onAllocate: (categoryId: string) => void;
}) {
  const colorClass = getCategoryColor(category.categoryName);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <div className={cn('h-2 w-2 rounded-full', colorClass)} />
        <span className="font-medium">{category.categoryName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-semibold',
            category.isOverspent
              ? 'text-red-600'
              : category.available > 0
                ? 'text-emerald-600'
                : 'text-muted-foreground'
          )}
        >
          {formatCurrency(category.available, currency)}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onAllocate(category.categoryId)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
