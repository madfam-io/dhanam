import { Test, TestingModule } from '@nestjs/testing';
import { Currency } from '@dhanam/shared';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { SpacesService } from '../../spaces/spaces.service';
import { FxRatesService } from '../../fx-rates/fx-rates.service';
import { AnalyticsService } from '../analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: jest.Mocked<PrismaService>;
  let spacesService: jest.Mocked<SpacesService>;

  const mockUserId = 'user-123';
  const mockSpaceId = 'space-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            account: {
              findMany: jest.fn(),
            },
            assetValuation: {
              findMany: jest.fn(),
            },
            transaction: {
              aggregate: jest.fn(),
              groupBy: jest.fn(),
            },
            category: {
              findMany: jest.fn(),
            },
            space: {
              findUnique: jest.fn().mockResolvedValue({ currency: 'MXN' }),
            },
            manualAsset: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: SpacesService,
          useValue: {
            verifyUserAccess: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: FxRatesService,
          useValue: {
            convertAmount: jest.fn().mockImplementation((amount: number) => Promise.resolve(amount)),
            getExchangeRate: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    spacesService = module.get(SpacesService) as jest.Mocked<SpacesService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNetWorth', () => {
    it('should calculate net worth correctly', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          name: 'Checking',
          balance: 10000,
          type: 'checking',
          currency: 'MXN',
          assetValuations: [],
        },
        {
          id: 'acc-2',
          name: 'Savings',
          balance: 50000,
          type: 'savings',
          currency: 'MXN',
          assetValuations: [],
        },
        {
          id: 'acc-3',
          name: 'Credit Card',
          balance: -5000,
          type: 'credit',
          currency: 'MXN',
          assetValuations: [],
        },
      ];

      prisma.account.findMany.mockResolvedValue(
        mockAccounts.map((acc) => ({
          ...acc,
          balance: { toNumber: () => acc.balance } as any,
        })) as any
      );

      prisma.assetValuation.findMany.mockResolvedValue([]);

      const result = await service.getNetWorth(mockUserId, mockSpaceId);

      expect(result.totalAssets).toBe(60000); // 10000 + 50000
      expect(result.totalLiabilities).toBe(5000); // |-5000|
      expect(result.netWorth).toBe(55000); // 60000 - 5000
      expect(result.currency).toBe(Currency.MXN);
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(mockUserId, mockSpaceId, 'viewer');
    });

    it('should include historical trend data', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          balance: { toNumber: () => 10000 },
          assetValuations: [],
        },
      ];

      const mockValuations = [
        {
          id: 'val-1',
          accountId: 'acc-1',
          date: new Date('2024-01-01'),
          value: { toNumber: () => 8000 },
        },
        {
          id: 'val-2',
          accountId: 'acc-1',
          date: new Date('2024-01-15'),
          value: { toNumber: () => 9000 },
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockAccounts as any);
      prisma.assetValuation.findMany.mockResolvedValue(mockValuations as any);

      const result = await service.getNetWorth(mockUserId, mockSpaceId);

      expect(result.trend).toHaveLength(2);
      expect(result.trend[0].value).toBe(8000);
      expect(result.trend[1].value).toBe(9000);
    });

    it('should handle accounts with zero balances', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          balance: { toNumber: () => 0 },
          assetValuations: [],
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockAccounts as any);
      prisma.assetValuation.findMany.mockResolvedValue([]);

      const result = await service.getNetWorth(mockUserId, mockSpaceId);

      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(0);
      expect(result.netWorth).toBe(0);
    });
  });

  describe('getCashflowForecast', () => {
    it('should generate 60-day forecast with weekly granularity', async () => {
      const mockLiquidAccounts = [
        {
          id: 'acc-1',
          type: 'checking',
          balance: { toNumber: () => 10000 },
        },
        {
          id: 'acc-2',
          type: 'savings',
          balance: { toNumber: () => 20000 },
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockLiquidAccounts as any);

      // Mock income aggregate
      prisma.transaction.aggregate
        .mockResolvedValueOnce({
          _sum: { amount: { toNumber: () => 36000 } }, // 90 days of income
          _count: 10,
        } as any)
        // Mock expense aggregate
        .mockResolvedValueOnce({
          _sum: { amount: { toNumber: () => -27000 } }, // 90 days of expenses
          _count: 50,
        } as any);

      const result = await service.getCashflowForecast(mockUserId, mockSpaceId, 60);

      // 60 days / 7 = ~9 weeks (rounded up to include all days)
      expect(result.forecast.length).toBeGreaterThan(0);
      expect(result.summary.currentBalance).toBe(30000); // 10000 + 20000

      // Weekly income = 36000 / (90/7) ≈ 2800
      // Weekly expenses = 27000 / (90/7) ≈ 2100
      expect(result.summary.totalIncome).toBeGreaterThan(0);
      expect(result.summary.totalExpenses).toBeGreaterThan(0);
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(mockUserId, mockSpaceId, 'viewer');
    });

    it('should handle custom forecast periods', async () => {
      const mockLiquidAccounts = [
        {
          id: 'acc-1',
          balance: { toNumber: () => 10000 },
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockLiquidAccounts as any);
      prisma.transaction.aggregate
        .mockResolvedValueOnce({
          _sum: { amount: { toNumber: () => 10000 } },
          _count: 5,
        } as any)
        .mockResolvedValueOnce({
          _sum: { amount: { toNumber: () => -8000 } },
          _count: 10,
        } as any);

      const result = await service.getCashflowForecast(mockUserId, mockSpaceId, 30);

      expect(result.forecast.length).toBeGreaterThan(0);
    });

    it('should handle accounts with no transaction history', async () => {
      const mockLiquidAccounts = [
        {
          id: 'acc-1',
          balance: { toNumber: () => 5000 },
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockLiquidAccounts as any);
      prisma.transaction.aggregate
        .mockResolvedValueOnce({
          _sum: { amount: null },
          _count: 0,
        } as any)
        .mockResolvedValueOnce({
          _sum: { amount: null },
          _count: 0,
        } as any);

      const result = await service.getCashflowForecast(mockUserId, mockSpaceId);

      expect(result.summary.currentBalance).toBe(5000);
      expect(result.forecast.length).toBeGreaterThan(0);
    });
  });

  describe('getSpendingByCategory', () => {
    it('should aggregate spending by category', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockTransactions = [
        {
          categoryId: 'cat-1',
          _sum: { amount: { toNumber: () => -5000 } },
          _count: 10,
        },
        {
          categoryId: 'cat-2',
          _sum: { amount: { toNumber: () => -3000 } },
          _count: 5,
        },
      ];

      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Groceries',
          icon: '🛒',
          color: '#FF6B6B',
        },
        {
          id: 'cat-2',
          name: 'Transportation',
          icon: '🚗',
          color: '#4ECDC4',
        },
      ];

      prisma.transaction.groupBy.mockResolvedValue(mockTransactions as any);
      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      const result = await service.getSpendingByCategory(mockUserId, mockSpaceId, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0].categoryName).toBe('Groceries');
      expect(result[0].amount).toBe(5000); // Absolute value
      expect(result[0].transactionCount).toBe(10);
      expect(result[1].categoryName).toBe('Transportation');
      expect(result[1].amount).toBe(3000);
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(mockUserId, mockSpaceId, 'viewer');
    });

    it('should sort categories by amount descending', async () => {
      const mockTransactions = [
        {
          categoryId: 'cat-1',
          _sum: { amount: { toNumber: () => -1000 } },
          _count: 5,
        },
        {
          categoryId: 'cat-2',
          _sum: { amount: { toNumber: () => -5000 } },
          _count: 10,
        },
      ];

      const mockCategories = [
        { id: 'cat-1', name: 'Category 1' },
        { id: 'cat-2', name: 'Category 2' },
      ];

      prisma.transaction.groupBy.mockResolvedValue(mockTransactions as any);
      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      const result = await service.getSpendingByCategory(
        mockUserId,
        mockSpaceId,
        new Date(),
        new Date()
      );

      expect(result[0].amount).toBeGreaterThan(result[1].amount);
    });

    it('should handle uncategorized transactions', async () => {
      const mockTransactions = [
        {
          categoryId: 'cat-1',
          _sum: { amount: { toNumber: () => -1000 } },
          _count: 5,
        },
        {
          categoryId: null,
          _sum: { amount: { toNumber: () => -500 } },
          _count: 2,
        },
      ];

      const mockCategories = [{ id: 'cat-1', name: 'Category 1' }];

      prisma.transaction.groupBy.mockResolvedValue(mockTransactions as any);
      prisma.category.findMany.mockResolvedValue(mockCategories as any);

      const result = await service.getSpendingByCategory(
        mockUserId,
        mockSpaceId,
        new Date(),
        new Date()
      );

      // Should only include categorized transactions
      expect(result).toHaveLength(1);
    });
  });

  describe('getIncomeVsExpenses', () => {
    it('should return monthly income vs expenses', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({
          _sum: { amount: { toNumber: () => 10000 } },
        } as any)
        .mockResolvedValueOnce({
          _sum: { amount: { toNumber: () => -8000 } },
        } as any)
        .mockResolvedValueOnce({
          _sum: { amount: { toNumber: () => 12000 } },
        } as any)
        .mockResolvedValueOnce({
          _sum: { amount: { toNumber: () => -9000 } },
        } as any);

      const result = await service.getIncomeVsExpenses(mockUserId, mockSpaceId, 2);

      expect(result).toHaveLength(2);
      expect(result[0].income).toBe(10000);
      expect(result[0].expenses).toBe(8000);
      expect(result[0].net).toBe(2000); // 10000 - 8000
      expect(result[1].income).toBe(12000);
      expect(result[1].expenses).toBe(9000);
      expect(result[1].net).toBe(3000);
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(mockUserId, mockSpaceId, 'viewer');
    });

    it('should handle months with no data', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({
          _sum: { amount: null },
        } as any)
        .mockResolvedValueOnce({
          _sum: { amount: null },
        } as any);

      const result = await service.getIncomeVsExpenses(mockUserId, mockSpaceId, 1);

      expect(result).toHaveLength(1);
      expect(result[0].income).toBe(0);
      expect(result[0].expenses).toBe(0);
      expect(result[0].net).toBe(0);
    });

    it('should format month correctly', async () => {
      prisma.transaction.aggregate
        .mockResolvedValue({
          _sum: { amount: { toNumber: () => 0 } },
        } as any);

      const result = await service.getIncomeVsExpenses(mockUserId, mockSpaceId, 1);

      // Should be in YYYY-MM format
      expect(result[0].month).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('getAccountBalances', () => {
    it('should return account balances ordered by balance', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          name: 'Savings',
          type: 'savings',
          balance: { toNumber: () => 50000 },
          currency: 'MXN',
          lastSyncedAt: new Date('2024-01-01'),
        },
        {
          id: 'acc-2',
          name: 'Checking',
          type: 'checking',
          balance: { toNumber: () => 10000 },
          currency: 'MXN',
          lastSyncedAt: new Date('2024-01-02'),
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockAccounts as any);

      const result = await service.getAccountBalances(mockUserId, mockSpaceId);

      expect(result).toHaveLength(2);
      expect(result[0].accountName).toBe('Savings');
      expect(result[0].balance).toBe(50000);
      expect(result[0].currency).toBe(Currency.MXN);
      expect(result[1].accountName).toBe('Checking');
      expect(result[1].balance).toBe(10000);
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(mockUserId, mockSpaceId, 'viewer');
    });

    it('should handle accounts without last sync date', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          name: 'Cash',
          type: 'cash',
          balance: { toNumber: () => 1000 },
          currency: 'MXN',
          lastSyncedAt: null,
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockAccounts as any);

      const result = await service.getAccountBalances(mockUserId, mockSpaceId);

      expect(result[0].lastSynced).toBeUndefined();
    });
  });

  describe('access control', () => {
    it('should verify user access for all methods', async () => {
      prisma.account.findMany.mockResolvedValue([]);
      prisma.assetValuation.findMany.mockResolvedValue([]);
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: 0,
      } as any);
      prisma.transaction.groupBy.mockResolvedValue([]);
      prisma.category.findMany.mockResolvedValue([]);

      await service.getNetWorth(mockUserId, mockSpaceId);
      await service.getCashflowForecast(mockUserId, mockSpaceId);
      await service.getSpendingByCategory(mockUserId, mockSpaceId, new Date(), new Date());
      await service.getIncomeVsExpenses(mockUserId, mockSpaceId);
      await service.getAccountBalances(mockUserId, mockSpaceId);

      expect(spacesService.verifyUserAccess).toHaveBeenCalledTimes(5);
    });
  });
});
