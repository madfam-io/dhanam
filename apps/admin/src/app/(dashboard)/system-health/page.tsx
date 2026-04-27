'use client';

import { Card, Skeleton, Button } from '@dhanam/ui';
import { RefreshCw, Users, Activity } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { CacheControls } from '@/components/cache-controls';
import { HealthStatusCard } from '@/components/health-status-card';
import { StatsCard } from '@/components/stats-card';
import { adminApi, type SystemHealth, type Metrics } from '@/lib/api/admin';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, m] = await Promise.all([adminApi.getSystemHealth(), adminApi.getMetrics()]);
      setHealth(h);
      setMetrics(m);
    } catch (err) {
      console.error('Failed to load system health:', err);
      setError('Failed to load system health. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !health) {
    return <SystemHealthSkeleton />;
  }

  const services = health
    ? [
        {
          name: 'Database',
          status: health.database.status,
          detail: `${health.database.connections} connections`,
        },
        {
          name: 'Redis',
          status: health.redis.status,
          detail: health.redis.connected ? 'Connected' : 'Disconnected',
        },
        { name: 'Job Queues', status: health.queues.status },
        { name: 'Providers', status: health.providers.status },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor system status and performance
          </p>
        </div>
        <Button variant="outline" onClick={loadData} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}{' '}
          <button onClick={loadData} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {health && metrics && (
        <>
          <HealthStatusCard services={services} uptime={health.uptime} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="DAU" value={metrics.dau} icon={Users} color="blue" />
            <StatsCard title="WAU" value={metrics.wau} icon={Users} color="green" />
            <StatsCard title="MAU" value={metrics.mau} icon={Users} color="purple" />
            <StatsCard
              title="Memory Usage"
              value={`${metrics.resourceUsage.memoryMB} MB`}
              icon={Activity}
              color="orange"
            />
          </div>

          <CacheControls />
        </>
      )}
    </div>
  );
}

function SystemHealthSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-12 mt-2" />
          </Card>
        ))}
      </div>
    </div>
  );
}
