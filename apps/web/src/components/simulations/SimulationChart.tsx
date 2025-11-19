'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonthlySnapshot } from '@/hooks/useSimulations';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface SimulationChartProps {
  timeSeries: MonthlySnapshot[];
  title?: string;
  description?: string;
}

export function SimulationChart({ timeSeries, title, description }: SimulationChartProps) {
  const chartData = timeSeries.map(point => ({
    month: point.month,
    year: (point.month / 12).toFixed(1),
    median: Math.round(point.median),
    p10: Math.round(point.p10),
    p90: Math.round(point.p90),
    mean: Math.round(point.mean),
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">Year {data.year}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              Best 10%: {formatCurrency(data.p90)}
            </p>
            <p className="text-blue-600 font-semibold">
              Median: {formatCurrency(data.median)}
            </p>
            <p className="text-red-600">
              Worst 10%: {formatCurrency(data.p10)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Portfolio Growth Projections'}</CardTitle>
        <CardDescription>
          {description || 'Median outcome with 10th-90th percentile range'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Shaded area between p10 and p90 */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="none"
              fill="url(#colorRange)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="p10"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />

            {/* Percentile lines */}
            <Line
              type="monotone"
              dataKey="p10"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="10th Percentile"
            />
            <Line
              type="monotone"
              dataKey="median"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              name="Median"
            />
            <Line
              type="monotone"
              dataKey="p90"
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="90th Percentile"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            The shaded area represents the 80% confidence interval (10th to 90th percentile).
            The median line shows the most likely outcome.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
