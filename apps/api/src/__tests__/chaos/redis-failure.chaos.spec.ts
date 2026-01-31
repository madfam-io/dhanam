import { HealthService } from '../../core/monitoring/health.service';

describe('Redis Failure Chaos Tests', () => {
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
          NODE_ENV: 'test',
        };
        return config[key] ?? defaultValue;
      }),
    };
    mockQueueService = {
      getAllQueueStats: jest.fn().mockResolvedValue([]),
    };

    service = new HealthService(mockPrisma, mockConfig, mockQueueService);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Redis URL not configured → redis check is down', async () => {
    // Config returns undefined for REDIS_URL
    const health = await service.getHealthStatus();
    expect(health.checks.redis.status).toBe('down');
    expect(health.checks.redis.error).toContain('not configured');
  });

  it('Redis connection refused → health degrades gracefully', async () => {
    mockConfig.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'REDIS_URL') return 'redis://nonexistent:6379';
      return defaultValue;
    });

    const health = await service.getHealthStatus();
    expect(health.checks.redis.status).toBe('down');
    // Service should still return a valid health response
    expect(health).toBeDefined();
    expect(health.status).not.toBe('healthy');
  });
});
