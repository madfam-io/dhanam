import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { Budget, Prisma } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
  ) {}

  async findAll(spaceId: string, userId: string): Promise<Budget[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    return this.prisma.budget.findMany({
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
  }

  async findOne(
    spaceId: string,
    userId: string,
    budgetId: string,
  ): Promise<Budget> {
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

    return budget;
  }

  async create(
    spaceId: string,
    userId: string,
    dto: CreateBudgetDto,
  ): Promise<Budget> {
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
        categories: true,
      },
    });

    return budget;
  }

  async update(
    spaceId: string,
    userId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.findOne(spaceId, userId, budgetId);

    // If updating dates or period, check for overlaps
    if (dto.startDate || dto.endDate || dto.period) {
      const startDate = dto.startDate || existing.startDate;
      const endDate = dto.endDate || existing.endDate;
      const period = dto.period || existing.period;

      const overlapping = await this.prisma.budget.findFirst({
        where: {
          spaceId,
          period,
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
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } },
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

    return budget;
  }

  async remove(
    spaceId: string,
    userId: string,
    budgetId: string,
  ): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'admin');

    await this.findOne(spaceId, userId, budgetId);

    // Categories will be cascade deleted
    await this.prisma.budget.delete({
      where: { id: budgetId },
    });
  }

  async getBudgetSummary(
    spaceId: string,
    userId: string,
    budgetId: string,
  ): Promise<any> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const budget = await this.findOne(spaceId, userId, budgetId);

    // Get all transactions for this budget period
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
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
    const categoryTotals = budget.categories.map((category) => {
      const categoryTransactions = transactions.filter(
        (t) => t.categoryId === category.id,
      );
      const spent = categoryTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0,
      );
      const remaining = category.budgetedAmount - spent;
      const percentUsed = (spent / category.budgetedAmount) * 100;

      return {
        ...category,
        spent,
        remaining,
        percentUsed,
        transactionCount: categoryTransactions.length,
      };
    });

    const totalBudgeted = budget.categories.reduce(
      (sum, c) => sum + c.budgetedAmount,
      0,
    );
    const totalSpent = categoryTotals.reduce((sum, c) => sum + c.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const totalPercentUsed = (totalSpent / totalBudgeted) * 100;

    return {
      ...budget,
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
}