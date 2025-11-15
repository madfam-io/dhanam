import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import { BudgetsService } from '../budgets.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { SpacesService } from '../../spaces/spaces.service';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto';

describe('BudgetsService - Business Logic Tests', () => {
  let service: BudgetsService;
  let prisma: jest.Mocked<PrismaService>;
  let spacesService: jest.Mocked<SpacesService>;

  const mockBudget = {
    id: 'budget-123',
    spaceId: 'space-123',
    name: 'November Budget',
    period: 'monthly',
    startDate: new Date('2025-11-01'),
    endDate: new Date('2025-11-30'),
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [
      {
        id: 'cat-1',
        budgetId: 'budget-123',
        name: 'Groceries',
        budgetedAmount: new Decimal(500),
        icon: '🛒',
        color: '#00FF00',
        description: 'Food and groceries',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          transactions: 15,
        },
      },
      {
        id: 'cat-2',
        budgetId: 'budget-123',
        name: 'Transportation',
        budgetedAmount: new Decimal(200),
        icon: '🚗',
        color: '#0000FF',
        description: 'Gas and transportation',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          transactions: 8,
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: PrismaService,
          useValue: {
            budget: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            transaction: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: SpacesService,
          useValue: {
            verifyUserAccess: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    spacesService = module.get(SpacesService) as jest.Mocked<SpacesService>;

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all budgets for a space', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findMany.mockResolvedValue([mockBudget] as any);

      // Act
      const result = await service.findAll('space-123', 'user-123');

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'viewer');
      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: { spaceId: 'space-123' },
        include: {
          categories: {
            include: {
              _count: {
                select: { transactions: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('November Budget');
    });

    it('should order budgets by creation date descending', async () => {
      // Arrange
      const budget1 = { ...mockBudget, id: 'b1', createdAt: new Date('2025-11-01') };
      const budget2 = { ...mockBudget, id: 'b2', createdAt: new Date('2025-11-15') };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findMany.mockResolvedValue([budget2, budget1] as any);

      // Act
      const result = await service.findAll('space-123', 'user-123');

      // Assert
      expect(result[0].id).toBe('b2'); // Newer first
      expect(result[1].id).toBe('b1');
    });
  });

  describe('findOne', () => {
    it('should return a budget by ID', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);

      // Act
      const result = await service.findOne('space-123', 'user-123', 'budget-123');

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'viewer');
      expect(result.id).toBe('budget-123');
      expect(result.name).toBe('November Budget');
    });

    it('should throw NotFoundException if budget not found', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOne('space-123', 'user-123', 'nonexistent')
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('space-123', 'user-123', 'nonexistent')
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('create', () => {
    it('should create a new budget', async () => {
      // Arrange
      const dto: CreateBudgetDto = {
        name: 'December Budget',
        period: 'monthly',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-31'),
      };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(null); // No overlapping
      prisma.budget.create.mockResolvedValue(mockBudget as any);

      // Act
      const result = await service.create('space-123', 'user-123', dto);

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'member');
      expect(prisma.budget.create).toHaveBeenCalledWith({
        data: {
          spaceId: 'space-123',
          name: dto.name,
          period: dto.period,
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
        include: {
          categories: {
            include: {
              _count: {
                select: { transactions: true },
              },
            },
          },
        },
      });
      expect(result.name).toBe('November Budget');
    });

    it('should auto-calculate end date when not provided', async () => {
      // Arrange
      const dto: CreateBudgetDto = {
        name: 'Weekly Budget',
        period: 'weekly',
        startDate: new Date('2025-11-01'),
        // endDate omitted
      };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(null);
      prisma.budget.create.mockResolvedValue(mockBudget as any);

      // Act
      await service.create('space-123', 'user-123', dto);

      // Assert
      const createCall = prisma.budget.create.mock.calls[0][0];
      expect(createCall.data.endDate).toBeDefined();
      // Weekly budget should end 6 days later (7 days - 1 for inclusive end date)
      const expectedEndDate = new Date('2025-11-07');
      expect(createCall.data.endDate).toEqual(expectedEndDate);
    });

    it('should throw ConflictException for overlapping budget', async () => {
      // Arrange
      const dto: CreateBudgetDto = {
        name: 'Overlapping Budget',
        period: 'monthly',
        startDate: new Date('2025-11-15'), // Overlaps with mockBudget
        endDate: new Date('2025-12-15'),
      };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any); // Overlap found

      // Act & Assert
      await expect(
        service.create('space-123', 'user-123', dto)
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create('space-123', 'user-123', dto)
      ).rejects.toThrow('Budget period overlaps with an existing budget');
    });
  });

  describe('update', () => {
    it('should update a budget', async () => {
      // Arrange
      const dto: UpdateBudgetDto = {
        name: 'Updated Budget Name',
      };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.budget.update.mockResolvedValue({ ...mockBudget, ...dto } as any);

      // Act
      const result = await service.update('space-123', 'user-123', 'budget-123', dto);

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'member');
      expect(result.name).toBe('Updated Budget Name');
    });

    it('should throw NotFoundException if budget not found', async () => {
      // Arrange
      const dto: UpdateBudgetDto = { name: 'Updated' };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('space-123', 'user-123', 'nonexistent', dto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should check for overlaps when updating dates', async () => {
      // Arrange
      const dto: UpdateBudgetDto = {
        startDate: new Date('2025-11-10'),
        endDate: new Date('2025-12-10'),
      };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst
        .mockResolvedValueOnce(mockBudget as any) // Existing budget
        .mockResolvedValueOnce({ id: 'other-budget' } as any); // Overlap found

      // Act & Assert
      await expect(
        service.update('space-123', 'user-123', 'budget-123', dto)
      ).rejects.toThrow(ConflictException);
    });

    it('should allow update without overlap', async () => {
      // Arrange
      const dto: UpdateBudgetDto = {
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-31'),
      };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst
        .mockResolvedValueOnce(mockBudget as any) // Existing budget
        .mockResolvedValueOnce(null); // No overlap
      prisma.budget.update.mockResolvedValue({ ...mockBudget, ...dto } as any);

      // Act
      const result = await service.update('space-123', 'user-123', 'budget-123', dto);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should delete a budget', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.budget.delete.mockResolvedValue(mockBudget as any);

      // Act
      await service.remove('space-123', 'user-123', 'budget-123');

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'admin');
      expect(prisma.budget.delete).toHaveBeenCalledWith({
        where: { id: 'budget-123' },
      });
    });

    it('should throw NotFoundException if budget not found', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.remove('space-123', 'user-123', 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });

    it('should require admin permission for deletion', async () => {
      // Assert - verify admin check is called
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.budget.delete.mockResolvedValue(mockBudget as any);

      // Act
      await service.remove('space-123', 'user-123', 'budget-123');

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'admin');
    });
  });

  describe('getBudgetSummary', () => {
    it('should calculate budget summary correctly', async () => {
      // Arrange
      const transactions = [
        // Groceries category ($300 spent)
        {
          id: 'txn-1',
          categoryId: 'cat-1',
          amount: new Decimal(-150),
          date: new Date('2025-11-10'),
          category: { id: 'cat-1', name: 'Groceries' },
        },
        {
          id: 'txn-2',
          categoryId: 'cat-1',
          amount: new Decimal(-150),
          date: new Date('2025-11-15'),
          category: { id: 'cat-1', name: 'Groceries' },
        },
        // Transportation category ($120 spent)
        {
          id: 'txn-3',
          categoryId: 'cat-2',
          amount: new Decimal(-80),
          date: new Date('2025-11-12'),
          category: { id: 'cat-2', name: 'Transportation' },
        },
        {
          id: 'txn-4',
          categoryId: 'cat-2',
          amount: new Decimal(-40),
          date: new Date('2025-11-18'),
          category: { id: 'cat-2', name: 'Transportation' },
        },
      ];

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.transaction.findMany.mockResolvedValue(transactions as any);

      // Act
      const result = await service.getBudgetSummary('space-123', 'user-123', 'budget-123');

      // Assert
      expect(result.summary.totalBudgeted).toBe(700); // $500 + $200
      expect(result.summary.totalSpent).toBe(420); // $300 + $120
      expect(result.summary.totalRemaining).toBe(280); // $700 - $420
      expect(result.summary.totalPercentUsed).toBeCloseTo(60, 0); // 420/700 * 100 = 60%

      // Category-specific
      const groceriesCategory = result.categories.find((c) => c.id === 'cat-1');
      expect(groceriesCategory?.spent).toBe(300);
      expect(groceriesCategory?.remaining).toBe(200); // $500 - $300
      expect(groceriesCategory?.percentUsed).toBeCloseTo(60, 0); // 300/500 * 100

      const transportCategory = result.categories.find((c) => c.id === 'cat-2');
      expect(transportCategory?.spent).toBe(120);
      expect(transportCategory?.remaining).toBe(80); // $200 - $120
      expect(transportCategory?.percentUsed).toBeCloseTo(60, 0); // 120/200 * 100
    });

    it('should handle categories with no transactions', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.transaction.findMany.mockResolvedValue([]); // No transactions

      // Act
      const result = await service.getBudgetSummary('space-123', 'user-123', 'budget-123');

      // Assert
      expect(result.summary.totalSpent).toBe(0);
      expect(result.summary.totalRemaining).toBe(700);
      expect(result.summary.totalPercentUsed).toBe(0);
    });

    it('should handle overspending (>100%)', async () => {
      // Arrange
      const overspentTransactions = [
        {
          id: 'txn-1',
          categoryId: 'cat-1',
          amount: new Decimal(-600), // Exceeds $500 budget
          date: new Date('2025-11-10'),
          category: { id: 'cat-1', name: 'Groceries' },
        },
      ];

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.transaction.findMany.mockResolvedValue(overspentTransactions as any);

      // Act
      const result = await service.getBudgetSummary('space-123', 'user-123', 'budget-123');

      // Assert
      const groceriesCategory = result.categories.find((c) => c.id === 'cat-1');
      expect(groceriesCategory?.spent).toBe(600);
      expect(groceriesCategory?.remaining).toBe(-100); // Negative remaining
      expect(groceriesCategory?.percentUsed).toBeCloseTo(120, 0); // >100%
    });

    it('should only include transactions within budget period', async () => {
      // Arrange
      const mixedTransactions = [
        // Within period
        {
          id: 'txn-in',
          categoryId: 'cat-1',
          amount: new Decimal(-100),
          date: new Date('2025-11-15'),
          category: { id: 'cat-1', name: 'Groceries' },
        },
        // Should be filtered by query (not included)
      ];

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.transaction.findMany.mockResolvedValue(mixedTransactions as any);

      // Act
      const result = await service.getBudgetSummary('space-123', 'user-123', 'budget-123');

      // Assert
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          account: { spaceId: 'space-123' },
          date: {
            gte: mockBudget.startDate,
            lte: mockBudget.endDate,
          },
          categoryId: {
            in: ['cat-1', 'cat-2'],
          },
        },
        include: {
          category: true,
        },
      });
    });

    it('should throw NotFoundException if budget not found', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getBudgetSummary('space-123', 'user-123', 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateEndDate - Period Logic', () => {
    it('should calculate daily period end date', () => {
      // Arrange
      const startDate = new Date('2025-11-15');

      // Act
      const endDate = (service as any).calculateEndDate(startDate, 'daily');

      // Assert
      expect(endDate).toEqual(new Date('2025-11-15')); // Same day (inclusive)
    });

    it('should calculate weekly period end date', () => {
      // Arrange
      const startDate = new Date('2025-11-01');

      // Act
      const endDate = (service as any).calculateEndDate(startDate, 'weekly');

      // Assert
      expect(endDate).toEqual(new Date('2025-11-07')); // 7 days later - 1
    });

    it('should calculate monthly period end date', () => {
      // Arrange
      const startDate = new Date('2025-11-01');

      // Act
      const endDate = (service as any).calculateEndDate(startDate, 'monthly');

      // Assert
      expect(endDate).toEqual(new Date('2025-11-30')); // End of month
    });

    it('should calculate quarterly period end date', () => {
      // Arrange
      const startDate = new Date('2025-01-01');

      // Act
      const endDate = (service as any).calculateEndDate(startDate, 'quarterly');

      // Assert
      expect(endDate).toEqual(new Date('2025-03-31')); // 3 months later - 1 day
    });

    it('should calculate yearly period end date', () => {
      // Arrange
      const startDate = new Date('2025-01-01');

      // Act
      const endDate = (service as any).calculateEndDate(startDate, 'yearly');

      // Assert
      expect(endDate).toEqual(new Date('2025-12-31')); // End of year
    });

    it('should handle leap years correctly', () => {
      // Arrange
      const startDate = new Date('2024-02-01'); // 2024 is a leap year

      // Act
      const endDate = (service as any).calculateEndDate(startDate, 'monthly');

      // Assert
      expect(endDate).toEqual(new Date('2024-02-29')); // 29 days in Feb 2024
    });
  });

  describe('Permission Checks', () => {
    it('should require viewer permission for findAll', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findMany.mockResolvedValue([]);

      // Act
      await service.findAll('space-123', 'user-123');

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'viewer');
    });

    it('should require member permission for create', async () => {
      // Arrange
      const dto: CreateBudgetDto = {
        name: 'Test',
        period: 'monthly',
        startDate: new Date(),
      };

      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(null);
      prisma.budget.create.mockResolvedValue(mockBudget as any);

      // Act
      await service.create('space-123', 'user-123', dto);

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'member');
    });

    it('should require admin permission for remove', async () => {
      // Arrange
      spacesService.verifyUserAccess.mockResolvedValue(undefined);
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.budget.delete.mockResolvedValue(mockBudget as any);

      // Act
      await service.remove('space-123', 'user-123', 'budget-123');

      // Assert
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith('user-123', 'space-123', 'admin');
    });
  });
});
