import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreditsExhaustedException } from '../exceptions';
import { UsageMeteringService } from '../services/usage-metering.service';

describe('UsageMeteringService', () => {
  let service: UsageMeteringService;
  let prisma: jest.Mocked<PrismaService>;

  const mockBalance = {
    id: 'balance-1',
    orgId: 'org-1',
    creditsIncluded: 5000,
    creditsUsed: 100,
    overageCredits: 0,
    periodStart: new Date('2026-04-01'),
    periodEnd: new Date('2026-05-01'),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageMeteringService,
        {
          provide: PrismaService,
          useValue: {
            usageEvent: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
            },
            creditBalance: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsageMeteringService>(UsageMeteringService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordUsage', () => {
    it('should record usage and decrement balance correctly', async () => {
      // No existing event with this idempotency key
      prisma.usageEvent.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'essentials',
      } as any);

      const updatedBalance = {
        ...mockBalance,
        creditsUsed: 110,
        creditsIncluded: 5000,
        overageCredits: 0,
      };

      // The $transaction mock needs to execute the callback
      prisma.$transaction.mockImplementation(async (cb: any) => {
        // Inside transaction, mock the same prisma methods
        const txMock = {
          usageEvent: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'event-1',
              orgId: 'org-1',
              service: 'karafiel',
              operation: 'cfdi_stamp',
              credits: 10,
              idempotencyKey: 'key-1',
              createdAt: new Date(),
            }),
          },
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue(mockBalance),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedBalance),
          },
        };
        return cb(txMock);
      });

      const result = await service.recordUsage('org-1', 'karafiel', 'cfdi_stamp', 10, 'key-1');

      expect(result.recorded).toBe(true);
      expect(result.creditsRemaining).toBe(4890); // 5000 - 110
      expect(result.overageCredits).toBe(0);
      expect(result.tier).toBe('essentials');
    });

    it('should skip recording when idempotency key already exists', async () => {
      // Existing event found
      prisma.usageEvent.findUnique.mockResolvedValue({
        id: 'event-existing',
        orgId: 'org-1',
        service: 'karafiel',
        operation: 'cfdi_stamp',
        credits: 10,
        idempotencyKey: 'key-dup',
        createdAt: new Date(),
      } as any);

      prisma.creditBalance.findUnique.mockResolvedValue(mockBalance);
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'essentials',
      } as any);

      const result = await service.recordUsage('org-1', 'karafiel', 'cfdi_stamp', 10, 'key-dup');

      expect(result.recorded).toBe(false);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should block free tier when credits are exhausted', async () => {
      prisma.usageEvent.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'community',
      } as any);

      const exhaustedBalance = {
        ...mockBalance,
        creditsIncluded: 100,
        creditsUsed: 100, // fully exhausted
        overageCredits: 0,
      };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txMock = {
          usageEvent: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue(exhaustedBalance),
            create: jest.fn(),
            update: jest.fn(),
          },
        };
        return cb(txMock);
      });

      await expect(
        service.recordUsage('org-1', 'karafiel', 'cfdi_stamp', 5, 'key-blocked')
      ).rejects.toThrow(CreditsExhaustedException);
    });

    it('should allow overage for paid tier and track overage credits', async () => {
      prisma.usageEvent.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'pro',
      } as any);

      const nearlyExhaustedBalance = {
        ...mockBalance,
        creditsIncluded: 25000,
        creditsUsed: 24998,
        overageCredits: 0,
      };

      const updatedWithOverage = {
        ...nearlyExhaustedBalance,
        creditsUsed: 25000, // capped at included
        overageCredits: 8, // 10 - 2 remaining = 8 overage
      };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txMock = {
          usageEvent: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'event-overage',
              orgId: 'org-1',
              service: 'selva',
              operation: 'agent_dispatch',
              credits: 10,
              idempotencyKey: 'key-overage',
              createdAt: new Date(),
            }),
          },
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue(nearlyExhaustedBalance),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedWithOverage),
          },
        };
        return cb(txMock);
      });

      const result = await service.recordUsage(
        'org-1',
        'selva',
        'agent_dispatch',
        10,
        'key-overage'
      );

      expect(result.recorded).toBe(true);
      expect(result.creditsRemaining).toBe(0);
      expect(result.overageCredits).toBe(8);
      expect(result.tier).toBe('pro');
    });
  });

  describe('getBalance', () => {
    it('should return balance with overage rate for tier', async () => {
      prisma.creditBalance.findUnique.mockResolvedValue(mockBalance);
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'essentials',
      } as any);

      const balance = await service.getBalance('org-1');

      expect(balance.creditsIncluded).toBe(5000);
      expect(balance.creditsUsed).toBe(100);
      expect(balance.creditsRemaining).toBe(4900);
      expect(balance.overageRate).toBe(0.002);
      expect(balance.tier).toBe('essentials');
    });

    it('should return null overage rate for community tier', async () => {
      prisma.creditBalance.findUnique.mockResolvedValue({
        ...mockBalance,
        creditsIncluded: 100,
      });
      prisma.user.findUnique.mockResolvedValue({
        subscriptionTier: 'community',
      } as any);

      const balance = await service.getBalance('org-1');

      expect(balance.overageRate).toBeNull();
      expect(balance.tier).toBe('community');
    });
  });

  describe('resetPeriod', () => {
    it('should reset creditsUsed and overageCredits to 0', async () => {
      prisma.creditBalance.findUnique.mockResolvedValue({
        ...mockBalance,
        creditsUsed: 4500,
        overageCredits: 200,
      });

      await service.resetPeriod('org-1');

      expect(prisma.creditBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: 'org-1' },
          data: expect.objectContaining({
            creditsUsed: 0,
            overageCredits: 0,
          }),
        })
      );
    });

    it('should handle missing balance gracefully', async () => {
      prisma.creditBalance.findUnique.mockResolvedValue(null);

      // Should not throw
      await service.resetPeriod('org-nonexistent');

      expect(prisma.creditBalance.update).not.toHaveBeenCalled();
    });
  });

  describe('provisionCredits', () => {
    it('should update existing balance with new tier credits', async () => {
      prisma.creditBalance.findUnique.mockResolvedValue(mockBalance);

      await service.provisionCredits('org-1', 'pro');

      expect(prisma.creditBalance.update).toHaveBeenCalledWith({
        where: { orgId: 'org-1' },
        data: { creditsIncluded: 25000 },
      });
    });

    it('should create balance for new org', async () => {
      prisma.creditBalance.findUnique.mockResolvedValue(null);

      await service.provisionCredits('org-new', 'premium');

      expect(prisma.creditBalance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: 'org-new',
            creditsIncluded: 100000,
            creditsUsed: 0,
            overageCredits: 0,
          }),
        })
      );
    });

    it('should default to community credits for unknown tier', async () => {
      prisma.creditBalance.findUnique.mockResolvedValue(mockBalance);

      await service.provisionCredits('org-1', 'unknown_tier');

      expect(prisma.creditBalance.update).toHaveBeenCalledWith({
        where: { orgId: 'org-1' },
        data: { creditsIncluded: 100 },
      });
    });
  });

  describe('getUsage', () => {
    it('should return aggregated usage with breakdown', async () => {
      prisma.usageEvent.findMany.mockResolvedValue([
        {
          service: 'karafiel',
          operation: 'cfdi_stamp',
          credits: 5,
          createdAt: new Date('2026-04-10'),
        },
        {
          service: 'karafiel',
          operation: 'cfdi_stamp',
          credits: 3,
          createdAt: new Date('2026-04-11'),
        },
        {
          service: 'selva',
          operation: 'agent_dispatch',
          credits: 10,
          createdAt: new Date('2026-04-10'),
        },
      ] as any);

      const result = await service.getUsage('org-1');

      expect(result.totalCredits).toBe(18);
      expect(result.breakdown.karafiel.totalCredits).toBe(8);
      expect(result.breakdown.karafiel.operations.cfdi_stamp).toBe(8);
      expect(result.breakdown.selva.totalCredits).toBe(10);
      expect(result.breakdown.selva.operations.agent_dispatch).toBe(10);
    });

    it('should filter by service', async () => {
      prisma.usageEvent.findMany.mockResolvedValue([]);

      await service.getUsage('org-1', undefined, undefined, 'karafiel');

      expect(prisma.usageEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: 'org-1',
            service: 'karafiel',
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      prisma.usageEvent.findMany.mockResolvedValue([]);
      const start = new Date('2026-04-01');
      const end = new Date('2026-04-30');

      await service.getUsage('org-1', start, end);

      expect(prisma.usageEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: 'org-1',
            createdAt: { gte: start, lte: end },
          }),
        })
      );
    });
  });
});
