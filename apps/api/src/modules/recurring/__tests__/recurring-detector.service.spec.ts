import { Test, TestingModule } from '@nestjs/testing';
import { RecurrenceFrequency, Currency } from '@db';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { RecurringDetectorService } from '../recurring-detector.service';

describe('RecurringDetectorService', () => {
  let service: RecurringDetectorService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      transaction: {
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      recurringTransaction: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringDetectorService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RecurringDetectorService>(RecurringDetectorService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectPatterns', () => {
    it('should detect monthly recurring patterns', async () => {
      const now = new Date();
      const transactions = [
        {
          id: '1',
          date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          amount: -50.0,
          merchant: 'Netflix',
          description: 'Netflix Subscription',
          currency: Currency.USD,
          recurringId: null,
        },
        {
          id: '2',
          date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          amount: -50.0,
          merchant: 'Netflix',
          description: 'Netflix Subscription',
          currency: Currency.USD,
          recurringId: null,
        },
        {
          id: '3',
          date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          amount: -50.0,
          merchant: 'Netflix',
          description: 'Netflix Subscription',
          currency: Currency.USD,
          recurringId: null,
        },
        {
          id: '4',
          date: now,
          amount: -50.0,
          merchant: 'Netflix',
          description: 'Netflix Subscription',
          currency: Currency.USD,
          recurringId: null,
        },
      ];

      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      (prismaService.recurringTransaction.findMany as jest.Mock).mockResolvedValue([]);

      const patterns = await service.detectPatterns('space-1');

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toMatchObject({
        merchantName: 'Netflix',
        suggestedFrequency: 'monthly',
        averageAmount: 50.0,
        occurrenceCount: 4,
      });
      expect(patterns[0].confidence).toBeGreaterThanOrEqual(0.6);
    });

    it('should detect weekly recurring patterns', async () => {
      const now = new Date();
      const transactions = [];

      // Create weekly transactions for the last 6 weeks
      for (let i = 0; i < 6; i++) {
        transactions.push({
          id: `${i}`,
          date: new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000),
          amount: -25.0,
          merchant: 'Weekly Groceries',
          description: 'Weekly Groceries Store',
          currency: Currency.MXN,
          recurringId: null,
        });
      }

      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      (prismaService.recurringTransaction.findMany as jest.Mock).mockResolvedValue([]);

      const patterns = await service.detectPatterns('space-1');

      expect(patterns).toHaveLength(1);
      expect(patterns[0].suggestedFrequency).toBe('weekly');
    });

    it('should not detect patterns with high amount variance', async () => {
      const now = new Date();
      const transactions = [
        {
          id: '1',
          date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          amount: -10.0,
          merchant: 'Variable Shop',
          description: 'Variable Shop Purchase',
          currency: Currency.USD,
          recurringId: null,
        },
        {
          id: '2',
          date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          amount: -100.0,
          merchant: 'Variable Shop',
          description: 'Variable Shop Purchase',
          currency: Currency.USD,
          recurringId: null,
        },
        {
          id: '3',
          date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          amount: -50.0,
          merchant: 'Variable Shop',
          description: 'Variable Shop Purchase',
          currency: Currency.USD,
          recurringId: null,
        },
      ];

      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      (prismaService.recurringTransaction.findMany as jest.Mock).mockResolvedValue([]);

      const patterns = await service.detectPatterns('space-1');

      // High variance should result in no pattern detected
      expect(patterns).toHaveLength(0);
    });

    it('should not detect patterns with less than 3 occurrences', async () => {
      const now = new Date();
      const transactions = [
        {
          id: '1',
          date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          amount: -50.0,
          merchant: 'Rare Merchant',
          description: 'Rare Merchant Purchase',
          currency: Currency.USD,
          recurringId: null,
        },
        {
          id: '2',
          date: now,
          amount: -50.0,
          merchant: 'Rare Merchant',
          description: 'Rare Merchant Purchase',
          currency: Currency.USD,
          recurringId: null,
        },
      ];

      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      (prismaService.recurringTransaction.findMany as jest.Mock).mockResolvedValue([]);

      const patterns = await service.detectPatterns('space-1');

      expect(patterns).toHaveLength(0);
    });

    it('should skip already tracked merchants', async () => {
      const now = new Date();
      const transactions = [
        {
          id: '1',
          date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          amount: -50.0,
          merchant: 'Already Tracked',
          description: 'Already Tracked Service',
          currency: Currency.USD,
          recurringId: null,
        },
        {
          id: '2',
          date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          amount: -50.0,
          merchant: 'Already Tracked',
          description: 'Already Tracked Service',
          currency: Currency.USD,
          recurringId: null,
        },
        {
          id: '3',
          date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          amount: -50.0,
          merchant: 'Already Tracked',
          description: 'Already Tracked Service',
          currency: Currency.USD,
          recurringId: null,
        },
      ];

      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(transactions);
      (prismaService.recurringTransaction.findMany as jest.Mock).mockResolvedValue([
        { merchantName: 'Already Tracked' },
      ]);

      const patterns = await service.detectPatterns('space-1');

      expect(patterns).toHaveLength(0);
    });
  });

  describe('calculateNextExpected', () => {
    it('should calculate next expected date for monthly frequency', () => {
      const lastOccurrence = new Date('2025-01-15');
      const next = service.calculateNextExpected(lastOccurrence, 'monthly');

      expect(next.getTime()).toBeGreaterThan(lastOccurrence.getTime());
      const daysDiff = Math.round((next.getTime() - lastOccurrence.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);
    });

    it('should calculate next expected date for weekly frequency', () => {
      const lastOccurrence = new Date('2025-01-15');
      const next = service.calculateNextExpected(lastOccurrence, 'weekly');

      const daysDiff = Math.round((next.getTime() - lastOccurrence.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it('should calculate next expected date for yearly frequency', () => {
      const lastOccurrence = new Date('2025-01-15');
      const next = service.calculateNextExpected(lastOccurrence, 'yearly');

      const daysDiff = Math.round((next.getTime() - lastOccurrence.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(365);
    });
  });
});
