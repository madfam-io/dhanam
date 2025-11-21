'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam/ui';
import { TrendingUp, Info } from 'lucide-react';

interface AnalyticsEmptyStateProps {
  title: string;
  description: string;
  isDemoMode?: boolean;
}

export function AnalyticsEmptyState({ title, description, isDemoMode }: AnalyticsEmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>

          {isDemoMode ? (
            <>
              <p className="text-sm font-medium mb-2">Demo Data Loading</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                This feature shows rich analytics based on your financial history.
                <strong className="block mt-1">Sign up to see personalized forecasts!</strong>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium mb-2">Not Enough Data Yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Connect your accounts and add transactions to see analytics and forecasts.
              </p>
            </>
          )}

          <div className="mt-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 max-w-md">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-left text-blue-900 dark:text-blue-100">
              {isDemoMode
                ? "This demo uses sample data. After signing up, you'll see real insights from your connected accounts."
                : 'We need at least 30 days of transaction history to generate accurate forecasts.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
