import * as crypto from 'crypto';

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { CreditBillingController } from '../credit-billing.controller';
import { UsageMeteringService } from '../services/usage-metering.service';

describe('CreditBillingController', () => {
  let controller: CreditBillingController;
  let usageMetering: jest.Mocked<UsageMeteringService>;
  let configService: jest.Mocked<ConfigService>;

  const SIGNING_SECRET = 'test-billing-webhook-secret';

  function signBody(body: string): string {
    return crypto.createHmac('sha256', SIGNING_SECRET).update(body).digest('hex');
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditBillingController],
      providers: [
        {
          provide: UsageMeteringService,
          useValue: {
            recordUsage: jest.fn(),
            getBalance: jest.fn(),
            getUsage: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'BILLING_WEBHOOK_SECRET') return SIGNING_SECRET;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<CreditBillingController>(CreditBillingController);
    usageMetering = module.get(UsageMeteringService) as jest.Mocked<UsageMeteringService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    jest.clearAllMocks();
    // Re-apply the default mock after clearAllMocks
    configService.get.mockImplementation((key: string) => {
      if (key === 'BILLING_WEBHOOK_SECRET') return SIGNING_SECRET;
      return undefined;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return balance for authenticated user', async () => {
      const mockBalance = {
        creditsIncluded: 5000,
        creditsUsed: 100,
        creditsRemaining: 4900,
        overageCredits: 0,
        overageRate: 0.002,
        tier: 'essentials',
        periodStart: new Date(),
        periodEnd: new Date(),
      };

      usageMetering.getBalance.mockResolvedValue(mockBalance);

      const req = { user: { id: 'user-1' } } as any;
      const result = await controller.getBalance(req);

      expect(result).toEqual(mockBalance);
      expect(usageMetering.getBalance).toHaveBeenCalledWith('user-1');
    });
  });

  describe('recordUsage', () => {
    it('should record usage with valid HMAC signature', async () => {
      const dto = {
        orgId: 'org-1',
        service: 'karafiel',
        operation: 'cfdi_stamp',
        credits: 5,
        idempotencyKey: 'key-1',
      };

      const body = JSON.stringify(dto);
      const signature = signBody(body);

      usageMetering.recordUsage.mockResolvedValue({
        recorded: true,
        creditsRemaining: 4995,
        overageCredits: 0,
        tier: 'essentials',
      });

      const req = {
        rawBody: Buffer.from(body),
        body: dto,
      } as any;

      const result = await controller.recordUsage(req, signature, dto);

      expect(result.recorded).toBe(true);
      expect(usageMetering.recordUsage).toHaveBeenCalledWith(
        'org-1',
        'karafiel',
        'cfdi_stamp',
        5,
        'key-1'
      );
    });

    it('should reject requests without HMAC signature', async () => {
      const dto = {
        orgId: 'org-1',
        service: 'karafiel',
        operation: 'cfdi_stamp',
        credits: 5,
        idempotencyKey: 'key-2',
      };

      const req = {
        rawBody: Buffer.from(JSON.stringify(dto)),
        body: dto,
      } as any;

      await expect(controller.recordUsage(req, '', dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject requests with invalid HMAC signature', async () => {
      const dto = {
        orgId: 'org-1',
        service: 'karafiel',
        operation: 'cfdi_stamp',
        credits: 5,
        idempotencyKey: 'key-3',
      };

      const req = {
        rawBody: Buffer.from(JSON.stringify(dto)),
        body: dto,
      } as any;

      await expect(
        controller.recordUsage(req, 'invalid-signature-hex-value-here', dto)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when BILLING_WEBHOOK_SECRET is not configured', async () => {
      configService.get.mockReturnValue(undefined);

      const dto = {
        orgId: 'org-1',
        service: 'karafiel',
        operation: 'cfdi_stamp',
        credits: 5,
        idempotencyKey: 'key-4',
      };

      const body = JSON.stringify(dto);
      const signature = signBody(body);

      const req = {
        rawBody: Buffer.from(body),
        body: dto,
      } as any;

      await expect(controller.recordUsage(req, signature, dto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('getUsage', () => {
    it('should return usage breakdown for authenticated user', async () => {
      const mockUsage = {
        totalCredits: 50,
        events: [
          { service: 'karafiel', operation: 'cfdi_stamp', credits: 50, createdAt: new Date() },
        ],
        breakdown: {
          karafiel: { totalCredits: 50, operations: { cfdi_stamp: 50 } },
        },
      };

      usageMetering.getUsage.mockResolvedValue(mockUsage);

      const req = { user: { id: 'user-1' } } as any;
      const query = { start: '2026-04-01', end: '2026-04-30' };

      const result = await controller.getUsage(req, query);

      expect(result).toEqual(mockUsage);
      expect(usageMetering.getUsage).toHaveBeenCalledWith(
        'user-1',
        new Date('2026-04-01'),
        new Date('2026-04-30'),
        undefined
      );
    });

    it('should pass service filter when provided', async () => {
      usageMetering.getUsage.mockResolvedValue({
        totalCredits: 0,
        events: [],
        breakdown: {},
      });

      const req = { user: { id: 'user-1' } } as any;
      const query = { service: 'karafiel' };

      await controller.getUsage(req, query);

      expect(usageMetering.getUsage).toHaveBeenCalledWith(
        'user-1',
        undefined,
        undefined,
        'karafiel'
      );
    });
  });
});
