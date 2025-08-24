import { Test, TestingModule } from '@nestjs/testing';
import { RulesService } from './rules.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Transaction, Category } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('RulesService', () => {
  let service: RulesService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockTransaction: Transaction = {
    id: 'tx1',
    accountId: 'acc1',
    providerTransactionId: 'provider-tx1',
    amount: new Decimal(-50.00),
    currency: 'USD',
    description: 'Starbucks Coffee',
    merchant: 'Starbucks',
    categoryId: null,
    date: new Date(),
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      budgetId: 'budget1',
      name: 'Dining',
      type: 'expense',
      limit: new Decimal(500),
      spent: new Decimal(100),
      currency: 'USD',
      period: 'monthly',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockRules = [
    {
      id: 'rule1',
      categoryId: 'cat1',
      name: 'Coffee Shops',
      priority: 100,
      enabled: true,
      conditions: [
        {
          field: 'merchant',
          operator: 'contains',
          value: 'starbucks',
          caseInsensitive: true,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<RulesService>(RulesService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRule', () => {
    it('should create a categorization rule', async () => {
      const mockCreatedRule = { ...mockRules[0] };
      prisma.categoryRule.create.mockResolvedValue(mockCreatedRule as any);

      const result = await service.createRule(
        'space1',
        'cat1',
        'Coffee Shops',
        [
          {
            field: 'merchant',
            operator: 'contains',
            value: 'starbucks',
            caseInsensitive: true,
          },
        ],
        100
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Coffee Shops');
      expect(result.categoryId).toBe('cat1');
    });
  });

  describe('categorizeTransaction', () => {
    it('should categorize transaction using matching rule', async () => {
      prisma.categoryRule.findMany.mockResolvedValue(mockRules as any);

      const result = await service.categorizeTransaction(mockTransaction);
      
      expect(result).toBe('cat1');
    });

    it('should return null for transaction with no matching rules', async () => {
      const nonMatchingTransaction = {
        ...mockTransaction,
        merchant: 'Random Store',
        description: 'Random Purchase',
      };

      prisma.categoryRule.findMany.mockResolvedValue(mockRules as any);

      const result = await service.categorizeTransaction(nonMatchingTransaction);
      
      expect(result).toBeNull();
    });

    it('should handle amount-based rules', async () => {
      const amountRule = {
        ...mockRules[0],
        conditions: [
          {
            field: 'amount',
            operator: 'greaterThan',
            value: 100,
          },
        ],
      };

      const expensiveTransaction = {
        ...mockTransaction,
        amount: new Decimal(-150.00),
      };

      prisma.categoryRule.findMany.mockResolvedValue([amountRule] as any);

      const result = await service.categorizeTransaction(expensiveTransaction);
      
      expect(result).toBe('cat1');
    });
  });

  describe('batchCategorizeTransactions', () => {
    it('should categorize multiple transactions', async () => {
      const mockTransactions = [mockTransaction];
      
      prisma.transaction.findMany.mockResolvedValue(mockTransactions);
      prisma.categoryRule.findMany.mockResolvedValue(mockRules as any);
      prisma.transaction.update.mockResolvedValue(mockTransaction);

      const result = await service.batchCategorizeTransactions('space1');
      
      expect(result).toBeDefined();
      expect(result.categorized).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('categorizeSpecificTransactions', () => {
    it('should categorize specific transactions by ID', async () => {
      const mockTransactions = [mockTransaction];
      
      prisma.transaction.findMany.mockResolvedValue(mockTransactions);
      prisma.categoryRule.findMany.mockResolvedValue(mockRules as any);
      prisma.transaction.update.mockResolvedValue(mockTransaction);

      const result = await service.categorizeSpecificTransactions('space1', ['tx1']);
      
      expect(result).toBeDefined();
      expect(result.categorized).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('testRule', () => {
    it('should test rule against transactions', async () => {
      const mockTransactions = [mockTransaction];
      
      prisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.testRule('space1', {
        conditions: [
          {
            field: 'merchant',
            operator: 'contains',
            value: 'starbucks',
            caseInsensitive: true,
          },
        ],
      } as any);
      
      expect(result).toBeDefined();
      expect(result.matches).toBe(1);
      expect(result.total).toBe(1);
      expect(result.sampleTransactions).toHaveLength(1);
    });
  });

  describe('createCommonRules', () => {
    it('should create common categorization rules', async () => {
      prisma.category.findMany.mockResolvedValue(mockCategories);
      prisma.categoryRule.create.mockResolvedValue(mockRules[0] as any);

      const result = await service.createCommonRules('space1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});