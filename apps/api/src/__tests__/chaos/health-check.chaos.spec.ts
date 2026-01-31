// Mock ioredis before importing HealthService
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    status: 'ready',
  }));
});

import { HealthService } from '../../core/monitoring/health.service';

describe('Health Check Chaos Tests', () => {
  let service: HealthService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockQueueService: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    mockConfig = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          REDIS_URL: 'redis://localhost:6379',
          NODE_ENV: 'test',
        };
        return config[key] ?? defaultValue;
      }),
    };
    mockQueueService = {
      getAllQueueStats: jest.fn().mockResolvedValue([
        { name: 'sync', active: 0, waiting: 0, completed: 10, failed: 0 },
        { name: 'email', active: 0, waiting: 0, completed: 5, failed: 0 },
      ]),
    };

    service = new HealthService(mockPrisma, mockConfig, mockQueueService);

    // Mock fetch for external service checks
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('all healthy → status healthy', async () => {
    const health = await service.getHealthStatus();
    expect(health.status).toBe('healthy');
    expect(health.checks.database.status).toBe('up');
    expect(health.checks.redis.status).toBe('up');
  });

  it('database down → degrades overall', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    const health = await service.getHealthStatus();
    expect(health.checks.database.status).toBe('down');
    // 3/4 core checks up = 75% >= 70% = degraded
    expect(health.status).toBe('degraded');
  });

  it('below 70% → unhealthy', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB down'));
    mockQueueService.getAllQueueStats.mockRejectedValue(new Error('Queue down'));
    (global.fetch as jest.Mock).mockRejectedValue(new Error('External down'));

    const health = await service.getHealthStatus();
    // Redis is mocked as up, so 1/4 = 25% < 70% = unhealthy
    expect(health.status).toBe('unhealthy');
  });

  it('Promise.allSettled prevents crash from one check failing', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB crash'));
    mockQueueService.getAllQueueStats.mockRejectedValue(new Error('Queue crash'));
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network down'));

    // Should NOT throw even if most checks fail
    const health = await service.getHealthStatus();
    expect(health).toBeDefined();
    expect(health.checks.database.status).toBe('down');
  });

  it('graceful shutdown → liveness false, readiness false', async () => {
    service.setShuttingDown(true);

    const liveness = await service.getLivenessStatus();
    expect(liveness.alive).toBe(false);
    expect(liveness.shuttingDown).toBe(true);

    const readiness = await service.getReadinessStatus();
    expect(readiness.ready).toBe(false);
    expect(readiness.reason).toContain('shutting down');
  });

  it('queue has failed jobs → queue check is down', async () => {
    mockQueueService.getAllQueueStats.mockResolvedValue([
      { name: 'sync', active: 0, waiting: 0, completed: 10, failed: 3 },
    ]);

    const health = await service.getHealthStatus();
    expect(health.checks.queues.status).toBe('down');
  });
});
