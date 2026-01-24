import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageMetricType } from '@db';

import { UsageLimitGuard } from '../guards/usage-limit.guard';
import { BillingService } from '../billing.service';
import { UsageLimitExceededException } from '../exceptions';
import { USAGE_METRIC_KEY } from '../decorators';

describe('UsageLimitGuard', () => {
  let guard: UsageLimitGuard;
  let reflector: jest.Mocked<Reflector>;
  let billingService: jest.Mocked<BillingService>;

  const mockExecutionContext = (user?: any, metricType?: UsageMetricType): ExecutionContext => {
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
        UsageLimitGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: BillingService,
          useValue: {
            checkUsageLimit: jest.fn(),
            getUsageLimits: jest.fn(() => ({
              free: {
                esg_calculation: 10,
                monte_carlo_simulation: 3,
                goal_probability: 3,
                scenario_analysis: 1,
                portfolio_rebalance: 0,
                api_request: 1000,
              },
              premium: {
                esg_calculation: Infinity,
                monte_carlo_simulation: Infinity,
                goal_probability: Infinity,
                scenario_analysis: Infinity,
                portfolio_rebalance: Infinity,
                api_request: Infinity,
              },
            })),
          },
        },
      ],
    }).compile();

    guard = module.get<UsageLimitGuard>(UsageLimitGuard);
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
    billingService = module.get(BillingService) as jest.Mocked<BillingService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no usage tracking is configured', async () => {
      const context = mockExecutionContext({ id: 'user-123', subscriptionTier: 'free' });
      reflector.get.mockReturnValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(billingService.checkUsageLimit).not.toHaveBeenCalled();
    });

    it('should allow access when no user is in request', async () => {
      const context = mockExecutionContext(undefined);
      reflector.get.mockReturnValue('esg_calculation' as UsageMetricType);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(billingService.checkUsageLimit).not.toHaveBeenCalled();
    });

    it('should allow access when user has not exceeded limit', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.get.mockReturnValue('esg_calculation' as UsageMetricType);
      billingService.checkUsageLimit.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(billingService.checkUsageLimit).toHaveBeenCalledWith('user-123', 'esg_calculation');
      expect(result).toBe(true);
    });

    it('should throw UsageLimitExceededException when user has exceeded limit', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.get.mockReturnValue('esg_calculation' as UsageMetricType);
      billingService.checkUsageLimit.mockResolvedValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(UsageLimitExceededException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Daily limit of 10 esg calculation reached. Upgrade to Premium for unlimited access.'
      );
    });

    it('should format metric type in error message (replace underscores with spaces)', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.get.mockReturnValue('monte_carlo_simulation' as UsageMetricType);
      billingService.checkUsageLimit.mockResolvedValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Daily limit of 3 monte carlo simulation reached. Upgrade to Premium for unlimited access.'
      );
    });

    it('should check usage limit for different metric types', async () => {
      const metricTypes: UsageMetricType[] = [
        'esg_calculation',
        'monte_carlo_simulation',
        'goal_probability',
        'scenario_analysis',
      ];

      for (const metricType of metricTypes) {
        const context = mockExecutionContext({
          id: 'user-123',
          subscriptionTier: 'free',
        });
        reflector.get.mockReturnValue(metricType);
        billingService.checkUsageLimit.mockResolvedValue(true);

        await guard.canActivate(context);

        expect(billingService.checkUsageLimit).toHaveBeenCalledWith('user-123', metricType);
      }
    });

    it('should get usage limits from billing service when limit exceeded', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.get.mockReturnValue('goal_probability' as UsageMetricType);
      billingService.checkUsageLimit.mockResolvedValue(false);

      try {
        await guard.canActivate(context);
      } catch (error) {
        expect(billingService.getUsageLimits).toHaveBeenCalled();
        expect(error).toBeInstanceOf(UsageLimitExceededException);
      }
    });

    it('should use correct limit from user tier in error message', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.get.mockReturnValue('scenario_analysis' as UsageMetricType);
      billingService.checkUsageLimit.mockResolvedValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Daily limit of 1 scenario analysis reached. Upgrade to Premium for unlimited access.'
      );
    });

    it('should retrieve metric type from handler metadata', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.get.mockReturnValue('api_request' as UsageMetricType);
      billingService.checkUsageLimit.mockResolvedValue(true);

      await guard.canActivate(context);

      expect(reflector.get).toHaveBeenCalledWith(USAGE_METRIC_KEY, context.getHandler());
    });
  });

  describe('premium users', () => {
    it('should allow unlimited access for premium users', async () => {
      const context = mockExecutionContext({
        id: 'user-premium',
        subscriptionTier: 'premium',
      });
      reflector.get.mockReturnValue('monte_carlo_simulation' as UsageMetricType);
      billingService.checkUsageLimit.mockResolvedValue(true); // Premium always returns true

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(billingService.checkUsageLimit).toHaveBeenCalledWith('user-premium', 'monte_carlo_simulation');
    });
  });

  describe('feature gating', () => {
    it('should block free users from premium-only features', async () => {
      const context = mockExecutionContext({
        id: 'user-123',
        subscriptionTier: 'free',
      });
      reflector.get.mockReturnValue('portfolio_rebalance' as UsageMetricType);
      billingService.checkUsageLimit.mockResolvedValue(false); // Feature not available on free tier

      await expect(guard.canActivate(context)).rejects.toThrow(UsageLimitExceededException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Daily limit of 0 portfolio rebalance reached. Upgrade to Premium for unlimited access.'
      );
    });
  });
});
