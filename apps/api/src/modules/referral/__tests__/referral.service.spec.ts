import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { ReferralService } from '../referral.service';

describe('ReferralService', () => {
  let service: ReferralService;
  let prisma: jest.Mocked<PrismaService>;

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: PrismaService,
          useValue: {
            referralCode: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            referral: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            referralReward: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getOrCreateCode ────────────────────────────────────────────────

  describe('getOrCreateCode', () => {
    it('should return existing code when one already exists', async () => {
      prisma.referralCode.findFirst.mockResolvedValue({
        id: 'rc-1',
        code: 'KRF-ABCD1234',
        referrerUserId: 'user-1',
        referrerEmail: 'alice@example.com',
        sourceProduct: 'karafiel',
        targetProduct: null,
        isActive: true,
        usageCount: 0,
        maxUsages: 100,
        expiresAt: ninetyDaysFromNow,
        createdAt: now,
        updatedAt: now,
      } as any);

      const result = await service.getOrCreateCode('user-1', 'alice@example.com', 'karafiel');

      expect(result).toEqual({ code: 'KRF-ABCD1234', isNew: false });
      expect(prisma.referralCode.create).not.toHaveBeenCalled();
    });

    it('should create a new code with correct KRF- prefix for karafiel', async () => {
      prisma.referralCode.findFirst.mockResolvedValue(null);
      // generateUniqueCode checks for collision
      prisma.referralCode.findUnique.mockResolvedValue(null);
      prisma.referralCode.create.mockResolvedValue({
        id: 'rc-new',
        code: 'KRF-12345678',
      } as any);

      const result = await service.getOrCreateCode('user-2', 'bob@example.com', 'karafiel');

      expect(result.isNew).toBe(true);
      expect(result.code).toMatch(/^KRF-[A-F0-9]{8}$/);
      expect(prisma.referralCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referrerUserId: 'user-2',
            referrerEmail: 'bob@example.com',
            sourceProduct: 'karafiel',
            targetProduct: null,
          }),
        })
      );
    });

    it('should create code with DHN- prefix for dhanam product', async () => {
      prisma.referralCode.findFirst.mockResolvedValue(null);
      prisma.referralCode.findUnique.mockResolvedValue(null);
      prisma.referralCode.create.mockResolvedValue({
        id: 'rc-dhn',
        code: 'DHN-AABBCCDD',
      } as any);

      const result = await service.getOrCreateCode('user-3', 'carol@example.com', 'dhanam');

      expect(result.isNew).toBe(true);
      expect(result.code).toMatch(/^DHN-[A-F0-9]{8}$/);
    });

    it('should use MADFAM prefix for unknown product', async () => {
      prisma.referralCode.findFirst.mockResolvedValue(null);
      prisma.referralCode.findUnique.mockResolvedValue(null);
      prisma.referralCode.create.mockResolvedValue({
        id: 'rc-unk',
        code: 'MADFAM-AABBCCDD',
      } as any);

      const result = await service.getOrCreateCode('user-4', 'dan@example.com', 'unknown_product');

      expect(result.isNew).toBe(true);
      expect(result.code).toMatch(/^MADFAM-[A-F0-9]{8}$/);
    });
  });

  // ─── validateCode ───────────────────────────────────────────────────

  describe('validateCode', () => {
    it('should return valid for an active, non-expired code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-active',
        code: 'KRF-VALID001',
        isActive: true,
        usageCount: 3,
        maxUsages: 100,
        expiresAt: ninetyDaysFromNow,
        sourceProduct: 'karafiel',
        targetProduct: null,
        referrerEmail: 'referrer@example.com',
      } as any);

      const result = await service.validateCode('KRF-VALID001');

      expect(result.valid).toBe(true);
      expect(result.referralCode).toEqual({
        code: 'KRF-VALID001',
        sourceProduct: 'karafiel',
        targetProduct: null,
        referrerEmail: 'referrer@example.com',
      });
    });

    it('should return invalid for a non-existent code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue(null);

      const result = await service.validateCode('NONEXISTENT');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Code not found');
    });

    it('should return invalid for an inactive code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-inactive',
        code: 'KRF-DEACTIV1',
        isActive: false,
        usageCount: 0,
        maxUsages: 100,
        expiresAt: ninetyDaysFromNow,
        sourceProduct: 'karafiel',
        targetProduct: null,
        referrerEmail: 'referrer@example.com',
      } as any);

      const result = await service.validateCode('KRF-DEACTIV1');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Code is no longer active');
    });

    it('should return invalid for an expired code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-expired',
        code: 'KRF-EXPIRED1',
        isActive: true,
        usageCount: 0,
        maxUsages: 100,
        expiresAt: oneDayAgo,
        sourceProduct: 'karafiel',
        targetProduct: null,
        referrerEmail: 'referrer@example.com',
      } as any);

      const result = await service.validateCode('KRF-EXPIRED1');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Code has expired');
    });

    it('should return invalid for a code that has reached max usage', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-maxed',
        code: 'KRF-MAXEDOUT',
        isActive: true,
        usageCount: 100,
        maxUsages: 100,
        expiresAt: ninetyDaysFromNow,
        sourceProduct: 'karafiel',
        targetProduct: null,
        referrerEmail: 'referrer@example.com',
      } as any);

      const result = await service.validateCode('KRF-MAXEDOUT');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Code has reached its maximum usage limit');
    });
  });

  // ─── applyCode ──────────────────────────────────────────────────────

  describe('applyCode', () => {
    const validCode = {
      id: 'rc-apply',
      code: 'KRF-APPLY001',
      isActive: true,
      usageCount: 0,
      maxUsages: 100,
      expiresAt: ninetyDaysFromNow,
      sourceProduct: 'karafiel',
      targetProduct: null,
      referrerUserId: 'referrer-user',
      referrerEmail: 'referrer@gmail.com',
    };

    it('should create a Referral row and increment usage count', async () => {
      // validateCode lookup
      prisma.referralCode.findUnique
        .mockResolvedValueOnce(validCode as any) // validateCode
        .mockResolvedValueOnce(validCode as any); // second findUnique in applyCode

      // No duplicate
      prisma.referral.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txMock = {
          referral: {
            create: jest.fn().mockResolvedValue({
              id: 'ref-001',
              referralCodeId: 'rc-apply',
              referredEmail: 'referred@example.com',
              status: 'applied',
            }),
          },
          referralCode: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(txMock);
      });

      const result = await service.applyCode('KRF-APPLY001', 'referred@example.com', 'karafiel');

      expect(result.referralId).toBe('ref-001');
    });

    it('should reject self-referral by userId', async () => {
      prisma.referralCode.findUnique
        .mockResolvedValueOnce(validCode as any) // validateCode
        .mockResolvedValueOnce(validCode as any); // applyCode findUnique

      await expect(
        service.applyCode('KRF-APPLY001', 'other@example.com', 'karafiel', 'referrer-user')
      ).rejects.toThrow('Cannot use your own referral code');
    });

    it('should reject self-referral by email match', async () => {
      prisma.referralCode.findUnique
        .mockResolvedValueOnce(validCode as any)
        .mockResolvedValueOnce(validCode as any);

      await expect(
        service.applyCode('KRF-APPLY001', 'referrer@gmail.com', 'karafiel')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject expired code via validation', async () => {
      const expiredCode = {
        ...validCode,
        expiresAt: oneDayAgo,
      };

      prisma.referralCode.findUnique.mockResolvedValueOnce(expiredCode as any);

      await expect(
        service.applyCode('KRF-APPLY001', 'referred@example.com', 'karafiel')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject same-org domain referrals', async () => {
      const corpCode = {
        ...validCode,
        referrerEmail: 'alice@acmecorp.com',
      };

      prisma.referralCode.findUnique
        .mockResolvedValueOnce({ ...corpCode, isActive: true } as any)
        .mockResolvedValueOnce(corpCode as any);

      await expect(
        service.applyCode('KRF-APPLY001', 'bob@acmecorp.com', 'karafiel')
      ).rejects.toThrow('Referral codes cannot be used within the same organization');
    });

    it('should allow same common email domain referrals (gmail.com)', async () => {
      const gmailCode = {
        ...validCode,
        referrerEmail: 'alice@gmail.com',
      };

      prisma.referralCode.findUnique
        .mockResolvedValueOnce(gmailCode as any) // validateCode
        .mockResolvedValueOnce(gmailCode as any); // applyCode findUnique

      prisma.referral.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txMock = {
          referral: {
            create: jest.fn().mockResolvedValue({ id: 'ref-gmail' }),
          },
          referralCode: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(txMock);
      });

      const result = await service.applyCode('KRF-APPLY001', 'bob@gmail.com', 'karafiel');

      expect(result.referralId).toBe('ref-gmail');
    });

    it('should reject disposable email addresses', async () => {
      prisma.referralCode.findUnique
        .mockResolvedValueOnce(validCode as any)
        .mockResolvedValueOnce(validCode as any);

      await expect(
        service.applyCode('KRF-APPLY001', 'user@mailinator.com', 'karafiel')
      ).rejects.toThrow('Disposable email addresses are not allowed');
    });

    it('should reject duplicate referral for same code + email', async () => {
      prisma.referralCode.findUnique
        .mockResolvedValueOnce(validCode as any)
        .mockResolvedValueOnce(validCode as any);

      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref-existing',
        referralCodeId: 'rc-apply',
        referredEmail: 'referred@example.com',
      } as any);

      await expect(
        service.applyCode('KRF-APPLY001', 'referred@example.com', 'karafiel')
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── reportEvent ────────────────────────────────────────────────────

  describe('reportEvent', () => {
    const baseEvent = {
      code: 'KRF-EVT00001',
      referredEmail: 'referred@example.com',
      targetProduct: 'karafiel',
    };

    it('should transition from pending to applied on signup event', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-evt',
      } as any);

      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref-evt-1',
        referralCodeId: 'rc-evt',
        referredEmail: 'referred@example.com',
        status: 'pending',
        metadata: null,
      } as any);

      prisma.referral.update.mockResolvedValue({} as any);

      const result = await service.reportEvent({
        ...baseEvent,
        event: 'signup',
      });

      expect(result.updated).toBe(true);
      expect(prisma.referral.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ref-evt-1' },
          data: expect.objectContaining({
            status: 'applied',
            signedUpAt: expect.any(Date),
          }),
        })
      );
    });

    it('should transition from applied to trial_started', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-evt',
      } as any);

      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref-evt-2',
        referralCodeId: 'rc-evt',
        referredEmail: 'referred@example.com',
        status: 'applied',
        metadata: null,
      } as any);

      prisma.referral.update.mockResolvedValue({} as any);

      const result = await service.reportEvent({
        ...baseEvent,
        event: 'trial_started',
      });

      expect(result.updated).toBe(true);
      expect(prisma.referral.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'trial_started',
            trialStartedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should transition from trial_started to converted with subscriptionId', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-evt',
      } as any);

      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref-evt-3',
        referralCodeId: 'rc-evt',
        referredEmail: 'referred@example.com',
        status: 'trial_started',
        metadata: {},
      } as any);

      prisma.referral.update.mockResolvedValue({} as any);

      const result = await service.reportEvent({
        ...baseEvent,
        event: 'converted',
        subscriptionId: 'sub-123',
      });

      expect(result.updated).toBe(true);
      expect(prisma.referral.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'converted',
            convertedAt: expect.any(Date),
            metadata: expect.objectContaining({
              subscriptionId: 'sub-123',
            }),
          }),
        })
      );
    });

    it('should not allow backward status transitions', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-evt',
      } as any);

      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref-evt-4',
        referralCodeId: 'rc-evt',
        referredEmail: 'referred@example.com',
        status: 'converted',
        metadata: null,
      } as any);

      const result = await service.reportEvent({
        ...baseEvent,
        event: 'signup', // backward from 'converted'
      });

      expect(result.updated).toBe(false);
      expect(prisma.referral.update).not.toHaveBeenCalled();
    });

    it('should create a pending referral on click event when no referral exists', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-click',
      } as any);

      prisma.referral.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txMock = {
          referral: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'ref-click-new',
              status: 'pending',
            }),
          },
          referralCode: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(txMock);
      });

      const result = await service.reportEvent({
        ...baseEvent,
        event: 'click',
      });

      expect(result.updated).toBe(true);
    });

    it('should return updated: false for unknown code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue(null);

      const result = await service.reportEvent({
        ...baseEvent,
        event: 'signup',
      });

      expect(result.updated).toBe(false);
    });

    it('should return updated: false for non-click event with no referral', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({
        id: 'rc-evt',
      } as any);

      prisma.referral.findUnique.mockResolvedValue(null);

      const result = await service.reportEvent({
        ...baseEvent,
        event: 'signup',
      });

      expect(result.updated).toBe(false);
    });
  });

  // ─── getStats ───────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return aggregated stats with correct counts', async () => {
      prisma.referralCode.findMany.mockResolvedValue([{ id: 'rc-s1' }, { id: 'rc-s2' }] as any);

      prisma.referral.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(5) // converted
        .mockResolvedValueOnce(2); // rewarded

      const stats = await service.getStats('user-stats');

      expect(stats.totalCodes).toBe(2);
      expect(stats.totalReferrals).toBe(10);
      expect(stats.pendingReferrals).toBe(3);
      expect(stats.convertedReferrals).toBe(5);
      expect(stats.rewardedReferrals).toBe(2);
      // conversionRate = (5 + 2) / 10 = 0.7
      expect(stats.conversionRate).toBe(0.7);
    });

    it('should return zeroed stats when user has no codes', async () => {
      prisma.referralCode.findMany.mockResolvedValue([]);

      const stats = await service.getStats('user-no-codes');

      expect(stats).toEqual({
        totalCodes: 0,
        totalReferrals: 0,
        pendingReferrals: 0,
        convertedReferrals: 0,
        rewardedReferrals: 0,
        conversionRate: 0,
      });

      // Should not call referral.count when there are no codes
      expect(prisma.referral.count).not.toHaveBeenCalled();
    });

    it('should calculate 0 conversion rate when no referrals exist', async () => {
      prisma.referralCode.findMany.mockResolvedValue([{ id: 'rc-empty' }] as any);

      prisma.referral.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(0) // converted
        .mockResolvedValueOnce(0); // rewarded

      const stats = await service.getStats('user-empty');

      expect(stats.conversionRate).toBe(0);
    });
  });
});
