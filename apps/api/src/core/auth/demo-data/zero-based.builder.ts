import { subDays } from 'date-fns';

import { Currency, CategoryGoalType } from '@db';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class ZeroBasedBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    if (ctx.personaKey !== 'maria') return;
    await this.buildMariaZeroBased(ctx);
  }

  private async buildMariaZeroBased(ctx: DemoContext): Promise<void> {
    const personal = ctx.spaces.find((s) => s.type === 'personal');
    if (!personal) return;

    // Create biweekly income event (most recent paycheck)
    const incomeEvent = await this.prisma.incomeEvent.create({
      data: {
        spaceId: personal.id,
        amount: 32500,
        currency: Currency.MXN,
        source: 'paycheck',
        description: 'Nómina BBVA quincenal',
        receivedAt: subDays(new Date(), 3),
        isAllocated: true,
      },
    });

    // Allocations matching María's budget categories
    const allocations: Array<{ categoryName: string; amount: number }> = [
      { categoryName: 'Rent', amount: 15000 },
      { categoryName: 'Groceries', amount: 5000 },
      { categoryName: 'Savings', amount: 4000 },
      { categoryName: 'Entertainment', amount: 2000 },
    ];

    for (const alloc of allocations) {
      const cat = ctx.categories.find(
        (c) =>
          c.name.toLowerCase() === alloc.categoryName.toLowerCase() && c.spaceId === personal.id
      );
      if (!cat) continue;

      await this.prisma.incomeAllocation.create({
        data: {
          incomeEventId: incomeEvent.id,
          categoryId: cat.id,
          amount: alloc.amount,
          notes: `${Math.round((alloc.amount / 32500) * 100)}% of paycheck`,
        },
      });
    }

    // Create a second income event for freelance
    const freelanceEvent = await this.prisma.incomeEvent.create({
      data: {
        spaceId: personal.id,
        amount: 8000,
        currency: Currency.MXN,
        source: 'freelance',
        description: 'Freelance design project',
        receivedAt: subDays(new Date(), 10),
        isAllocated: true,
      },
    });

    // Freelance goes mostly to savings
    const savingsCat = ctx.categories.find(
      (c) => c.name.toLowerCase() === 'savings' && c.spaceId === personal.id
    );
    const entertainmentCat = ctx.categories.find(
      (c) => c.name.toLowerCase() === 'entertainment' && c.spaceId === personal.id
    );

    if (savingsCat) {
      await this.prisma.incomeAllocation.create({
        data: {
          incomeEventId: freelanceEvent.id,
          categoryId: savingsCat.id,
          amount: 6000,
          notes: 'Freelance → savings fund',
        },
      });
    }
    if (entertainmentCat) {
      await this.prisma.incomeAllocation.create({
        data: {
          incomeEventId: freelanceEvent.id,
          categoryId: entertainmentCat.id,
          amount: 2000,
          notes: 'Freelance → fun money',
        },
      });
    }

    // Category goals for zero-based tracking
    for (const cat of ctx.categories.filter((c) => c.spaceId === personal.id)) {
      const goalConfig = this.getCategoryGoalConfig(cat.name);
      if (!goalConfig) continue;

      await this.prisma.categoryGoal.create({
        data: {
          categoryId: cat.id,
          goalType: goalConfig.goalType,
          targetAmount: goalConfig.targetAmount,
          monthlyFunding: goalConfig.monthlyFunding,
          notes: goalConfig.notes,
        },
      });
    }
  }

  private getCategoryGoalConfig(categoryName: string): {
    goalType: CategoryGoalType;
    targetAmount: number;
    monthlyFunding: number;
    notes: string;
  } | null {
    const configs: Record<
      string,
      { goalType: CategoryGoalType; targetAmount: number; monthlyFunding: number; notes: string }
    > = {
      rent: {
        goalType: CategoryGoalType.monthly_spending,
        targetAmount: 15000,
        monthlyFunding: 15000,
        notes: 'Fixed — apartment lease',
      },
      groceries: {
        goalType: CategoryGoalType.monthly_spending,
        targetAmount: 6000,
        monthlyFunding: 5000,
        notes: 'Target MXN 5K, buffer MXN 1K',
      },
      savings: {
        goalType: CategoryGoalType.target_balance,
        targetAmount: 200000,
        monthlyFunding: 10000,
        notes: 'Emergency fund target: 6 months expenses',
      },
      entertainment: {
        goalType: CategoryGoalType.monthly_spending,
        targetAmount: 4000,
        monthlyFunding: 4000,
        notes: 'Fun money — guilt-free spending',
      },
    };
    return configs[categoryName.toLowerCase()] ?? null;
  }
}
