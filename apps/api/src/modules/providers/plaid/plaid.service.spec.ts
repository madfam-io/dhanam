import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { PlaidService } from './plaid.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { CryptoService } from '@core/crypto/crypto.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock Plaid
jest.mock('plaid', () => ({
  PlaidApi: jest.fn().mockImplementation(() => ({
    linkTokenCreate: jest.fn(),
    itemPublicTokenExchange: jest.fn(),
    accountsGet: jest.fn(),
    transactionsSync: jest.fn(),
    liabilitiesGet: jest.fn(),
  })),
  Configuration: jest.fn(),
  PlaidEnvironments: {
    sandbox: 'https://sandbox.plaid.com',
    development: 'https://development.plaid.com',
    production: 'https://production.plaid.com',
  },
  CountryCode: { Us: 'US' },
  Products: { Transactions: 'transactions', Auth: 'auth', Liabilities: 'liabilities' },
  DepositoryAccountSubtype: { Checking: 'checking', Savings: 'savings' },
  CreditAccountSubtype: { CreditCard: 'credit_card' },
  LoanAccountSubtype: {
    Auto: 'auto',
    Student: 'student',
    Mortgage: 'mortgage',
    Consumer: 'consumer',
    HomeEquity: 'home_equity',
    LineOfCredit: 'line_of_credit',
  },
}));

describe('PlaidService', () => {
  let service: PlaidService;
  let prisma: DeepMockProxy<PrismaService>;
  let cryptoService: DeepMockProxy<CryptoService>;
  let configService: DeepMockProxy<ConfigService>;

  // Config mock must be created before module compilation
  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'PLAID_CLIENT_ID':
          return 'test-client-id';
        case 'PLAID_SECRET':
          return 'test-secret';
        case 'PLAID_ENV':
          return 'sandbox';
        case 'PLAID_WEBHOOK_URL':
          return 'https://api.example.com/webhooks/plaid';
        case 'PLAID_WEBHOOK_SECRET':
          return 'webhook-secret';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaidService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: CryptoService,
          useValue: mockDeep<CryptoService>(),
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PlaidService>(PlaidService);
    prisma = module.get(PrismaService);
    cryptoService = module.get(CryptoService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLinkToken', () => {
    it('should create link token', async () => {
      const mockResponse = {
        data: {
          link_token: 'link-token-123',
          expiration: '2024-12-31T23:59:59Z',
        },
      };

      const mockLinkTokenCreate = jest.fn().mockResolvedValue(mockResponse);

      // Set mock BEFORE calling method - override the plaidClient entirely
      (service as any).plaidClient = {
        linkTokenCreate: mockLinkTokenCreate,
      };

      const result = await service.createLinkToken('user1');

      expect(mockLinkTokenCreate).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.linkToken).toBe('link-token-123');
      expect(result.expiration).toBeInstanceOf(Date);
    });

    it('should throw error when Plaid not configured', async () => {
      (service as any).plaidClient = null;

      await expect(service.createLinkToken('user1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('syncTransactions', () => {
    it('should sync transactions successfully', async () => {
      const mockResponse = {
        data: {
          added: [
            {
              transaction_id: 'tx1',
              account_id: 'acc1',
              amount: 100,
              name: 'Test Transaction',
              date: '2024-01-01',
            },
          ],
          modified: [],
          removed: [],
          next_cursor: 'cursor-123',
        },
      };

      (service as any).plaidClient = {
        transactionsSync: jest.fn().mockResolvedValue(mockResponse),
      };

      prisma.account.findFirst.mockResolvedValue({
        id: 'account1',
        currency: 'USD',
      } as any);

      prisma.providerConnection.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.syncTransactions('access-token', 'item-id');
      
      expect(result).toBeDefined();
      expect(result.transactionCount).toBe(1);
      expect(result.nextCursor).toBe('cursor-123');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = '{"test":"data"}';
      const secret = 'webhook-secret';
      
      // Calculate expected signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      configService.get.mockImplementation((key: string) => {
        if (key === 'PLAID_WEBHOOK_SECRET') return secret;
        return undefined;
      });

      const result = (service as any).verifyWebhookSignature(payload, expectedSignature);
      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = '{"test":"data"}';
      // Use a valid hex string of same length as SHA256 signature (64 chars) but wrong value
      const invalidSignature = 'a'.repeat(64);

      const result = (service as any).verifyWebhookSignature(payload, invalidSignature);
      expect(result).toBe(false);
    });
  });

  describe('mapAccountType', () => {
    it('should map account types correctly', () => {
      expect((service as any).mapAccountType('depository')).toBe('checking');
      expect((service as any).mapAccountType('credit')).toBe('credit');
      expect((service as any).mapAccountType('investment')).toBe('investment');
      expect((service as any).mapAccountType('unknown')).toBe('other');
    });
  });

  describe('mapCurrency', () => {
    it('should map currencies correctly', () => {
      expect((service as any).mapCurrency('USD')).toBe('USD');
      expect((service as any).mapCurrency('MXN')).toBe('MXN');
      expect((service as any).mapCurrency('EUR')).toBe('EUR');
      expect((service as any).mapCurrency('UNKNOWN')).toBe('USD'); // Default for Plaid
    });
  });
});