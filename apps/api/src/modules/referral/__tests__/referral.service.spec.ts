import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { AmbassadorService } from '../ambassador.service';
import { ReferralService } from '../referral.service';

describe('ReferralService', () => {
  let service: ReferralService;
  let prisma: jest.Mocked<PrismaService>;
  let ambassadorService: jest.Mocked<AmbassadorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: PrismaService,
          useValue: {
            referralReward: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              createMany: jest.fn(),
            },
          },
        },
        {
          provide: AmbassadorService,
          useValue: {
            getProfile: jest.fn(),
            recalculateTier: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    ambassadorService = module.get(AmbassadorService) as jest.Mocked<AmbassadorService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── handleConversionWebhook ────────────────────────────────────────

  describe('handleConversionWebhook', () => {
    const conversionData = {
      referral_code: 'KRF-ABCD1234',
      referrer_user_id: 'referrer-1',
      referred_user_id: 'referred-1',
      source_product: 'karafiel',
      target_product: 'dhanam',
      plan_id: 'pro',
      revenue_cents: 1199,
    };

    it('should create 3 rewards and recalculate tier', async () => {
      prisma.referralReward.findFirst.mockResolvedValue(null);
      prisma.referralReward.createMany.mockResolvedValue({ count: 3 });
      ambassadorService.recalculateTier.mockResolvedValue({
        previousTier: 'none',
        newTier: 'bronze',
        promoted: true,
      });

      const result = await service.handleConversionWebhook(conversionData);

      expect(result.rewards_created).toBe(3);
      expect(result.ambassador_tier).toBe('bronze');

      expect(prisma.referralReward.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            referralId: 'KRF-ABCD1234',
            recipientUserId: 'referrer-1',
            rewardType: 'subscription_extension',
            amount: 1,
          }),
          expect.objectContaining({
            referralId: 'KRF-ABCD1234',
            recipientUserId: 'referrer-1',
            rewardType: 'credit_grant',
            amount: 50,
          }),
          expect.objectContaining({
            referralId: 'KRF-ABCD1234',
            recipientUserId: 'referred-1',
            rewardType: 'credit_grant',
            amount: 50,
          }),
        ]),
      });

      expect(ambassadorService.recalculateTier).toHaveBeenCalledWith('referrer-1');
    });

    it('should skip duplicate conversion and return 0 rewards', async () => {
      prisma.referralReward.findFirst.mockResolvedValue({
        id: 'existing-reward',
        referralId: 'KRF-ABCD1234',
        recipientUserId: 'referrer-1',
        rewardType: 'subscription_extension',
      } as any);

      ambassadorService.getProfile.mockResolvedValue({
        id: 'prof-1',
        tier: 'silver',
        totalReferrals: 8,
        totalConversions: 6,
        lifetimeCreditsEarned: 300,
        lifetimeMonthsEarned: 6,
        discountPercent: 10,
        publicProfile: false,
        displayName: null,
        nextTier: 'gold',
        conversionsToNextTier: 4,
      });

      const result = await service.handleConversionWebhook(conversionData);

      expect(result.rewards_created).toBe(0);
      expect(result.ambassador_tier).toBe('silver');
      expect(prisma.referralReward.createMany).not.toHaveBeenCalled();
      expect(ambassadorService.recalculateTier).not.toHaveBeenCalled();
    });

    it('should include source and target product in reward metadata', async () => {
      prisma.referralReward.findFirst.mockResolvedValue(null);
      prisma.referralReward.createMany.mockResolvedValue({ count: 3 });
      ambassadorService.recalculateTier.mockResolvedValue({
        previousTier: 'bronze',
        newTier: 'bronze',
        promoted: false,
      });

      await service.handleConversionWebhook(conversionData);

      const createManyCall = prisma.referralReward.createMany.mock.calls[0][0];
      for (const reward of (createManyCall as any).data) {
        expect(reward.metadata).toEqual({
          source_product: 'karafiel',
          target_product: 'dhanam',
        });
      }
    });
  });

  // ─── getRewards ─────────────────────────────────────────────────────

  describe('getRewards', () => {
    it('should return reward history for a user', async () => {
      const rewards = [
        {
          id: 'rw-1',
          rewardType: 'credit_grant',
          amount: 50,
          description: 'Referral bonus',
          applied: true,
          appliedAt: new Date(),
          createdAt: new Date(),
        },
      ];

      prisma.referralReward.findMany.mockResolvedValue(rewards as any);

      const result = await service.getRewards('user-1');

      expect(result).toEqual(rewards);
      expect(prisma.referralReward.findMany).toHaveBeenCalledWith({
        where: { recipientUserId: 'user-1' },
        select: {
          id: true,
          rewardType: true,
          amount: true,
          description: true,
          applied: true,
          appliedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when user has no rewards', async () => {
      prisma.referralReward.findMany.mockResolvedValue([]);

      const result = await service.getRewards('user-no-rewards');

      expect(result).toEqual([]);
    });
  });
});
