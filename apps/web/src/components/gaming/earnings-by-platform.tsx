'use client';

import { BarChart3 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EarningEntry {
  platform: string;
  source: string;
  amountUsd: number;
  color: string;
}

interface EarningsByPlatformProps {
  earnings: EarningEntry[];
  totalMonthlyUsd: number;
}

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function EarningsByPlatform({ earnings, totalMonthlyUsd }: EarningsByPlatformProps) {
  // Group by platform
  const byPlatform = earnings.reduce<Record<string, { total: number; sources: EarningEntry[] }>>(
    (acc, e) => {
      if (!acc[e.platform]) acc[e.platform] = { total: 0, sources: [] };
      acc[e.platform]!.total += e.amountUsd;
      acc[e.platform]!.sources.push(e);
      return acc;
    },
    {}
  );

  const sortedPlatforms = Object.entries(byPlatform).sort(([, a], [, b]) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Earnings by Platform
          </CardTitle>
          <span className="text-sm font-semibold text-green-600">
            {formatUsd(totalMonthlyUsd)}/mo
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedPlatforms.map(([platform, data]) => {
            const pct = totalMonthlyUsd > 0 ? (data.total / totalMonthlyUsd) * 100 : 0;
            return (
              <div key={platform}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">
                    {platform.replace('-', ' ')}
                  </span>
                  <span className="text-sm">{formatUsd(data.total)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.sources.map((s, i) => (
                    <span key={i} className="text-xs text-muted-foreground">
                      {s.source}: {formatUsd(s.amountUsd)}
                      {i < data.sources.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
