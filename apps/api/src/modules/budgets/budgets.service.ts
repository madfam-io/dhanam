import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { CreateBudgetDto, UpdateBudgetDto, BudgetResponseDto, BudgetSummaryDto, CategorySummaryDto } from './dto';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
  ) {}

  async findAll(spaceId: string, userId: string): Promise<BudgetResponseDto[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const budgets = await this.prisma.budget.findMany({
      where: { spaceId },
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

    return budgets.map(budget => this.transformBudgetToDto(budget));
  }

  async findOne(
    spaceId: string,
    userId: string,
    budgetId: string,
  ): Promise<BudgetResponseDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const budget = await this.prisma.budget.findFirst({
      where: {
        id: budgetId,
        spaceId,
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

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return this.transformBudgetToDto(budget);
  }

  async create(
    spaceId: string,
    userId: string,
    dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Check for overlapping budgets
    const overlapping = await this.prisma.budget.findFirst({
      where: {
        spaceId,
        period: dto.period,
        OR: [
          {
            AND: [
              { startDate: { lte: dto.startDate } },
              { endDate: { gte: dto.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: dto.endDate || dto.startDate } },
              { endDate: { gte: dto.endDate || dto.startDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException('Budget period overlaps with an existing budget');
    }

    // Calculate end date if not provided
    let endDate = dto.endDate;
    if (!endDate) {
      endDate = this.calculateEndDate(dto.startDate, dto.period);
    }

    const budget = await this.prisma.budget.create({
      data: {
        spaceId,
        name: dto.name,
        period: dto.period,
        startDate: dto.startDate,
        endDate,
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

    return this.transformBudgetToDto(budget);
  }

  async update(
    spaceId: string,
    userId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.prisma.budget.findFirst({
      where: {
        id: budgetId,
        spaceId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    // If updating dates or period, check for overlaps
    if (dto.startDate || dto.endDate || dto.period) {
      const startDate = dto.startDate || existing.startDate;
      const endDate = dto.endDate || existing.endDate;
      const period = dto.period || existing.period as any;

      const overlapping = await this.prisma.budget.findFirst({
        where: {
          spaceId,
          period: period as any,
          id: { not: budgetId },
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: endDate || undefined } },
                { endDate: { gte: endDate || undefined } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        throw new ConflictException('Budget period overlaps with an existing budget');
      }
    }

    const budget = await this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.period && { period: dto.period }),
        ...(dto.startDate && { startDate: dto.startDate }),
        ...(dto.endDate && { endDate: dto.endDate }),
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

    return this.transformBudgetToDto(budget);
  }

  async remove(
    spaceId: string,
    userId: string,
    budgetId: string,
  ): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'admin');

    const budget = await this.prisma.budget.findFirst({
      where: {
        id: budgetId,
        spaceId,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Categories will be cascade deleted
    await this.prisma.budget.delete({
      where: { id: budgetId },
    });
  }

  async getBudgetSummary(
    spaceId: string,
    userId: string,
    budgetId: string,
  ): Promise<BudgetSummaryDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const budget = await this.prisma.budget.findFirst({
      where: {
        id: budgetId,
        spaceId,
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

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Get all transactions for this budget period
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: {
          gte: budget.startDate,
          lte: budget.endDate || undefined,
        },
        categoryId: {
          in: budget.categories.map((c) => c.id),
        },
      },
      include: {
        category: true,
      },
    });

    // Calculate totals by category
    const categoryTotals: CategorySummaryDto[] = budget.categories.map((category) => {
      const categoryTransactions = transactions.filter(
        (t) => t.categoryId === category.id,
      );
      const spent = categoryTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount.toNumber()),
        0,
      );
      const budgetedAmount = category.budgetedAmount.toNumber();
      const remaining = budgetedAmount - spent;
      const percentUsed = budgetedAmount > 0 ? (spent / budgetedAmount) * 100 : 0;

      return {
        id: category.id,
        budgetId: category.budgetId,
        name: category.name,
        budgetedAmount,
        icon: category.icon,
        color: category.color,
        description: category.description,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
        _count: category._count,
        spent,
        remaining,
        percentUsed,
        transactionCount: categoryTransactions.length,
      };
    });

    const totalBudgeted = budget.categories.reduce(
      (sum, c) => sum + c.budgetedAmount.toNumber(),
      0,
    );
    const totalSpent = categoryTotals.reduce((sum, c) => sum + c.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const totalPercentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      id: budget.id,
      spaceId: budget.spaceId,
      name: budget.name,
      period: budget.period,
      startDate: budget.startDate.toISOString(),
      endDate: budget.endDate?.toISOString() || null,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
      categories: categoryTotals,
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining,
        totalPercentUsed,
      },
    };
  }

  private calculateEndDate(startDate: Date, period: string): Date {
    const date = new Date(startDate);
    switch (period) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    date.setDate(date.getDate() - 1); // End date is inclusive
    return date;
  }

  private transformBudgetToDto(budget: any): BudgetResponseDto {
    return {
      id: budget.id,
      spaceId: budget.spaceId,
      name: budget.name,
      period: budget.period,
      startDate: budget.startDate.toISOString(),
      endDate: budget.endDate?.toISOString() || null,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
      categories: budget.categories?.map((category: any) => ({
        id: category.id,
        budgetId: category.budgetId,
        name: category.name,
        budgetedAmount: category.budgetedAmount.toNumber(),
        icon: category.icon,
        color: category.color,
        description: category.description,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
        _count: category._count,
      })) || [],
    };
  }
}