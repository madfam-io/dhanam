'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@dhanam/ui';
import { Currency } from '@dhanam/shared';
import {
  Banknote,
  Plus,
  CheckCircle2,
  Clock,
  Briefcase,
  Gift,
  TrendingUp,
  Home,
  RotateCcw,
  MoreHorizontal,
} from 'lucide-react';

import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { IncomeEventSummary, IncomeEvent } from '@/lib/api/zero-based';

interface IncomeEventsListProps {
  incomeEvents: IncomeEventSummary[] | IncomeEvent[];
  currency: Currency;
  onAddIncome: () => void;
  compact?: boolean;
}

function getSourceIcon(source: string) {
  switch (source.toLowerCase()) {
    case 'salary':
    case 'paycheck':
      return Briefcase;
    case 'freelance':
    case 'contract':
      return MoreHorizontal;
    case 'investment':
    case 'dividend':
      return TrendingUp;
    case 'rental':
      return Home;
    case 'refund':
      return RotateCcw;
    case 'gift':
      return Gift;
    default:
      return Banknote;
  }
}

function formatSourceLabel(source: string): string {
  // Capitalize first letter and replace underscores
  return source
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function IncomeEventsList({
  incomeEvents,
  currency,
  onAddIncome,
  compact = false,
}: IncomeEventsListProps) {
  const totalIncome = incomeEvents.reduce((sum, event) => sum + event.amount, 0);
  const allocatedCount = incomeEvents.filter((e) => e.isAllocated).length;

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Income</CardTitle>
            <Button variant="ghost" size="sm" onClick={onAddIncome}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {incomeEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No income recorded yet</p>
          ) : (
            incomeEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  <span>{formatSourceLabel(event.source)}</span>
                </div>
                <span className="font-medium">{formatCurrency(event.amount, currency)}</span>
              </div>
            ))
          )}
          {incomeEvents.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{incomeEvents.length - 5} more
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Income Events</CardTitle>
            <CardDescription>
              {incomeEvents.length} events • {allocatedCount} allocated
            </CardDescription>
          </div>
          <Button onClick={onAddIncome} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Income
          </Button>
        </div>
        {/* Total Summary */}
        <div className="rounded-lg bg-emerald-50 p-3 mt-2">
          <p className="text-sm text-emerald-700">Total Income</p>
          <p className="text-2xl font-bold text-emerald-700">
            {formatCurrency(totalIncome, currency)}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {incomeEvents.length === 0 ? (
          <div className="py-8 text-center">
            <Banknote className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">No income recorded yet</p>
            <p className="text-sm text-muted-foreground">
              Click "Add Income" to record money you've received
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incomeEvents.map((event) => {
              const Icon = getSourceIcon(event.source);
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        event.isAllocated ? 'bg-emerald-100' : 'bg-amber-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          event.isAllocated ? 'text-emerald-600' : 'text-amber-600'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{formatSourceLabel(event.source)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.receivedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">
                      {formatCurrency(event.amount, currency)}
                    </span>
                    {event.isAllocated ? (
                      <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Allocated
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                        <Clock className="h-3 w-3" />
                        Pending
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
