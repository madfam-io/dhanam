'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Loader2, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSpaceStore } from '@/stores/space';
import { analyticsApi, CalendarDay } from '@/lib/api/analytics';
import { formatCurrency } from '@/lib/utils';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { currentSpace } = useSpaceStore();
  const spaceId = currentSpace?.id;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', spaceId, year, month + 1],
    queryFn: () => analyticsApi.getCalendarData(spaceId!, year, month + 1),
    enabled: !!spaceId,
  });

  // Build a lookup map from date string to CalendarDay
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    const days = Array.isArray(calendarData) ? calendarData : [];
    if (days.length > 0) {
      for (const day of days) {
        // Normalize to just the date part
        const dateKey = day.date.slice(0, 10);
        map.set(dateKey, day);
      }
    }
    return map;
  }, [calendarData]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(null);
  };

  if (!spaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No space selected</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Select a space to view the calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">View your transactions day by day.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {MONTH_NAMES[month]} {year}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {/* Day Headers */}
                  {DAY_NAMES.map((dayName) => (
                    <div
                      key={dayName}
                      className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {dayName}
                    </div>
                  ))}

                  {/* Empty cells before month starts */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-background min-h-[80px] p-2" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayData = dayMap.get(dateStr);
                    const hasTransactions = dayData && dayData.transactionCount > 0;
                    const isToday =
                      dayNum === now.getDate() &&
                      month === now.getMonth() &&
                      year === now.getFullYear();
                    const isSelected = selectedDay?.date.slice(0, 10) === dateStr;

                    return (
                      <button
                        key={dayNum}
                        onClick={() => dayData && setSelectedDay(dayData)}
                        className={`bg-background min-h-[80px] p-2 text-left transition-colors hover:bg-muted/50 ${
                          isSelected ? 'ring-2 ring-primary ring-inset' : ''
                        } ${hasTransactions ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm font-medium ${
                              isToday
                                ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                                : ''
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>
                        {hasTransactions && (
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              {dayData.transactionCount} txn
                              {dayData.transactionCount !== 1 ? 's' : ''}
                            </p>
                            <p
                              className={`text-xs font-medium ${
                                dayData.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(dayData.netAmount, currentSpace?.currency)}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Day Detail Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedDay ? formatDayTitle(selectedDay.date) : 'Day Details'}
                </CardTitle>
                {selectedDay && (
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedDay && (
                <CardDescription>
                  {selectedDay.transactionCount} transaction
                  {selectedDay.transactionCount !== 1 ? 's' : ''} | Net:{' '}
                  <span className={selectedDay.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(selectedDay.netAmount, currentSpace?.currency)}
                  </span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedDay ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click on a day to see its transactions.
                  </p>
                </div>
              ) : !selectedDay.transactions || selectedDay.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transaction details available.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDay.transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{txn.description}</p>
                        {txn.merchant && (
                          <p className="text-xs text-muted-foreground">{txn.merchant}</p>
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          txn.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(txn.amount, currentSpace?.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatDayTitle(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
