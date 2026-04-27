'use client';

import { Skeleton, Button, Card } from '@dhanam/ui';
import { RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { QueueCard } from '@/components/queue-card';
import { adminApi, type QueueInfo } from '@/lib/api/admin';

export default function QueuesPage() {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getQueueStats();
      setQueues(result.queues);
    } catch (err) {
      console.error('Failed to load queue stats:', err);
      setError('Failed to load queue stats. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueues();
  }, [loadQueues]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Queue Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">BullMQ queue stats and actions</p>
        </div>
        <Button variant="outline" onClick={loadQueues} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}{' '}
          <button onClick={loadQueues} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
              <Skeleton className="h-8" />
            </Card>
          ))}
        </div>
      ) : queues.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No queue data available</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queues.map((queue) => (
            <QueueCard key={queue.name} queue={queue} onRefresh={loadQueues} />
          ))}
        </div>
      )}
    </div>
  );
}
