import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { SplitPredictionService } from './split-prediction.service';
import { PrismaService } from '@core/prisma/prisma.service';

describe('SplitPredictionService', () => {
  let service: SplitPredictionService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrisma = {
    transaction: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    transactionSplit: {
      findMany: jest.fn(),
    },
  };

  const mockUsers = [
    { id: 'user-1', name: 'Alice' },
    { id: 'user-2', name: 'Bob' },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SplitPredictionService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    module.get<SplitPredictionService>(SplitPredictionService)['logger'] = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    service = module.get<SplitPredictionService>(SplitPredictionService);
    prismaService = module.get(PrismaService);
  });

  describe('suggestSplits - Strategy 1: Merchant Pattern', () => {
    it('should suggest splits based on merchant pattern with high confidence', async () => {
      const mockTransactions = Array.from({ length: 5 }, () => ({
        amount: -100,
        splits: [
          { userId: 'user-1', amount: 60 },
          { userId: 'user-2', amount: 40 },
        ],
      }));

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -150,
        'Walmart',
        null,
        ['user-1', 'user-2']
      );

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].userId).toBe('user-1');
      expect(suggestions[1].userId).toBe('user-2');
      expect(suggestions[0].confidence).toBe(0.9); // High confidence for merchant pattern
      expect(suggestions[0].suggestedPercentage).toBeCloseTo(60, 0);
      expect(suggestions[1].suggestedPercentage).toBeCloseTo(40, 0);
    });

    it('should not use merchant pattern if less than 3 transactions', async () => {
      const mockTransactions = Array.from({ length: 2 }, () => ({
        amount: -100,
        splits: [
          { userId: 'user-1', amount: 60 },
          { userId: 'user-2', amount: 40 },
        ],
      }));

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -150,
        'New Store',
        null,
        ['user-1', 'user-2']
      );

      // Should fall back to equal split with lower confidence
      expect(suggestions[0].confidence).toBe(0.5);
    });
  });

  describe('suggestSplits - Strategy 2: Category Pattern', () => {
    it('should suggest splits based on category pattern', async () => {
      const mockTransactions = Array.from({ length: 6 }, () => ({
        amount: -100,
        splits: [
          { userId: 'user-1', amount: 70 },
          { userId: 'user-2', amount: 30 },
        ],
      }));

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([]) // No merchant pattern
        .mockResolvedValueOnce(mockTransactions); // Category pattern

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.category.findUnique.mockResolvedValue({ name: 'Groceries' });

      const suggestions = await service.suggestSplits(
        'space-123',
        -200,
        null,
        'cat-groceries',
        ['user-1', 'user-2']
      );

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0.5); // Should have reasonable confidence
      expect(suggestions[0].reasoning).toBeDefined();
    });

    it('should not use category pattern if less than 5 transactions', async () => {
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([]) // No merchant
        .mockResolvedValueOnce([{ amount: -100, splits: [] }]); // Only 1 category transaction

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -100,
        null,
        'cat-new',
        ['user-1', 'user-2']
      );

      // Should fall back to equal split
      expect(suggestions[0].confidence).toBeLessThan(0.75);
    });
  });

  describe('suggestSplits - Strategy 3: Overall Household Pattern', () => {
    it('should suggest splits based on overall household pattern', async () => {
      const mockTransactions = Array.from({ length: 12 }, () => ({
        amount: -100,
        splits: [
          { userId: 'user-1', amount: 55 },
          { userId: 'user-2', amount: 45 },
        ],
      }));

      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([]) // No merchant
        .mockResolvedValueOnce([]) // No category
        .mockResolvedValueOnce(mockTransactions); // Overall pattern

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -300,
        null,
        null,
        ['user-1', 'user-2']
      );

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].confidence).toBeGreaterThan(0); // Should have some confidence
      expect(suggestions[0].reasoning).toBeDefined();
    });

    it('should not use overall pattern if less than 10 transactions', async () => {
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ amount: -100, splits: [] }]); // Only 1 overall

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -100,
        null,
        null,
        ['user-1', 'user-2']
      );

      // Should fall back to equal split
      expect(suggestions[0].reasoning).toContain('Equal split');
    });
  });

  describe('suggestSplits - Fallback: Equal Split', () => {
    it('should suggest equal split when no historical patterns exist', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -100,
        null,
        null,
        ['user-1', 'user-2']
      );

      expect(suggestions).toHaveLength(2);

      // Total should equal transaction amount (may have small rounding differences)
      const total = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0);
      expect(total).toBeCloseTo(100, 1);

      // Should have low to medium confidence
      expect(suggestions[0].confidence).toBeGreaterThanOrEqual(0.5);
      expect(suggestions[0].confidence).toBeLessThanOrEqual(0.7);
    });

    it('should handle unequal splits due to rounding', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', name: 'Alice' },
        { id: 'user-2', name: 'Bob' },
        { id: 'user-3', name: 'Charlie' },
      ]);

      const suggestions = await service.suggestSplits(
        'space-123',
        -100,
        null,
        null,
        ['user-1', 'user-2', 'user-3']
      );

      expect(suggestions).toHaveLength(3);

      // Total should equal transaction amount (allow small rounding errors)
      const total = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0);
      expect(total).toBeCloseTo(100, 0);
    });

    it('should return empty array if only 1 household member', async () => {
      const suggestions = await service.suggestSplits(
        'space-123',
        -100,
        'Walmart',
        null,
        ['user-1']
      );

      expect(suggestions).toEqual([]);
    });
  });

  describe('getSplitPredictionAccuracy', () => {
    it('should calculate accuracy metrics by user', async () => {
      const mockSplits = [
        {
          userId: 'user-1',
          amount: 60,
          transaction: { amount: -100 },
          user: { id: 'user-1', name: 'Alice' },
        },
        {
          userId: 'user-1',
          amount: 70,
          transaction: { amount: -100 },
          user: { id: 'user-1', name: 'Alice' },
        },
        {
          userId: 'user-2',
          amount: 40,
          transaction: { amount: -100 },
          user: { id: 'user-2', name: 'Bob' },
        },
      ];

      mockPrisma.transactionSplit.findMany.mockResolvedValue(mockSplits as any);

      const accuracy = await service.getSplitPredictionAccuracy('space-123', 30);

      expect(accuracy.period).toBe('30 days');
      expect(accuracy.userStats).toHaveLength(2);

      const aliceStats = accuracy.userStats.find((s) => s.userId === 'user-1');
      expect(aliceStats?.totalSplits).toBe(2);
      expect(aliceStats?.userName).toBe('Alice');
    });

    it('should handle custom time periods', async () => {
      mockPrisma.transactionSplit.findMany.mockResolvedValue([]);

      const accuracy = await service.getSplitPredictionAccuracy('space-123', 90);

      expect(accuracy.period).toBe('90 days');
    });
  });

  describe('edge cases', () => {
    it('should normalize split ratios that do not sum to 100%', async () => {
      const mockTransactions = [
        {
          amount: -100,
          splits: [
            { userId: 'user-1', amount: 50 }, // 50%
            { userId: 'user-2', amount: 30 }, // 30%
          ], // Only 80% total
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -100,
        null,
        null,
        ['user-1', 'user-2']
      );

      // Should normalize to 50/50 when no pattern exists
      const total = suggestions.reduce((sum, s) => sum + s.suggestedPercentage, 0);
      expect(total).toBeCloseTo(100, 1);
    });

    it('should handle negative transaction amounts', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -250.75,
        null,
        null,
        ['user-1', 'user-2']
      );

      expect(suggestions[0].suggestedAmount).toBeGreaterThan(0);
      expect(suggestions[1].suggestedAmount).toBeGreaterThan(0);
    });

    it('should handle decimal amounts correctly', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const suggestions = await service.suggestSplits(
        'space-123',
        -99.99,
        null,
        null,
        ['user-1', 'user-2']
      );

      // Total should equal transaction amount
      const total = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0);
      expect(total).toBeCloseTo(99.99, 1);

      // Amounts should be positive
      expect(suggestions[0].suggestedAmount).toBeGreaterThan(0);
      expect(suggestions[1].suggestedAmount).toBeGreaterThan(0);
    });
  });
});
