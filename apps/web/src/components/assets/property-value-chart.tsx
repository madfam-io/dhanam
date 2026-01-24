'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ValuationDataPoint {
  date: string;
  value: number;
  source?: string;
}

interface PropertyValueChartProps {
  valuations: ValuationDataPoint[];
  currentValue: number;
  currency?: string;
  zestimateLow?: number;
  zestimateHigh?: number;
}

function formatCurrency(value: number, currency = 'USD'): string {
  if (Math.abs(value) >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

export function PropertyValueChart({
  valuations,
  currentValue,
  currency = 'USD',
  zestimateLow,
  zestimateHigh,
}: PropertyValueChartProps) {
  // Sort by date and format for chart
  const data = [...valuations]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((v) => ({
      date: v.date,
      displayDate: formatDate(v.date),
      value: v.value,
      source: v.source || 'manual',
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Value History</CardTitle>
          <CardDescription>No valuation history available yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
          Add valuations to track your property value over time
        </CardContent>
      </Card>
    );
  }

  // Calculate min/max for Y axis with padding
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values, zestimateLow || Infinity);
  const maxValue = Math.max(...values, zestimateHigh || -Infinity);
  const padding = (maxValue - minValue) * 0.1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Value History</CardTitle>
        <CardDescription>
          Property valuation over time
          {zestimateLow && zestimateHigh && (
            <span className="ml-2 text-xs">
              (Zestimate range: {formatCurrency(zestimateLow, currency)} -{' '}
              {formatCurrency(zestimateHigh, currency)})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="propertyValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value, currency)}
                domain={[minValue - padding, maxValue + padding]}
                width={80}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || !payload[0]?.payload) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="font-semibold">{label}</p>
                      <div className="mt-1 space-y-1 text-sm">
                        <p className="text-blue-600">
                          Value: {formatCurrency(data.value, currency)}
                        </p>
                        <p className="text-muted-foreground capitalize">
                          Source: {data.source === 'Zillow API' ? 'Zillow Zestimate' : data.source}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              {/* Zestimate range bands */}
              {zestimateLow && (
                <ReferenceLine
                  y={zestimateLow}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Low',
                    position: 'left',
                    fontSize: 10,
                    fill: '#94a3b8',
                  }}
                />
              )}
              {zestimateHigh && (
                <ReferenceLine
                  y={zestimateHigh}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{
                    value: 'High',
                    position: 'left',
                    fontSize: 10,
                    fill: '#94a3b8',
                  }}
                />
              )}
              {/* Current value line */}
              <ReferenceLine
                y={currentValue}
                stroke="#22c55e"
                strokeWidth={2}
                label={{
                  value: 'Current',
                  position: 'right',
                  fontSize: 10,
                  fill: '#22c55e',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fill="url(#propertyValueGradient)"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
