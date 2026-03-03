'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@dhanam/ui';
import { Skeleton } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { adminApi, type ProviderHealth } from '~/lib/api/admin';
import { ProviderStatusTable } from '~/components/admin/provider-status-table';
import { RefreshCw } from 'lucide-react';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getProviderHealth();
      setProviders(result.providers);
    } catch (error) {
      console.error('Failed to load provider health:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  if (loading) {
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Provider Health</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor financial data provider connections and rate limits
          </p>
        </div>
        <Button variant="outline" onClick={loadProviders} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      <ProviderStatusTable providers={providers} />
    </div>
  );
}
