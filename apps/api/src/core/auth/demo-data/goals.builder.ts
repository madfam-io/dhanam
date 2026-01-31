import { Currency, GoalType, GoalActivityAction } from '@db';
import { subDays } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

interface GoalDef {
  spaceId: string;
  name: string;
  description: string;
  type: GoalType;
  targetAmount: number;
  currency: Currency;
  targetDate: Date;
  priority: number;
  monthlyContribution: number;
  expectedReturn: number;
  volatility: number;
  currentProbability: number;
  confidenceLow: number;
  confidenceHigh: number;
  currentProgress: number;
  projectedCompletion: Date;
  allocAccountTypes: string[];
}

export class GoalsBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    const goals = this.getGoalsForPersona(ctx);
    if (goals.length === 0) return;

    for (const def of goals) {
      const allocAccounts = ctx.accounts.filter(
        (a) => a.spaceId === def.spaceId && def.allocAccountTypes.includes(a.type)
      );
      if (allocAccounts.length === 0) continue;

      const goal = await this.prisma.goal.create({
        data: {
          spaceId: def.spaceId,
          name: def.name,
          description: def.description,
          type: def.type,
          targetAmount: def.targetAmount,
          currency: def.currency,
          targetDate: def.targetDate,
          priority: def.priority,
          status: 'active',
          monthlyContribution: def.monthlyContribution,
          expectedReturn: def.expectedReturn,
          volatility: def.volatility,
          currentProbability: def.currentProbability,
          confidenceLow: def.confidenceLow,
          confidenceHigh: def.confidenceHigh,
          currentProgress: def.currentProgress,
          projectedCompletion: def.projectedCompletion,
          lastSimulationAt: new Date(),
          createdBy: ctx.user.id,
          probabilityHistory: [
            {
              date: subDays(new Date(), 90).toISOString(),
              probability: def.currentProbability - 6,
            },
            {
              date: subDays(new Date(), 60).toISOString(),
              probability: def.currentProbability - 4,
            },
            {
              date: subDays(new Date(), 30).toISOString(),
              probability: def.currentProbability - 2,
            },
            { date: new Date().toISOString(), probability: def.currentProbability },
          ],
          allocations: {
            create: allocAccounts.map((a, i) => ({
              accountId: a.id,
              percentage: i === 0 ? 70 : 30,
            })),
          },
        },
      });

      // Activity records
      await this.prisma.goalActivity.createMany({
        data: [
          {
            goalId: goal.id,
            userId: ctx.user.id,
            action: GoalActivityAction.created,
            createdAt: subDays(new Date(), 90),
          },
          {
            goalId: goal.id,
            userId: ctx.user.id,
            action: GoalActivityAction.contribution_added,
            metadata: { amount: def.monthlyContribution },
            createdAt: subDays(new Date(), 60),
          },
          {
            goalId: goal.id,
            userId: ctx.user.id,
            action: GoalActivityAction.probability_improved,
            metadata: {
              oldProbability: def.currentProbability - 4,
              newProbability: def.currentProbability,
            },
            createdAt: subDays(new Date(), 15),
          },
          {
            goalId: goal.id,
            userId: ctx.user.id,
            action: GoalActivityAction.milestone_reached,
            metadata: { milestone: `${Math.round(def.currentProgress)}% Complete` },
            createdAt: subDays(new Date(), 5),
          },
        ],
      });
    }
  }

  private getGoalsForPersona(ctx: DemoContext): GoalDef[] {
    const personal = ctx.spaces.find((s) => s.type === 'personal');
    const business = ctx.spaces.find((s) => s.type === 'business');
    const pId = personal?.id ?? ctx.spaces[0]?.id;
    if (!pId) return [];

    switch (ctx.personaKey) {
      case 'guest':
        return [
          {
            spaceId: pId,
            name: 'Emergency Fund',
            description: '6 months of living expenses',
            type: 'emergency_fund',
            targetAmount: 90000,
            currency: Currency.MXN,
            targetDate: new Date('2026-12-31'),
            priority: 1,
            monthlyContribution: 3000,
            expectedReturn: 0.03,
            volatility: 0.02,
            currentProbability: 95.2,
            confidenceLow: 88000,
            confidenceHigh: 98000,
            currentProgress: 55.6,
            projectedCompletion: new Date('2026-08-15'),
            allocAccountTypes: ['savings', 'checking'],
          },
        ];

      case 'maria':
        return [
          {
            spaceId: pId,
            name: 'Apartment Down Payment',
            description: 'Down payment for a 2BR in CDMX',
            type: 'house_purchase',
            targetAmount: 600000,
            currency: Currency.MXN,
            targetDate: new Date('2028-06-30'),
            priority: 1,
            monthlyContribution: 8000,
            expectedReturn: 0.06,
            volatility: 0.12,
            currentProbability: 68.5,
            confidenceLow: 480000,
            confidenceHigh: 680000,
            currentProgress: 24.0,
            projectedCompletion: new Date('2028-03-15'),
            allocAccountTypes: ['savings', 'checking'],
          },
          {
            spaceId: pId,
            name: 'Europe Trip',
            description: '15-day vacation across Europe',
            type: 'travel',
            targetAmount: 120000,
            currency: Currency.MXN,
            targetDate: new Date('2027-07-15'),
            priority: 3,
            monthlyContribution: 5000,
            expectedReturn: 0.02,
            volatility: 0.01,
            currentProbability: 92.4,
            confidenceLow: 118000,
            confidenceHigh: 127000,
            currentProgress: 62.5,
            projectedCompletion: new Date('2027-06-01'),
            allocAccountTypes: ['savings'],
          },
        ];

      case 'carlos':
        return [
          {
            spaceId: business?.id ?? pId,
            name: 'Second Restaurant',
            description: 'Capital for second Tacos El Patrón location',
            type: 'business',
            targetAmount: 1500000,
            currency: Currency.MXN,
            targetDate: new Date('2027-03-31'),
            priority: 1,
            monthlyContribution: 25000,
            expectedReturn: 0.08,
            volatility: 0.18,
            currentProbability: 65.7,
            confidenceLow: 1100000,
            confidenceHigh: 1650000,
            currentProgress: 30.0,
            projectedCompletion: new Date('2027-05-15'),
            allocAccountTypes: ['savings', 'checking', 'investment'],
          },
        ];

      case 'patricia':
        return [
          {
            spaceId: pId,
            name: 'Retirement',
            description: 'Comfortable retirement at 60',
            type: 'retirement',
            targetAmount: 2000000,
            currency: Currency.USD,
            targetDate: new Date('2040-12-31'),
            priority: 1,
            monthlyContribution: 15000,
            expectedReturn: 0.07,
            volatility: 0.14,
            currentProbability: 89.3,
            confidenceLow: 1800000,
            confidenceHigh: 2500000,
            currentProgress: 82.0,
            projectedCompletion: new Date('2039-06-30'),
            allocAccountTypes: ['investment', 'checking'],
          },
          {
            spaceId: pId,
            name: 'Legacy Trust',
            description: 'Trust fund for children',
            type: 'legacy',
            targetAmount: 500000,
            currency: Currency.USD,
            targetDate: new Date('2035-12-31'),
            priority: 2,
            monthlyContribution: 5000,
            expectedReturn: 0.06,
            volatility: 0.1,
            currentProbability: 97.8,
            confidenceLow: 490000,
            confidenceHigh: 600000,
            currentProgress: 100.0,
            projectedCompletion: new Date('2025-01-01'),
            allocAccountTypes: ['investment'],
          },
        ];

      case 'diego':
        return [
          {
            spaceId: pId,
            name: 'DeFi Portfolio Target',
            description: 'Grow DeFi portfolio to $100K',
            type: 'other',
            targetAmount: 100000,
            currency: Currency.USD,
            targetDate: new Date('2028-12-31'),
            priority: 1,
            monthlyContribution: 2000,
            expectedReturn: 0.12,
            volatility: 0.35,
            currentProbability: 52.8,
            confidenceLow: 60000,
            confidenceHigh: 180000,
            currentProgress: 45.0,
            projectedCompletion: new Date('2029-06-15'),
            allocAccountTypes: ['crypto'],
          },
          {
            spaceId: pId,
            name: 'Gaming Rig Upgrade',
            description: 'RTX 5090 build + VR setup',
            type: 'other',
            targetAmount: 80000,
            currency: Currency.MXN,
            targetDate: new Date('2026-12-31'),
            priority: 3,
            monthlyContribution: 3000,
            expectedReturn: 0.03,
            volatility: 0.02,
            currentProbability: 88.5,
            confidenceLow: 76000,
            confidenceHigh: 85000,
            currentProgress: 70.0,
            projectedCompletion: new Date('2026-10-01'),
            allocAccountTypes: ['checking', 'savings'],
          },
        ];

      default:
        return [];
    }
  }
}
