import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

export interface JobData {
  type: string;
  payload: any;
  userId?: string;
  spaceId?: string;
  retryAttempts?: number;
}

export interface SyncTransactionsJobData {
  type: 'sync-transactions';
  payload: {
    provider: 'belvo' | 'plaid' | 'bitso';
    userId: string;
    connectionId: string;
    fullSync?: boolean;
  };
}

export interface CategorizeTransactionsJobData {
  type: 'categorize-transactions';
  payload: {
    spaceId: string;
    transactionIds?: string[];
  };
}

export interface ESGUpdateJobData {
  type: 'esg-update';
  payload: {
    symbols: string[];
    forceRefresh?: boolean;
  };
}

export interface ValuationSnapshotJobData {
  type: 'valuation-snapshot';
  payload: {
    spaceId: string;
    date?: string;
  };
}

export interface EmailJobData {
  type: 'send-email';
  payload: {
    to: string;
    template: string;
    data: any;
    priority?: 'high' | 'normal' | 'low';
  };
}

export type QueueJobData =
  | SyncTransactionsJobData
  | CategorizeTransactionsJobData
  | ESGUpdateJobData
  | ValuationSnapshotJobData
  | EmailJobData;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private redis: Redis;
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private queueEvents = new Map<string, QueueEvents>();

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,  // Required by BullMQ for blocking operations
      lazyConnect: true,
    });
  }

  async onModuleInit() {
    try {
      await this.redis.connect();
      await this.initializeQueues();
      this.logger.log('Queue service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize queue service:', error);
    }
  }

  async onModuleDestroy() {
    // Close all workers
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    // Close all queue events
    for (const queueEvents of this.queueEvents.values()) {
      await queueEvents.close();
    }

    // Close all queues
    for (const queue of this.queues.values()) {
      await queue.close();
    }

    await this.redis.disconnect();
    this.logger.log('Queue service shut down');
  }

  private async initializeQueues() {
    const queueNames = [
      'sync-transactions',
      'categorize-transactions',
      'esg-updates',
      'valuation-snapshots',
      'email-notifications',
      'system-maintenance',
    ];

    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: this.redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      });

      const queueEvents = new QueueEvents(queueName, {
        connection: this.redis,
      });

      this.queues.set(queueName, queue);
      this.queueEvents.set(queueName, queueEvents);

      // Setup queue event listeners
      queueEvents.on('completed', (jobId, _returnvalue) => {
        this.logger.log(`Job ${jobId} in queue ${queueName} completed`);
      });

      queueEvents.on('failed', (jobId, failedReason) => {
        this.logger.error(`Job ${jobId} in queue ${queueName} failed: ${failedReason}`);
      });

      queueEvents.on('stalled', (jobId) => {
        this.logger.warn(`Job ${jobId} in queue ${queueName} stalled`);
      });
    }
  }

  // Job scheduling methods
  async addSyncTransactionsJob(
    data: SyncTransactionsJobData['payload'],
    priority: number = 50,
    delay: number = 0
  ): Promise<Job> {
    const queue = this.queues.get('sync-transactions');
    if (!queue) throw new Error('Sync transactions queue not initialized');

    return queue.add('sync-transactions', data, {
      priority,
      delay,
      jobId: `sync-${data.provider}-${data.userId}-${Date.now()}`,
    });
  }

  async addCategorizeTransactionsJob(
    data: CategorizeTransactionsJobData['payload'],
    priority: number = 30
  ): Promise<Job> {
    const queue = this.queues.get('categorize-transactions');
    if (!queue) throw new Error('Categorize transactions queue not initialized');

    return queue.add('categorize-transactions', data, {
      priority,
      jobId: `categorize-${data.spaceId}-${Date.now()}`,
    });
  }

  async addESGUpdateJob(data: ESGUpdateJobData['payload'], priority: number = 20): Promise<Job> {
    const queue = this.queues.get('esg-updates');
    if (!queue) throw new Error('ESG updates queue not initialized');

    return queue.add('esg-update', data, {
      priority,
      jobId: `esg-${data.symbols.join('-')}-${Date.now()}`,
    });
  }

  async addValuationSnapshotJob(
    data: ValuationSnapshotJobData['payload'],
    priority: number = 10
  ): Promise<Job> {
    const queue = this.queues.get('valuation-snapshots');
    if (!queue) throw new Error('Valuation snapshots queue not initialized');

    return queue.add('valuation-snapshot', data, {
      priority,
      jobId: `snapshot-${data.spaceId}-${data.date || new Date().toISOString().split('T')[0]}`,
    });
  }

  async addEmailJob(data: EmailJobData['payload'], priority: number = 40): Promise<Job> {
    const queue = this.queues.get('email-notifications');
    if (!queue) throw new Error('Email notifications queue not initialized');

    const jobPriority = data.priority === 'high' ? 80 : data.priority === 'low' ? 10 : priority;

    return queue.add('send-email', data, {
      priority: jobPriority,
      jobId: `email-${data.to}-${Date.now()}`,
    });
  }

  // Recurring job scheduling
  async scheduleRecurringJob(
    queueName: string,
    jobName: string,
    data: any,
    cronPattern: string
  ): Promise<Job> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not initialized`);

    return queue.add(jobName, data, {
      repeat: { pattern: cronPattern },
      jobId: `recurring-${jobName}`,
    });
  }

  // Queue management
  async getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      name: queueName,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async getAllQueueStats() {
    const stats = [];
    for (const queueName of this.queues.keys()) {
      stats.push(await this.getQueueStats(queueName));
    }
    return stats;
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    await queue.pause();
    this.logger.log(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  async clearQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    await queue.obliterate({ force: true });
    this.logger.log(`Queue ${queueName} cleared`);
  }

  async retryFailedJobs(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    const failedJobs = await queue.getFailed();

    for (const job of failedJobs) {
      await job.retry();
    }

    this.logger.log(`Retried ${failedJobs.length} failed jobs in queue ${queueName}`);
  }

  registerWorker(queueName: string, processor: (job: Job) => Promise<any>): Worker {
    const worker = new Worker(queueName, processor, {
      connection: this.redis,
      concurrency: this.configService.get(
        `QUEUE_${queueName.toUpperCase().replace('-', '_')}_CONCURRENCY`,
        5
      ),
    });

    worker.on('completed', (job) => {
      this.logger.log(`Worker completed job ${job.id} in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Worker failed job ${job?.id} in queue ${queueName}: ${err.message}`);
    });

    worker.on('error', (err) => {
      this.logger.error(`Worker error in queue ${queueName}: ${err.message}`);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker registered for queue ${queueName}`);

    return worker;
  }
}
