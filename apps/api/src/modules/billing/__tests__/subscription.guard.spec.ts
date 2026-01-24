import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionTier } from '@db';

import { SubscriptionGuard } from '../guards/subscription.guard';
import { PaymentRequiredException, SubscriptionExpiredException } from '../exceptions';
import { TIER_KEY } from '../decorators';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = (user?: any, tierRequired?: SubscriptionTier): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no tier requirement is set', async () => {
      const context = mockExecutionContext({ id: 'user-123', subscriptionTier: 'free' });
      reflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw PaymentRequiredException when no user is in request', async () => {
      const context = mockExecutionContext(undefined);
      reflector.getAllAndOverride.mockReturnValue('premium' as SubscriptionTier);

      await expect(guard.canActivate(context)).rejects.toThrow(PaymentRequiredException);
      await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
    });

    it('should allow access when user has required tier (free tier)', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.getAllAndOverride.mockReturnValue('free' as SubscriptionTier);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has premium tier and requires free tier', async () => {
      const context = mockExecutionContext({
        id: 'user-premium',
        subscriptionTier: 'premium',
      });
      reflector.getAllAndOverride.mockReturnValue('free' as SubscriptionTier);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has premium tier and requires premium tier', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const context = mockExecutionContext({
        id: 'user-premium',
        subscriptionTier: 'premium',
        subscriptionExpiresAt: futureDate,
      });
      reflector.getAllAndOverride.mockReturnValue('premium' as SubscriptionTier);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw PaymentRequiredException when free user tries to access premium feature', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.getAllAndOverride.mockReturnValue('premium' as SubscriptionTier);

      await expect(guard.canActivate(context)).rejects.toThrow(PaymentRequiredException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'This feature requires a premium subscription. Upgrade at /billing/upgrade'
      );
    });

    it('should throw SubscriptionExpiredException when premium subscription is expired', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const context = mockExecutionContext({
        id: 'user-expired',
        subscriptionTier: 'premium',
        subscriptionExpiresAt: pastDate,
      });
      reflector.getAllAndOverride.mockReturnValue('premium' as SubscriptionTier);

      await expect(guard.canActivate(context)).rejects.toThrow(SubscriptionExpiredException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Your subscription has expired. Renew at /billing/renew'
      );
    });

    it('should allow access when premium subscription has no expiration date', async () => {
      const context = mockExecutionContext({
        id: 'user-premium',
        subscriptionTier: 'premium',
        subscriptionExpiresAt: null,
      });
      reflector.getAllAndOverride.mockReturnValue('premium' as SubscriptionTier);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when premium subscription expires today but not yet past', async () => {
      const futureToday = new Date();
      futureToday.setHours(23, 59, 59, 999);

      const context = mockExecutionContext({
        id: 'user-premium',
        subscriptionTier: 'premium',
        subscriptionExpiresAt: futureToday,
      });
      reflector.getAllAndOverride.mockReturnValue('premium' as SubscriptionTier);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should check tier from both handler and class metadata', async () => {
      const context = mockExecutionContext({
        id: 'user-premium',
        subscriptionTier: 'premium',
      });

      reflector.getAllAndOverride.mockReturnValue('premium' as SubscriptionTier);

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(TIER_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('tier hierarchy', () => {
    it('should correctly implement tier hierarchy (free < premium)', async () => {
      // Free user cannot access premium
      const freeUserContext = mockExecutionContext({
        id: 'user-free',
        subscriptionTier: 'free',
      });
      reflector.getAllAndOverride.mockReturnValue('premium' as SubscriptionTier);

      await expect(guard.canActivate(freeUserContext)).rejects.toThrow(PaymentRequiredException);

      // Premium user can access free tier features
      const premiumUserContext = mockExecutionContext({
        id: 'user-premium',
        subscriptionTier: 'premium',
      });
      reflector.getAllAndOverride.mockReturnValue('free' as SubscriptionTier);

      const result = await guard.canActivate(premiumUserContext);
      expect(result).toBe(true);
    });
  });
});
