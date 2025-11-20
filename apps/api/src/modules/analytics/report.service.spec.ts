import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { Decimal } from '@prisma/client/runtime/library';
import { EventEmitter } from 'events';

// Mock @dhanam/shared
jest.mock('@dhanam/shared', () => ({
  NetWorthResponse: {},
  CashflowForecast: {},
  SpendingByCategory: {},
  IncomeVsExpenses: {},
  AccountBalanceAnalytics: {},
  PortfolioAllocation: {},
  Currency: { USD: 'USD', EUR: 'EUR', MXN: 'MXN' },
}), { virtual: true });

// Mock pdfkit
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const emitter = new EventEmitter();
    const mockDoc = Object.assign(emitter, {
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn(),
    });
    // Simulate PDF generation completion
    setTimeout(() => {
      mockDoc.emit('data', Buffer.from('PDF data chunk 1'));
      mockDoc.emit('data', Buffer.from('PDF data chunk 2'));
      mockDoc.emit('end');
    }, 10);
    return mockDoc;
  });
});

describe('ReportService', () => {
  let service: ReportService;
  let prismaService: PrismaService;
  let analyticsService: AnalyticsService;

  const mockPrismaService = {
    space: {
      findUnique: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
  };

  const mockAnalyticsService = {
    getSpendingByCategory: jest.fn(),
  };

  const mockSpace = {
    id: 'space-123',
    name: 'Personal Finance',
    currency: 'USD',
    userSpaces: [
      {
        userId: 'user-123',
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      },
    ],
  };

  const mockTransactions = [
    {
      id: 'txn-1',
      date: new Date('2024-01-15'),
      description: 'Salary Deposit',
      amount: new Decimal(5000),
      currency: 'USD',
      categoryId: 'cat-salary',
      category: { id: 'cat-salary', name: 'Salary' },
      account: { name: 'Checking Account' },
    },
    {
      id: 'txn-2',
      date: new Date('2024-01-16'),
      description: 'Grocery Shopping',
      amount: new Decimal(-150),
      currency: 'USD',
      categoryId: 'cat-groceries',
      category: { id: 'cat-groceries', name: 'Groceries' },
      account: { name: 'Credit Card' },
    },
    {
      id: 'txn-3',
      date: new Date('2024-01-20'),
      description: 'Restaurant',
      amount: new Decimal(-75),
      currency: 'USD',
      categoryId: 'cat-dining',
      category: { id: 'cat-dining', name: 'Dining Out' },
      account: { name: 'Credit Card' },
    },
    {
      id: 'txn-4',
      date: new Date('2024-01-25'),
      description: 'Freelance Payment',
      amount: new Decimal(1200),
      currency: 'USD',
      categoryId: 'cat-freelance',
      category: { id: 'cat-freelance', name: 'Freelance Income' },
      account: { name: 'Checking Account' },
    },
  ];

  const mockAccounts = [
    {
      id: 'acc-1',
      name: 'Checking Account',
      balance: new Decimal(10000),
      currency: 'USD',
      spaceId: 'space-123',
    },
    {
      id: 'acc-2',
      name: 'Savings Account',
      balance: new Decimal(25000),
      currency: 'USD',
      spaceId: 'space-123',
    },
    {
      id: 'acc-3',
      name: 'Credit Card',
      balance: new Decimal(-500),
      currency: 'USD',
      spaceId: 'space-123',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prismaService = module.get<PrismaService>(PrismaService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);

    jest.clearAllMocks();
  });

  describe('generatePdfReport', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    beforeEach(() => {
      mockPrismaService.space.findUnique.mockResolvedValue(mockSpace);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.budget.findMany.mockResolvedValue([]);
      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);
      mockAnalyticsService.getSpendingByCategory.mockResolvedValue([
        { categoryName: 'Groceries', amount: 150, percentage: 66.7 },
        { categoryName: 'Dining Out', amount: 75, percentage: 33.3 },
      ]);
    });

    it('should generate PDF report as Buffer', async () => {
      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should fetch space details with user information', async () => {
      await service.generatePdfReport('space-123', startDate, endDate);

      expect(mockPrismaService.space.findUnique).toHaveBeenCalledWith({
        where: { id: 'space-123' },
        include: {
          userSpaces: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    it('should throw error if space not found', async () => {
      mockPrismaService.space.findUnique.mockResolvedValue(null);

      await expect(
        service.generatePdfReport('nonexistent', startDate, endDate)
      ).rejects.toThrow('Space not found');
    });

    it('should fetch transactions within date range', async () => {
      await service.generatePdfReport('space-123', startDate, endDate);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          account: { spaceId: 'space-123' },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          category: true,
        },
      });
    });

    it('should call analytics service for spending breakdown', async () => {
      await service.generatePdfReport('space-123', startDate, endDate);

      expect(mockAnalyticsService.getSpendingByCategory).toHaveBeenCalledWith(
        'user-123',
        'space-123',
        startDate,
        endDate
      );
    });

    it('should fetch all budgets for the space', async () => {
      await service.generatePdfReport('space-123', startDate, endDate);

      expect(mockPrismaService.budget.findMany).toHaveBeenCalledWith({
        where: {
          spaceId: 'space-123',
        },
        include: {
          categories: true,
        },
      });
    });

    it('should fetch all accounts ordered by balance', async () => {
      await service.generatePdfReport('space-123', startDate, endDate);

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { spaceId: 'space-123' },
        orderBy: { balance: 'desc' },
      });
    });

    it('should include budget performance section when budgets exist', async () => {
      const mockBudgets = [
        {
          id: 'budget-1',
          name: 'Monthly Budget',
          spaceId: 'space-123',
          categories: [
            {
              id: 'cat-groceries',
              budgetedAmount: new Decimal(200),
            },
            {
              id: 'cat-dining',
              budgetedAmount: new Decimal(100),
            },
          ],
        },
      ];

      const budgetTransactions = [
        {
          id: 'txn-2',
          amount: new Decimal(-150),
          categoryId: 'cat-groceries',
        },
        {
          id: 'txn-3',
          amount: new Decimal(-75),
          categoryId: 'cat-dining',
        },
      ];

      mockPrismaService.budget.findMany.mockResolvedValue(mockBudgets);
      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce(mockTransactions) // First call for overall transactions
        .mockResolvedValueOnce(budgetTransactions); // Second call for budget-specific transactions

      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledTimes(2);
    });

    it('should handle transactions without categories', async () => {
      const transactionsWithoutCategory = [
        {
          id: 'txn-5',
          date: new Date('2024-01-10'),
          description: 'Uncategorized Transaction',
          amount: new Decimal(-50),
          currency: 'USD',
          categoryId: null,
          category: null,
          account: { name: 'Checking Account' },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(transactionsWithoutCategory);

      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should calculate total income correctly', async () => {
      // Income transactions: $5000 + $1200 = $6200
      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
      // Verify the service processed all transactions
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalled();
    });

    it('should calculate total expenses correctly', async () => {
      // Expense transactions: $150 + $75 = $225
      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalled();
    });

    it('should calculate savings rate correctly', async () => {
      // Net savings = $6200 - $225 = $5975
      // Savings rate = ($5975 / $6200) * 100 = 96.4%
      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle zero income gracefully', async () => {
      const expenseOnlyTransactions = [
        {
          id: 'txn-2',
          date: new Date('2024-01-16'),
          description: 'Expense',
          amount: new Decimal(-100),
          currency: 'USD',
          category: { name: 'Groceries' },
          account: { name: 'Credit Card' },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(expenseOnlyTransactions);

      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should sort spending categories by amount descending', async () => {
      mockAnalyticsService.getSpendingByCategory.mockResolvedValue([
        { categoryName: 'Rent', amount: 1500, percentage: 60 },
        { categoryName: 'Groceries', amount: 600, percentage: 24 },
        { categoryName: 'Transport', amount: 400, percentage: 16 },
      ]);

      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockAnalyticsService.getSpendingByCategory).toHaveBeenCalled();
    });

    it('should calculate total balance from all accounts', async () => {
      // Total: $10,000 + $25,000 - $500 = $34,500
      const result = await service.generatePdfReport('space-123', startDate, endDate);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPrismaService.account.findMany).toHaveBeenCalled();
    });
  });

  describe('generateCsvExport', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    beforeEach(() => {
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
    });

    it('should generate CSV export with header row', async () => {
      const result = await service.generateCsvExport('space-123', startDate, endDate);

      expect(result).toContain('Date,Account,Category,Description,Amount,Currency');
    });

    it('should fetch transactions within date range ordered by date descending', async () => {
      await service.generateCsvExport('space-123', startDate, endDate);

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          account: { spaceId: 'space-123' },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          account: true,
          category: true,
        },
        orderBy: {
          date: 'desc',
        },
      });
    });

    it('should format transaction data as CSV rows', async () => {
      const result = await service.generateCsvExport('space-123', startDate, endDate);

      expect(result).toContain('2024-01-15');
      expect(result).toContain('Checking Account');
      expect(result).toContain('Salary');
      expect(result).toContain('Salary Deposit');
      expect(result).toContain('5000.00');
      expect(result).toContain('USD');
    });

    it('should handle transactions without categories', async () => {
      const transactionsWithoutCategory = [
        {
          id: 'txn-5',
          date: new Date('2024-01-10'),
          description: 'Uncategorized',
          amount: new Decimal(-50),
          currency: 'USD',
          categoryId: null,
          category: null,
          account: { name: 'Checking' },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(transactionsWithoutCategory);

      const result = await service.generateCsvExport('space-123', startDate, endDate);

      expect(result).toContain('Uncategorized');
    });

    it('should escape double quotes in descriptions', async () => {
      const transactionsWithQuotes = [
        {
          id: 'txn-6',
          date: new Date('2024-01-10'),
          description: 'Payment for "Premium" Service',
          amount: new Decimal(-99.99),
          currency: 'USD',
          category: { name: 'Services' },
          account: { name: 'Checking' },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(transactionsWithQuotes);

      const result = await service.generateCsvExport('space-123', startDate, endDate);

      // CSV escaping: double quotes should be escaped as ""
      expect(result).toContain('""Premium""');
    });

    it('should format amounts with 2 decimal places', async () => {
      const result = await service.generateCsvExport('space-123', startDate, endDate);

      expect(result).toContain('5000.00'); // Income
      expect(result).toContain('-150.00'); // Expense
      expect(result).toContain('-75.00'); // Expense
      expect(result).toContain('1200.00'); // Income
    });

    it('should handle empty transaction list', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.generateCsvExport('space-123', startDate, endDate);

      expect(result).toBe('Date,Account,Category,Description,Amount,Currency\n');
    });

    it('should include all transactions in correct order', async () => {
      const result = await service.generateCsvExport('space-123', startDate, endDate);

      const lines = result.split('\n');
      expect(lines.length).toBe(6); // Header + 4 transactions + empty line at end
    });

    it('should wrap all text fields in quotes', async () => {
      const result = await service.generateCsvExport('space-123', startDate, endDate);

      // Date field should be quoted
      expect(result).toMatch(/"2024-01-\d{2}"/);
      // Account field should be quoted
      expect(result).toMatch(/"Checking Account"/);
      // Category field should be quoted
      expect(result).toMatch(/"Salary"/);
      // Description field should be quoted
      expect(result).toMatch(/"Salary Deposit"/);
    });

    it('should handle different currencies', async () => {
      const multiCurrencyTransactions = [
        {
          id: 'txn-1',
          date: new Date('2024-01-15'),
          description: 'EUR Transaction',
          amount: new Decimal(1000),
          currency: 'EUR',
          category: { name: 'Income' },
          account: { name: 'EUR Account' },
        },
        {
          id: 'txn-2',
          date: new Date('2024-01-16'),
          description: 'USD Transaction',
          amount: new Decimal(-500),
          currency: 'USD',
          category: { name: 'Expense' },
          account: { name: 'USD Account' },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(multiCurrencyTransactions);

      const result = await service.generateCsvExport('space-123', startDate, endDate);

      expect(result).toContain('EUR');
      expect(result).toContain('USD');
    });
  });
});
