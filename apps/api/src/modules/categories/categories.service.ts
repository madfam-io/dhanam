import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  async findAll(spaceId: string, userId: string): Promise<any[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const categories = await this.prisma.category.findMany({
      where: {
        budget: { spaceId },
      },
      include: {
        budget: true,
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => ({
      ...category,
      budgetedAmount: category.budgetedAmount.toNumber(),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      budget: {
        ...category.budget,
        createdAt: category.budget.createdAt.toISOString(),
        updatedAt: category.budget.updatedAt.toISOString(),
        startDate: category.budget.startDate.toISOString(),
        endDate: category.budget.endDate ? category.budget.endDate.toISOString() : null,
      },
    }));
  }

  async findByBudget(spaceId: string, userId: string, budgetId: string): Promise<any[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Verify budget belongs to space
    const budget = await this.prisma.budget.findFirst({
      where: {
        id: budgetId,
        spaceId,
      },
    });

    if (!budget) {
      throw new ForbiddenException('Budget not found or does not belong to this space');
    }

    const categories = await this.prisma.category.findMany({
      where: { budgetId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => ({
      ...category,
      budgetedAmount: category.budgetedAmount.toNumber(),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }));
  }

  async findOne(spaceId: string, userId: string, categoryId: string): Promise<any> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        budget: { spaceId },
      },
      include: {
        budget: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      budgetedAmount: category.budgetedAmount.toNumber(),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      budget: {
        ...category.budget,
        createdAt: category.budget.createdAt.toISOString(),
        updatedAt: category.budget.updatedAt.toISOString(),
        startDate: category.budget.startDate.toISOString(),
        endDate: category.budget.endDate ? category.budget.endDate.toISOString() : null,
      },
    };
  }

  async create(spaceId: string, userId: string, dto: CreateCategoryDto): Promise<any> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Verify budget belongs to space
    const budget = await this.prisma.budget.findFirst({
      where: {
        id: dto.budgetId,
        spaceId,
      },
    });

    if (!budget) {
      throw new ForbiddenException('Budget not found or does not belong to this space');
    }

    const category = await this.prisma.category.create({
      data: {
        budgetId: dto.budgetId,
        name: dto.name,
        budgetedAmount: dto.budgetedAmount,
        color: dto.color || this.generateRandomColor(),
        icon: dto.icon,
        description: dto.description,
      },
      include: {
        budget: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    return {
      ...category,
      budgetedAmount: category.budgetedAmount.toNumber(),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      budget: {
        ...category.budget,
        createdAt: category.budget.createdAt.toISOString(),
        updatedAt: category.budget.updatedAt.toISOString(),
        startDate: category.budget.startDate.toISOString(),
        endDate: category.budget.endDate ? category.budget.endDate.toISOString() : null,
      },
    };
  }

  async update(
    spaceId: string,
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto
  ): Promise<any> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    await this.findOne(spaceId, userId, categoryId);

    const category = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.budgetedAmount !== undefined && { budgetedAmount: dto.budgetedAmount }),
        ...(dto.color && { color: dto.color }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      include: {
        budget: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    return {
      ...category,
      budgetedAmount: category.budgetedAmount.toNumber(),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      budget: {
        ...category.budget,
        createdAt: category.budget.createdAt.toISOString(),
        updatedAt: category.budget.updatedAt.toISOString(),
        startDate: category.budget.startDate.toISOString(),
        endDate: category.budget.endDate ? category.budget.endDate.toISOString() : null,
      },
    };
  }

  async remove(spaceId: string, userId: string, categoryId: string): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'admin');

    await this.findOne(spaceId, userId, categoryId);

    // Update transactions to remove category reference
    await this.prisma.transaction.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });

    await this.prisma.category.delete({
      where: { id: categoryId },
    });
  }

  async getCategorySpending(spaceId: string, userId: string, categoryId: string): Promise<any> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const category = await this.findOne(spaceId, userId, categoryId);

    // Get budget period
    const budget = await this.prisma.budget.findUnique({
      where: { id: category.budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Get all transactions for this category in the budget period
    const transactions = await this.prisma.transaction.findMany({
      where: {
        categoryId,
        date: {
          gte: budget.startDate,
          ...(budget.endDate && { lte: budget.endDate }),
        },
      },
      include: {
        account: true,
      },
      orderBy: { date: 'desc' },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount.toNumber()), 0);
    const budgetedAmount = category.budgetedAmount.toNumber();
    const remaining = budgetedAmount - totalSpent;
    const percentUsed = (totalSpent / budgetedAmount) * 100;

    // Group transactions by day for spending trend
    const dailySpending = transactions.reduce(
      (acc, transaction) => {
        if (!transaction.date) return acc;
        const dateKey = transaction.date.toISOString().split('T')[0];
        if (!dateKey) return acc;
        if (!acc[dateKey]) {
          acc[dateKey] = 0;
        }
        acc[dateKey] += Math.abs(transaction.amount.toNumber());
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      ...category,
      budgetedAmount: budgetedAmount,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      budget: {
        ...category.budget,
        createdAt: category.budget.createdAt.toISOString(),
        updatedAt: category.budget.updatedAt.toISOString(),
        startDate: category.budget.startDate.toISOString(),
        endDate: category.budget.endDate ? category.budget.endDate.toISOString() : null,
      },
      spending: {
        totalBudgeted: budgetedAmount,
        totalSpent,
        remaining,
        percentUsed,
        transactionCount: transactions.length,
        averageTransaction: transactions.length > 0 ? totalSpent / transactions.length : 0,
      },
      transactions: transactions.slice(0, 10).map((t) => ({
        ...t,
        amount: t.amount.toNumber(),
        date: t.date ? t.date.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })), // Return last 10 transactions
      dailySpending,
    };
  }

  private generateRandomColor(): string {
    const colors: string[] = [
      '#ef4444', // red
      '#f97316', // orange
      '#f59e0b', // amber
      '#eab308', // yellow
      '#84cc16', // lime
      '#22c55e', // green
      '#10b981', // emerald
      '#14b8a6', // teal
      '#06b6d4', // cyan
      '#0ea5e9', // sky
      '#3b82f6', // blue
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#a855f7', // purple
      '#d946ef', // fuchsia
      '#ec4899', // pink
      '#f43f5e', // rose
    ];
    return colors[Math.floor(Math.random() * colors.length)] || '#3b82f6';
  }
}
