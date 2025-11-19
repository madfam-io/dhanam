import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsageMetricType } from '@prisma/client';
import Stripe from 'stripe';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { BillingService } from '../billing.service';
import { StripeService } from '../stripe.service';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: jest.Mocked<PrismaService>;
  let stripe: jest.Mocked<StripeService>;
  let audit: jest.Mocked<AuditService>;
  let config: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    stripeCustomerId: null,
    subscriptionTier: 'free' as const,
    subscriptionStartedAt: null,
    subscriptionExpiresAt: null,
    stripeSubscriptionId: null,
  };

  const mockPremiumUser = {
    ...mockUser,
    id: 'user-premium',
    stripeCustomerId: 'cus_premium123',
    subscriptionTier: 'premium' as const,
    subscriptionStartedAt: new Date('2024-01-01'),
    subscriptionExpiresAt: new Date('2025-01-01'),
    stripeSubscriptionId: 'sub_premium123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            billingEvent: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            usageMetric: {
              upsert: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: StripeService,
          useValue: {
            createCustomer: jest.fn(),
            createCheckoutSession: jest.fn(),
            createPortalSession: jest.fn(),
            cancelSubscription: jest.fn(),
            updateSubscription: jest.fn(),
            getSubscription: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'STRIPE_PREMIUM_PRICE_ID') return 'price_premium123';
              if (key === 'WEB_URL') return 'http://localhost:3000';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    stripe = module.get(StripeService) as jest.Mocked<StripeService>;
    audit = module.get(AuditService) as jest.Mocked<AuditService>;
    config = module.get(ConfigService) as jest.Mocked<ConfigService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upgradeToPremium', () => {
    it('should create Stripe customer and checkout session for new user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser as any) // First call for user lookup
        .mockResolvedValueOnce(mockUser as any); // Second call for tier check

      const mockCustomer = { id: 'cus_new123' } as Stripe.Customer;
      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/pay/cs_test123',
      } as Stripe.Checkout.Session;

      stripe.createCustomer.mockResolvedValue(mockCustomer);
      stripe.createCheckoutSession.mockResolvedValue(mockSession);
      prisma.user.update.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_new123' } as any);

      const result = await service.upgradeToPremium('user-123');

      expect(stripe.createCustomer).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: { userId: 'user-123' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { stripeCustomerId: 'cus_new123' },
      });
      expect(stripe.createCheckoutSession).toHaveBeenCalledWith({
        customerId: 'cus_new123',
        priceId: 'price_premium123',
        successUrl: 'http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'http://localhost:3000/billing/cancel',
        metadata: { userId: 'user-123' },
      });
      expect(audit.log).toHaveBeenCalled();
      expect(result).toEqual({ checkoutUrl: 'https://checkout.stripe.com/pay/cs_test123' });
    });

    it('should use existing Stripe customer ID if available', async () => {
      const userWithStripe = { ...mockUser, stripeCustomerId: 'cus_existing123' };
      prisma.user.findUnique
        .mockResolvedValueOnce(userWithStripe as any)
        .mockResolvedValueOnce(userWithStripe as any);

      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/pay/cs_test123',
      } as Stripe.Checkout.Session;

      stripe.createCheckoutSession.mockResolvedValue(mockSession);

      await service.upgradeToPremium('user-123');

      expect(stripe.createCustomer).not.toHaveBeenCalled();
      expect(stripe.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cus_existing123' })
      );
    });

    it('should throw error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.upgradeToPremium('nonexistent')).rejects.toThrow('User not found');
    });

    it('should throw error if user is already premium', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockPremiumUser as any)
        .mockResolvedValueOnce(mockPremiumUser as any);

      await expect(service.upgradeToPremium('user-premium')).rejects.toThrow(
        'User is already on premium tier'
      );
    });
  });

  describe('createPortalSession', () => {
    it('should create billing portal session for existing customer', async () => {
      const userWithStripe = { ...mockUser, stripeCustomerId: 'cus_existing123' };
      prisma.user.findUnique.mockResolvedValue(userWithStripe as any);

      const mockSession = {
        url: 'https://billing.stripe.com/session/test123',
      } as Stripe.BillingPortal.Session;

      stripe.createPortalSession.mockResolvedValue(mockSession);

      const result = await service.createPortalSession('user-123');

      expect(stripe.createPortalSession).toHaveBeenCalledWith({
        customerId: 'cus_existing123',
        returnUrl: 'http://localhost:3000/billing',
      });
      expect(result).toEqual({ portalUrl: 'https://billing.stripe.com/session/test123' });
    });

    it('should throw error if no Stripe customer found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.createPortalSession('user-123')).rejects.toThrow(
        'No Stripe customer found for this user'
      );
    });
  });

  describe('handleSubscriptionCreated', () => {
    it('should update user to premium tier and create billing event', async () => {
      const mockSubscription = {
        id: 'sub_new123',
        customer: 'cus_test123',
        current_period_start: 1609459200, // 2021-01-01
        current_period_end: 1640995200, // 2022-01-01
        items: {
          data: [
            {
              price: {
                unit_amount: 1999,
              },
            },
          ],
        },
        currency: 'usd',
      } as any;

      const mockEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: { object: mockSubscription },
      } as Stripe.Event;

      const userWithStripe = { ...mockUser, stripeCustomerId: 'cus_test123' };
      prisma.user.findUnique.mockResolvedValue(userWithStripe as any);
      prisma.user.update.mockResolvedValue({ ...userWithStripe, subscriptionTier: 'premium' } as any);
      prisma.billingEvent.create.mockResolvedValue({} as any);

      await service.handleSubscriptionCreated(mockEvent);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          subscriptionTier: 'premium',
          subscriptionStartedAt: new Date(1609459200 * 1000),
          subscriptionExpiresAt: new Date(1640995200 * 1000),
          stripeSubscriptionId: 'sub_new123',
        },
      });
      expect(prisma.billingEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          type: 'subscription_created',
          amount: 19.99,
          currency: 'USD',
          status: 'succeeded',
          stripeEventId: 'evt_test123',
          metadata: { subscriptionId: 'sub_new123' },
        },
      });
      expect(audit.log).toHaveBeenCalledWith({
        userId: 'user-123',
        action: 'SUBSCRIPTION_ACTIVATED',
        severity: 'high',
        metadata: { tier: 'premium', subscriptionId: 'sub_new123' },
      });
    });

    it('should handle missing user gracefully', async () => {
      const mockSubscription = {
        customer: 'cus_nonexistent',
      } as any;

      const mockEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: { object: mockSubscription },
      } as Stripe.Event;

      prisma.user.findUnique.mockResolvedValue(null);

      await service.handleSubscriptionCreated(mockEvent);

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.billingEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionCancelled', () => {
    it('should downgrade user to free tier and create billing event', async () => {
      const mockSubscription = {
        id: 'sub_cancelled123',
        customer: 'cus_test123',
      } as any;

      const mockEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.deleted',
        data: { object: mockSubscription },
      } as Stripe.Event;

      const userWithStripe = { ...mockPremiumUser, stripeCustomerId: 'cus_test123' };
      prisma.user.findUnique.mockResolvedValue(userWithStripe as any);
      prisma.user.update.mockResolvedValue({ ...userWithStripe, subscriptionTier: 'free' } as any);
      prisma.billingEvent.create.mockResolvedValue({} as any);

      await service.handleSubscriptionCancelled(mockEvent);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-premium' },
        data: {
          subscriptionTier: 'free',
          subscriptionExpiresAt: null,
          stripeSubscriptionId: null,
        },
      });
      expect(prisma.billingEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-premium',
          type: 'subscription_cancelled',
          amount: 0,
          currency: 'USD',
          status: 'succeeded',
          stripeEventId: 'evt_test123',
          metadata: { subscriptionId: 'sub_cancelled123' },
        },
      });
      expect(audit.log).toHaveBeenCalledWith({
        userId: 'user-premium',
        action: 'SUBSCRIPTION_CANCELLED',
        severity: 'medium',
        metadata: { subscriptionId: 'sub_cancelled123' },
      });
    });
  });

  describe('recordUsage', () => {
    it('should create new usage metric for today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.usageMetric.upsert.mockResolvedValue({
        id: 'metric-123',
        userId: 'user-123',
        metricType: 'esg_calculation',
        date: today,
        count: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.recordUsage('user-123', 'esg_calculation');

      expect(prisma.usageMetric.upsert).toHaveBeenCalledWith({
        where: {
          userId_metricType_date: {
            userId: 'user-123',
            metricType: 'esg_calculation',
            date: today,
          },
        },
        create: {
          userId: 'user-123',
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
    it('should return true for premium users (unlimited)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockPremiumUser as any);

      const result = await service.checkUsageLimit('user-premium', 'monte_carlo_simulation');

      expect(result).toBe(true);
    });

    it('should return true for free users within limit', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.usageMetric.findUnique.mockResolvedValue({
        id: 'metric-123',
        userId: 'user-123',
        metricType: 'esg_calculation',
        date: today,
        count: 5, // Free tier limit is 10
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.checkUsageLimit('user-123', 'esg_calculation');

      expect(result).toBe(true);
    });

    it('should return false for free users at limit', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.usageMetric.findUnique.mockResolvedValue({
        id: 'metric-123',
        userId: 'user-123',
        metricType: 'esg_calculation',
        date: today,
        count: 10, // Free tier limit is 10
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.checkUsageLimit('user-123', 'esg_calculation');

      expect(result).toBe(false);
    });

    it('should return false for features not available in free tier', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.checkUsageLimit('user-123', 'portfolio_rebalance');

      expect(result).toBe(false);
    });

    it('should return true for users with no usage today', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.usageMetric.findUnique.mockResolvedValue(null);

      const result = await service.checkUsageLimit('user-123', 'esg_calculation');

      expect(result).toBe(true);
    });
  });

  describe('getUserUsage', () => {
    it('should return usage metrics for all metric types', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.usageMetric.findMany.mockResolvedValue([
        {
          id: 'metric-1',
          userId: 'user-123',
          metricType: 'esg_calculation',
          date: today,
          count: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'metric-2',
          userId: 'user-123',
          metricType: 'monte_carlo_simulation',
          date: today,
          count: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getUserUsage('user-123');

      expect(result).toEqual({
        date: today,
        tier: 'free',
        usage: {
          esg_calculation: { used: 5, limit: 10 },
          monte_carlo_simulation: { used: 2, limit: 3 },
          goal_probability: { used: 0, limit: 3 },
          scenario_analysis: { used: 0, limit: 1 },
          portfolio_rebalance: { used: 0, limit: 0 },
          api_request: { used: 0, limit: 1000 },
        },
      });
    });

    it('should return unlimited (-1) for premium user', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.user.findUnique.mockResolvedValue(mockPremiumUser as any);
      prisma.usageMetric.findMany.mockResolvedValue([]);

      const result = await service.getUserUsage('user-premium');

      expect(result.tier).toBe('premium');
      expect(result.usage.esg_calculation).toEqual({ used: 0, limit: -1 });
      expect(result.usage.monte_carlo_simulation).toEqual({ used: 0, limit: -1 });
    });
  });

  describe('getBillingHistory', () => {
    it('should return billing events for user', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          userId: 'user-123',
          type: 'payment_succeeded',
          amount: 19.99,
          currency: 'USD',
          status: 'succeeded',
          stripeEventId: 'evt_1',
          metadata: {},
          createdAt: new Date(),
        },
        {
          id: 'event-2',
          userId: 'user-123',
          type: 'subscription_created',
          amount: 19.99,
          currency: 'USD',
          status: 'succeeded',
          stripeEventId: 'evt_2',
          metadata: {},
          createdAt: new Date(),
        },
      ];

      prisma.billingEvent.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.getBillingHistory('user-123');

      expect(prisma.billingEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      expect(result).toEqual(mockEvents);
    });

    it('should respect custom limit parameter', async () => {
      prisma.billingEvent.findMany.mockResolvedValue([]);

      await service.getBillingHistory('user-123', 5);

      expect(prisma.billingEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });

  describe('getUsageLimits', () => {
    it('should return usage limits configuration', () => {
      const limits = service.getUsageLimits();

      expect(limits).toEqual({
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
      });
    });
  });
});
