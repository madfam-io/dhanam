import { subDays, subHours } from 'date-fns';

import { Prisma } from '@db';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class NotificationsBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    const now = new Date();

    const base: Prisma.UserNotificationCreateManyInput[] = [
      {
        userId: ctx.user.id,
        type: 'onboarding',
        title: 'Welcome to Dhanam!',
        message:
          'Start by exploring your dashboard. Switch personas to see different financial profiles.',
        read: true,
        createdAt: subDays(now, 30),
      },
    ];

    if (ctx.personaKey === 'guest') {
      base.push({
        userId: ctx.user.id,
        type: 'demo',
        title: 'This is a demo!',
        message:
          'Switch personas using the selector in the header to see different financial profiles.',
        read: false,
        createdAt: subHours(now, 1),
      });
    }

    if (ctx.personaKey === 'maria') {
      base.push(
        {
          userId: ctx.user.id,
          type: 'alert',
          title: 'Recurring charge detected',
          message: 'We detected a recurring charge from Bodytech Gym (MXN 599/mo). Review?',
          metadata: {
            category: 'subscription',
            merchant: 'Bodytech Gym',
            amount: 599,
            currency: 'MXN',
          } as Prisma.InputJsonValue,
          read: false,
          createdAt: subHours(now, 3),
        },
        {
          userId: ctx.user.id,
          type: 'achievement',
          title: 'Savings milestone!',
          message: "You've saved 29% of your income this month — above your 25% target!",
          metadata: { savingsRate: 0.29, target: 0.25 } as Prisma.InputJsonValue,
          read: false,
          createdAt: subDays(now, 1),
        },
        {
          userId: ctx.user.id,
          type: 'warning',
          title: 'Budget alert: Entertainment',
          message: 'Entertainment is 82% used with 8 days remaining.',
          metadata: {
            category: 'Entertainment',
            percentUsed: 82,
            daysRemaining: 8,
          } as Prisma.InputJsonValue,
          read: false,
          createdAt: subDays(now, 2),
        }
      );
    }

    if (ctx.personaKey === 'carlos') {
      base.push(
        {
          userId: ctx.user.id,
          type: 'insight',
          title: 'Revenue trending up',
          message: 'Business revenue up 12% vs last month.',
          metadata: { changePercent: 12, direction: 'up' } as Prisma.InputJsonValue,
          read: false,
          createdAt: subDays(now, 1),
        },
        {
          userId: ctx.user.id,
          type: 'reminder',
          title: 'Payroll due soon',
          message: 'Payroll of MXN 120K due in 8 days — sufficient balance confirmed.',
          metadata: { amount: 120000, currency: 'MXN', daysUntil: 8 } as Prisma.InputJsonValue,
          read: false,
          createdAt: subDays(now, 2),
        }
      );
    }

    if (ctx.personaKey === 'patricia') {
      base.push(
        {
          userId: ctx.user.id,
          type: 'status',
          title: 'Life Beat: All clear',
          message: 'Last check-in 5 days ago. Next check-in window opens in 2 days.',
          metadata: { lastCheckIn: subDays(now, 5).toISOString() } as Prisma.InputJsonValue,
          read: false,
          createdAt: subDays(now, 1),
        },
        {
          userId: ctx.user.id,
          type: 'reminder',
          title: 'Estate plan review due',
          message: 'Last reviewed 30 days ago — consider scheduling a review with your advisor.',
          metadata: { lastReview: subDays(now, 30).toISOString() } as Prisma.InputJsonValue,
          read: false,
          createdAt: subDays(now, 3),
        }
      );
    }

    if (ctx.personaKey === 'diego') {
      base.push(
        {
          userId: ctx.user.id,
          type: 'income',
          title: 'Staking rewards received',
          message: 'ETH staking rewards: +$127 this week across 3 protocols.',
          metadata: {
            amount: 127,
            currency: 'USD',
            protocols: ['Lido', 'Aave', 'Curve'],
          } as Prisma.InputJsonValue,
          read: false,
          createdAt: subHours(now, 6),
        },
        {
          userId: ctx.user.id,
          type: 'alert',
          title: 'NFT floor price drop',
          message: 'BAYC #4821 floor price dropped 8% — current value $18.5K.',
          metadata: {
            collection: 'BAYC',
            tokenId: 4821,
            changePercent: -8,
            value: 18500,
          } as Prisma.InputJsonValue,
          read: false,
          createdAt: subDays(now, 1),
        }
      );
    }

    await this.prisma.userNotification.createMany({ data: base });
  }
}
