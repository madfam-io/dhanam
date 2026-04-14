import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { UsageTrackingService } from '../services/usage-tracking.service';

describe('UsageTrackingService', () => {
  let service: UsageTrackingService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageTrackingService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            usageMetric: {
              upsert: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsageTrackingService>(UsageTrackingService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('tierLimits', () => {
    it('should expose tier limits for all tiers', () => {
      expect(service.tierLimits).toHaveProperty('community');
      expect(service.tierLimits).toHaveProperty('essentials');
      expect(service.tierLimits).toHaveProperty('pro');
      expect(service.tierLimits).toHaveProperty('premium');
    });

    it('should restrict essentials tier spaces', () => {
      expect(service.tierLimits.essentials.maxSpaces).toBe(2);
    });

    it('should allow unlimited spaces for community (self-hosted)', () => {
      expect(service.tierLimits.community.maxSpaces).toBe(Infinity);
    });

    it('should gate lifeBeat behind pro tier', () => {
      expect(service.tierLimits.essentials.lifeBeat).toBe(false);
      expect(service.tierLimits.pro.lifeBeat).toBe(true);
    });
  });

  describe('getUsageLimits', () => {
    it('should return all tier usage limits', () => {
      const limits = service.getUsageLimits();

      expect(limits.community.esg_calculation).toBe(Infinity);
      expect(limits.essentials.esg_calculation).toBe(20);
      expect(limits.essentials.portfolio_rebalance).toBe(0);
      expect(limits.pro.esg_calculation).toBe(Infinity);
    });
  });

  describe('getTierLimits', () => {
    it('should return limits for a known tier', () => {
      const proLimits = service.getTierLimits('pro');

      expect(proLimits.maxSpaces).toBe(5);
      expect(proLimits.maxProviderConnections).toBe(Infinity);
    });

    it('should fall back to community for unknown tier', () => {
      const unknownLimits = service.getTierLimits('nonexistent');

      expect(unknownLimits.maxSpaces).toBe(Infinity);
    });
  });

  describe('recordUsage', () => {
    it('should upsert usage metric for today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.usageMetric.upsert.mockResolvedValue({
        id: 'metric-1',
        userId: 'user-1',
        metricType: 'esg_calculation',
        date: today,
        count: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.recordUsage('user-1', 'esg_calculation');

      expect(prisma.usageMetric.upsert).toHaveBeenCalledWith({
        where: {
          userId_metricType_date: {
            userId: 'user-1',
            metricType: 'esg_calculation',
            date: today,
          },
        },
        create: {
          userId: 'user-1',
          metricType: 'esg_calculation',
          date: today,
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      });
    });
  });

  describe('checkUsageLimit', () => {
    it('should return false for nonexistent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.checkUsageLimit('missing', 'esg_calculation');

      expect(result).toBe(false);
    });

    it('should return true for pro users regardless of usage', async () => {
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'pro',
      } as any);

      const result = await service.checkUsageLimit('user-pro', 'monte_carlo_simulation');

      expect(result).toBe(true);
      // Should not even check the usage metric
      expect(prisma.usageMetric.findUnique).not.toHaveBeenCalled();
    });

    it('should return false for essentials user at portfolio_rebalance (limit=0)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'essentials',
      } as any);

      const result = await service.checkUsageLimit('user-ess', 'portfolio_rebalance');

      expect(result).toBe(false);
    });

    it('should return true for essentials user below limit', async () => {
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'essentials',
      } as any);

      prisma.usageMetric.findUnique.mockResolvedValue({
        id: 'metric-1',
        userId: 'user-ess',
        metricType: 'esg_calculation',
        date: new Date(),
        count: 5, // well below 20 limit
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.checkUsageLimit('user-ess', 'esg_calculation');

      expect(result).toBe(true);
    });

    it('should return false for essentials user at or above limit', async () => {
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'essentials',
      } as any);

      prisma.usageMetric.findUnique.mockResolvedValue({
        id: 'metric-1',
        userId: 'user-ess',
        metricType: 'esg_calculation',
        date: new Date(),
        count: 20, // at limit
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.checkUsageLimit('user-ess', 'esg_calculation');

      expect(result).toBe(false);
    });
  });

  describe('getUserUsage', () => {
    it('should return formatted usage for all metric types', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'essentials',
      } as any);

      prisma.usageMetric.findMany.mockResolvedValue([
        {
          id: 'm1',
          userId: 'u1',
          metricType: 'esg_calculation',
          date: today,
          count: 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getUserUsage('u1');

      expect(result.tier).toBe('essentials');
      expect(result.usage.esg_calculation).toEqual({ used: 7, limit: 20 });
      expect(result.usage.monte_carlo_simulation).toEqual({ used: 0, limit: 10 });
      expect(result.usage.portfolio_rebalance).toEqual({ used: 0, limit: 0 });
    });

    it('should return -1 for unlimited limits', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'pro',
      } as any);

      prisma.usageMetric.findMany.mockResolvedValue([]);

      const result = await service.getUserUsage('u-pro');

      expect(result.tier).toBe('pro');
      expect(result.usage.esg_calculation).toEqual({ used: 0, limit: -1 });
    });
  });
});
