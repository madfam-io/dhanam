import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { SpacesService } from '../../spaces/spaces.service';
import { NaturalLanguageService, ParsedQuery } from '../natural-language.service';

describe('NaturalLanguageService', () => {
  let service: NaturalLanguageService;
  let prisma: jest.Mocked<PrismaService>;
  let spacesService: jest.Mocked<SpacesService>;

  beforeEach(async () => {
    const mockPrisma = {
      transaction: {
        aggregate: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockSpacesService = {
      verifyUserAccess: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NaturalLanguageService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SpacesService, useValue: mockSpacesService },
      ],
    }).compile();

    service = module.get<NaturalLanguageService>(NaturalLanguageService);
    prisma = module.get(PrismaService);
    spacesService = module.get(SpacesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseQuery - intent detection', () => {
    it('should detect sum_spending intent for "how much did I spend"', () => {
      const result = service.parseQuery('how much did I spend this month');
      expect(result.intent).toBe('sum_spending');
    });

    it('should detect sum_spending intent for "total spending"', () => {
      const result = service.parseQuery('total spending on food');
      expect(result.intent).toBe('sum_spending');
    });

    it('should detect count_transactions intent for "how many"', () => {
      const result = service.parseQuery('how many transactions this week');
      expect(result.intent).toBe('count_transactions');
    });

    it('should detect find_largest intent for "biggest expenses"', () => {
      const result = service.parseQuery('show me my biggest expenses');
      expect(result.intent).toBe('find_largest');
    });

    it('should detect find_largest intent for "most expensive"', () => {
      const result = service.parseQuery('most expensive purchases this month');
      expect(result.intent).toBe('find_largest');
    });

    it('should detect category_breakdown intent for "breakdown by category"', () => {
      const result = service.parseQuery('spending breakdown by category');
      expect(result.intent).toBe('category_breakdown');
    });

    it('should detect find_merchants intent for "merchants"', () => {
      const result = service.parseQuery('which merchants did I use');
      expect(result.intent).toBe('find_merchants');
    });

    it('should detect find_merchants intent for "where"', () => {
      const result = service.parseQuery('where did I spend money');
      expect(result.intent).toBe('find_merchants');
    });

    it('should detect compare_periods intent for "compare"', () => {
      const result = service.parseQuery('compare this month to last month');
      expect(result.intent).toBe('compare_periods');
    });

    it('should default to search_transactions for generic queries', () => {
      const result = service.parseQuery('netflix transactions');
      expect(result.intent).toBe('search_transactions');
    });
  });

  describe('parseQuery - time range extraction', () => {
    it('should parse "today"', () => {
      const result = service.parseQuery('transactions today');
      expect(result.timeRange.period).toBe('day');
      expect(result.timeRange.periodLabel).toBe('today');
    });

    it('should parse "yesterday"', () => {
      const result = service.parseQuery('spending yesterday');
      expect(result.timeRange.period).toBe('day');
      expect(result.timeRange.periodLabel).toBe('yesterday');
    });

    it('should parse "this week"', () => {
      const result = service.parseQuery('transactions this week');
      expect(result.timeRange.period).toBe('week');
      expect(result.timeRange.periodLabel).toBe('this week');
    });

    it('should parse "last week"', () => {
      const result = service.parseQuery('spending last week');
      expect(result.timeRange.period).toBe('week');
      expect(result.timeRange.periodLabel).toBe('last week');
    });

    it('should parse "this month"', () => {
      const result = service.parseQuery('how much this month');
      expect(result.timeRange.period).toBe('month');
      expect(result.timeRange.periodLabel).toBe('this month');
    });

    it('should parse "last month"', () => {
      const result = service.parseQuery('spending last month');
      expect(result.timeRange.period).toBe('month');
      expect(result.timeRange.periodLabel).toBe('last month');
    });

    it('should parse "this year"', () => {
      const result = service.parseQuery('total spending this year');
      expect(result.timeRange.period).toBe('year');
      expect(result.timeRange.periodLabel).toBe('this year');
    });

    it('should parse "last year"', () => {
      const result = service.parseQuery('expenses last year');
      expect(result.timeRange.period).toBe('year');
      expect(result.timeRange.periodLabel).toBe('last year');
    });

    it('should parse "last N days"', () => {
      const result = service.parseQuery('transactions last 7 days');
      expect(result.timeRange.period).toBe('day');
      expect(result.timeRange.periodLabel).toBe('last 7 days');
    });

    it('should parse "last N months"', () => {
      const result = service.parseQuery('spending last 3 months');
      expect(result.timeRange.period).toBe('month');
      expect(result.timeRange.periodLabel).toBe('last 3 months');
    });

    it('should parse "in January"', () => {
      const result = service.parseQuery('spending in january');
      expect(result.timeRange.period).toBe('month');
      expect(result.timeRange.periodLabel).toMatch(/January/);
    });

    it('should default to last 30 days when no time range specified', () => {
      const result = service.parseQuery('find netflix');
      expect(result.timeRange.periodLabel).toBe('last 30 days');
    });
  });

  describe('parseQuery - filter extraction', () => {
    it('should detect expense type for "spent"', () => {
      const result = service.parseQuery('how much I spent');
      expect(result.filters.transactionType).toBe('expense');
    });

    it('should detect expense type for "expenses"', () => {
      const result = service.parseQuery('show me expenses');
      expect(result.filters.transactionType).toBe('expense');
    });

    it('should detect income type for "earned"', () => {
      const result = service.parseQuery('how much I earned');
      expect(result.filters.transactionType).toBe('income');
    });

    it('should default to "all" transaction type', () => {
      const result = service.parseQuery('show me transactions');
      expect(result.filters.transactionType).toBe('all');
    });

    it('should extract minAmount for "over $100"', () => {
      const result = service.parseQuery('transactions over $100');
      expect(result.filters.minAmount).toBe(100);
    });

    it('should extract minAmount for "more than $500"', () => {
      const result = service.parseQuery('expenses more than $500');
      expect(result.filters.minAmount).toBe(500);
    });

    it('should extract maxAmount for "under $50"', () => {
      const result = service.parseQuery('transactions under $50');
      expect(result.filters.maxAmount).toBe(50);
    });

    it('should extract maxAmount for "less than $25"', () => {
      const result = service.parseQuery('purchases less than $25');
      expect(result.filters.maxAmount).toBe(25);
    });

    it('should extract both amounts for "between $10 and $50"', () => {
      const result = service.parseQuery('transactions between $10 and $50');
      expect(result.filters.minAmount).toBe(10);
      expect(result.filters.maxAmount).toBe(50);
    });

    it('should handle comma-separated amounts like $1,000', () => {
      const result = service.parseQuery('transactions over $1,000');
      expect(result.filters.minAmount).toBe(1000);
    });

    it('should detect Food & Dining category', () => {
      const result = service.parseQuery('spending on food');
      expect(result.filters.category).toBe('Food & Dining');
    });

    it('should detect Transportation category', () => {
      const result = service.parseQuery('how much on uber this month');
      expect(result.filters.category).toBe('Transportation');
    });

    it('should detect Shopping category', () => {
      const result = service.parseQuery('amazon purchases');
      expect(result.filters.category).toBe('Shopping');
    });

    it('should detect quoted merchant name', () => {
      const result = service.parseQuery('transactions at "Taco Bell"');
      expect(result.filters.merchant).toBe('taco bell');
    });

    it('should detect known merchant names', () => {
      const result = service.parseQuery('how much at starbucks');
      expect(result.filters.merchant).toBe('starbucks');
    });

    it('should extract keywords when no category/merchant matched', () => {
      const result = service.parseQuery('pharmacy purchases');
      expect(result.filters.category).toBe('Health');
    });
  });

  describe('parseQuery - aggregation extraction', () => {
    it('should extract sum aggregation for "total"', () => {
      const result = service.parseQuery('total spending');
      expect(result.aggregation).toBe('sum');
    });

    it('should extract count aggregation for "how many"', () => {
      const result = service.parseQuery('how many transactions');
      expect(result.aggregation).toBe('count');
    });

    it('should extract average aggregation', () => {
      const result = service.parseQuery('average transaction amount');
      expect(result.aggregation).toBe('average');
    });

    it('should extract max aggregation for "biggest"', () => {
      const result = service.parseQuery('biggest expense');
      expect(result.aggregation).toBe('max');
    });

    it('should extract min aggregation for "smallest"', () => {
      const result = service.parseQuery('smallest transaction');
      expect(result.aggregation).toBe('min');
    });
  });

  describe('parseQuery - sorting extraction', () => {
    it('should sort by amount desc for "biggest"', () => {
      const result = service.parseQuery('biggest expenses');
      expect(result.sortBy).toBe('amount');
      expect(result.sortOrder).toBe('desc');
    });

    it('should sort by amount asc for "smallest"', () => {
      const result = service.parseQuery('smallest purchases');
      expect(result.sortBy).toBe('amount');
      expect(result.sortOrder).toBe('asc');
    });

    it('should sort by date desc for "recent"', () => {
      const result = service.parseQuery('recent transactions');
      expect(result.sortBy).toBe('date');
      expect(result.sortOrder).toBe('desc');
    });

    it('should extract explicit limit from "top 5"', () => {
      const result = service.parseQuery('top 5 expenses');
      expect(result.limit).toBe(5);
    });
  });

  describe('parseQuery - confidence scoring', () => {
    it('should have base confidence of 0.5 for vague queries', () => {
      const result = service.parseQuery('stuff');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should boost confidence for specific intents', () => {
      const result = service.parseQuery('how much did I spend this month on food');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should cap confidence at 0.95', () => {
      const result = service.parseQuery('how much did I spend this month on food over $100');
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });

    it('should preserve the original query string', () => {
      const query = 'How Much Did I Spend?';
      const result = service.parseQuery(query);
      expect(result.originalQuery).toBe(query);
    });
  });

  describe('search', () => {
    it('should verify user access before executing query', async () => {
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: -150 },
        _count: 3,
      } as any);

      await service.search('space-123', 'user-123', 'how much this month');

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'viewer');
    });

    it('should return search result with parsed query', async () => {
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: -250 },
        _count: 5,
      } as any);

      const result = await service.search('space-123', 'user-123', 'how much this month');

      expect(result.query.intent).toBe('sum_spending');
      expect(result.answer).toContain('$250.00');
      expect(result.data.total).toBe(250);
    });

    it('should return suggestions for follow-up queries', async () => {
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: -100 },
        _count: 2,
      } as any);

      const result = await service.search('space-123', 'user-123', 'total spending this month');

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions!.length).toBeLessThanOrEqual(3);
    });

    it('should execute count query for "how many" intent', async () => {
      prisma.transaction.count.mockResolvedValue(15);

      const result = await service.search('space-123', 'user-123', 'how many transactions this week');

      expect(result.query.intent).toBe('count_transactions');
      expect(result.data.count).toBe(15);
      expect(result.answer).toContain('15');
    });

    it('should execute find largest query', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        {
          id: '1',
          date: new Date(),
          amount: -500,
          merchant: 'Amazon',
          description: 'Order #123',
          currency: 'USD',
          category: { name: 'Shopping' },
        },
      ] as any);

      const result = await service.search('space-123', 'user-123', 'biggest expense this month');

      expect(result.query.intent).toBe('find_largest');
      expect(result.data.transactions).toBeDefined();
    });

    it('should execute transaction search for generic queries', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      const result = await service.search('space-123', 'user-123', 'netflix');

      expect(result.query.intent).toBe('search_transactions');
    });

    it('should execute category breakdown query', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        { amount: -50, category: { name: 'Food' } },
        { amount: -30, category: { name: 'Transport' } },
      ] as any);

      const result = await service.search('space-123', 'user-123', 'spending breakdown by category');

      expect(result.query.intent).toBe('category_breakdown');
      expect(result.data.breakdown).toBeDefined();
    });

    it('should execute merchants query', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        { amount: -25, merchant: 'Starbucks', date: new Date() },
        { amount: -50, merchant: 'Amazon', date: new Date() },
      ] as any);

      const result = await service.search('space-123', 'user-123', 'which merchants this month');

      expect(result.query.intent).toBe('find_merchants');
      expect(result.data.merchants).toBeDefined();
    });
  });

  describe('getSuggestions', () => {
    it('should verify user access', async () => {
      await service.getSuggestions('space-123', 'user-123', '');

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'viewer');
    });

    it('should return default suggestions for empty query', async () => {
      const result = await service.getSuggestions('space-123', 'user-123', '');

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should filter suggestions based on partial query', async () => {
      const result = await service.getSuggestions('space-123', 'user-123', 'food');

      expect(result.length).toBeGreaterThanOrEqual(0);
      result.forEach((s) => {
        expect(s.toLowerCase()).toContain('food');
      });
    });
  });
});
