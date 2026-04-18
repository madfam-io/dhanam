'use client';

/**
 * Waybill Usage Alerts page (P2.2).
 *
 * Lists recent budget-threshold crossings ingested from Enclii's Waybill
 * evaluator. Read-only — budgets themselves live in Enclii (enclii.dev/projects/…/billing).
 */

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { apiClient } from '@/lib/api/client';

interface UsageAlertIngest {
  id: string;
  projectId: string;
  budgetId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  thresholdCrossed: number;
  actualCents: number;
  budgetCents: number;
  currency: string;
  notifiedAt: string | null;
  seenCount: number;
  createdAt: string;
}

function formatCents(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export default function WaybillUsageAlertsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['waybill-usage-alerts'],
    queryFn: async () => {
      const res = await apiClient.get<{ alerts: UsageAlertIngest[] }>(
        '/billing/usage-alerts'
      );
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load usage alerts.</p>
      </div>
    );
  }

  const alerts = data?.alerts ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Infrastructure spend alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Budget thresholds crossed in your Enclii projects. Manage budgets in{' '}
            <a
              href="https://enclii.dev/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Enclii
            </a>
            .
          </p>
        </div>
        <Link href="/billing" className="text-sm underline">
          ← Back to billing
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No alerts recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  When
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  Threshold
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  Actual
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  Budget
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                  Notified
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-sm whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold">
                    {a.thresholdCrossed}%
                  </td>
                  <td className="px-4 py-2 text-sm font-mono">
                    {formatCents(a.actualCents, a.currency)}
                  </td>
                  <td className="px-4 py-2 text-sm font-mono">
                    {formatCents(a.budgetCents, a.currency)}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {a.notifiedAt ? (
                      <span className="text-green-600">✓ Delivered</span>
                    ) : (
                      <span className="text-amber-600">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
