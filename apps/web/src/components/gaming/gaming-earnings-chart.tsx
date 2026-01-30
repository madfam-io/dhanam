'use client';

import { BarChart3 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface EarningsSource {
  label: string;
  amount: number;
  color: string;
}

interface GamingEarningsChartProps {
  earnings: EarningsSource[];
  totalMonthly: number;
}

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function GamingEarningsChart({ earnings, totalMonthly }: GamingEarningsChartProps) {
  const maxAmount = Math.max(...earnings.map((e) => e.amount));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Gaming Earnings
          </CardTitle>
          <p className="text-sm font-semibold text-green-600">{formatUsd(totalMonthly)}/mo</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {earnings.map((source, idx) => {
            const percentage = maxAmount > 0 ? (source.amount / maxAmount) * 100 : 0;
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm">{source.label}</span>
                  </div>
                  <span className="text-sm font-medium">{formatUsd(source.amount)}</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
