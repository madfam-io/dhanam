import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { BelvoService } from './belvo.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { CryptoService } from '@core/crypto/crypto.service';
import { AuditService } from '@core/audit/audit.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock Belvo
jest.mock('belvo', () => ({
  default: jest.fn().mockImplementation(() => ({
    links: {
      register: jest.fn(),
      delete: jest.fn(),
    },
    accounts: {
      retrieve: jest.fn(),
    },
    transactions: {
      retrieve: jest.fn(),
    },
  })),
}));

describe('BelvoService', () => {
  let service: BelvoService;
  let prisma: DeepMockProxy<PrismaService>;
  let cryptoService: DeepMockProxy<CryptoService>;
  let auditService: DeepMockProxy<AuditService>;
  let configService: DeepMockProxy<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BelvoService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: CryptoService,
          useValue: mockDeep<CryptoService>(),
        },
        {
          provide: AuditService,
          useValue: mockDeep<AuditService>(),
        },
        {
          provide: ConfigService,
          useValue: mockDeep<ConfigService>(),
        },
      ],
    }).compile();

    service = module.get<BelvoService>(BelvoService);
    prisma = module.get(PrismaService);
    cryptoService = module.get(CryptoService);
    auditService = module.get(AuditService);
    configService = module.get(ConfigService);

    // Mock config values
    configService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'BELVO_SECRET_KEY_ID':
          return 'test-key-id';
        case 'BELVO_SECRET_KEY_PASSWORD':
          return 'test-key-password';
        case 'BELVO_ENV':
          return 'sandbox';
        default:
          return undefined;
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLink', () => {
    it('should throw error when Belvo not configured', async () => {
      // Create service without credentials
      configService.get.mockReturnValue(undefined);
      
      const testService = new BelvoService(
        configService,
        prisma,
        cryptoService,
        auditService,
      );

      await expect(
        testService.createLink('space1', 'user1', {
          institution: 'banamex',
          username: 'test',
          password: 'test',
          externalId: 'ext1',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('syncTransactions', () => {
    it('should handle job processor signature', async () => {
      const mockConnection = {
        id: 'conn1',
        userId: 'user1',
        user: {
          userSpaces: [{
            space: { id: 'space1' }
          }]
        }
      };

      prisma.providerConnection.findFirst.mockResolvedValue(mockConnection as any);

      const result = await service.syncTransactions('access-token', 'link-id', '2024-01-01');
      
      expect(result).toHaveProperty('transactionCount');
      expect(result).toHaveProperty('accountCount');
      expect(result).toHaveProperty('nextCursor');
    });

    it('should handle original signature', async () => {
      const result = await service.syncTransactions('space1', 'user1', 'link1');
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('mapBelvoAccountType', () => {
    it('should map account types correctly', () => {
      const service = new BelvoService(
        configService,
        prisma,
        cryptoService,
        auditService,
      );

      expect((service as any).mapBelvoAccountType('CHECKING_ACCOUNT')).toBe('checking');
      expect((service as any).mapBelvoAccountType('CREDIT_CARD')).toBe('credit');
      expect((service as any).mapBelvoAccountType('SAVINGS_ACCOUNT')).toBe('savings');
      expect((service as any).mapBelvoAccountType('UNKNOWN_TYPE')).toBe('other');
    });
  });

  describe('mapCurrency', () => {
    it('should map currencies correctly', () => {
      const service = new BelvoService(
        configService,
        prisma,
        cryptoService,
        auditService,
      );

      expect((service as any).mapCurrency('MXN')).toBe('MXN');
      expect((service as any).mapCurrency('USD')).toBe('USD');
      expect((service as any).mapCurrency('EUR')).toBe('EUR');
      expect((service as any).mapCurrency('UNKNOWN')).toBe('MXN'); // Default for Belvo
    });
  });
});