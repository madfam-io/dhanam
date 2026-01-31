import { subDays } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class ReportsBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    await Promise.all([this.buildSavedReports(ctx), this.buildNotifications(ctx)]);
  }

  private async buildSavedReports(ctx: DemoContext): Promise<void> {
    const spaceId = ctx.spaces[0]?.id;
    if (!spaceId) return;

    const reports: Array<{
      spaceId: string;
      name: string;
      type: string;
      schedule: string | null;
      format: string;
      lastRunAt: Date;
    }> = [
      {
        spaceId,
        name: 'Monthly Spending Report',
        type: 'monthly_spending',
        schedule: '0 8 1 * *',
        format: 'pdf',
        lastRunAt: subDays(new Date(), 3),
      },
    ];

    if (ctx.personaKey === 'patricia') {
      reports.push(
        {
          spaceId,
          name: 'Quarterly Net Worth',
          type: 'quarterly_net_worth',
          schedule: '0 8 1 */3 *',
          format: 'pdf',
          lastRunAt: subDays(new Date(), 15),
        },
        {
          spaceId,
          name: 'Annual Tax Overview',
          type: 'annual_tax',
          schedule: null,
          format: 'csv',
          lastRunAt: subDays(new Date(), 45),
        }
      );
    }

    await this.prisma.savedReport.createMany({ data: reports });
  }

  private async buildNotifications(ctx: DemoContext): Promise<void> {
    const notifs: Array<{
      userId: string;
      type: string;
      title: string;
      message: string;
      read: boolean;
      createdAt: Date;
    }> = [
      {
        userId: ctx.user.id,
        type: 'sync_success',
        title: 'Accounts synced',
        message: 'All connected accounts synced successfully.',
        read: true,
        createdAt: subDays(new Date(), 1),
      },
      {
        userId: ctx.user.id,
        type: 'budget_alert',
        title: 'Budget warning',
        message: "You've used 85% of your Entertainment budget this month.",
        read: false,
        createdAt: subDays(new Date(), 2),
      },
      {
        userId: ctx.user.id,
        type: 'goal_milestone',
        title: 'Goal progress!',
        message: "You're halfway to your savings goal. Keep it up!",
        read: false,
        createdAt: subDays(new Date(), 5),
      },
      {
        userId: ctx.user.id,
        type: 'sync_success',
        title: 'Accounts synced',
        message: 'Scheduled sync completed — 0 new transactions.',
        read: true,
        createdAt: subDays(new Date(), 7),
      },
      {
        userId: ctx.user.id,
        type: 'budget_alert',
        title: 'Monthly budget reset',
        message: 'Your monthly budgets have been reset. Last month: 92% utilized.',
        read: true,
        createdAt: subDays(new Date(), 14),
      },
    ];

    if (ctx.personaKey === 'patricia') {
      notifs.push(
        {
          userId: ctx.user.id,
          type: 'report_ready',
          title: 'Report generated',
          message: 'Your Quarterly Net Worth report is ready to download.',
          read: false,
          createdAt: subDays(new Date(), 3),
        },
        {
          userId: ctx.user.id,
          type: 'estate_reminder',
          title: 'Estate plan review due',
          message: "It's been 6 months since your last estate plan review.",
          read: false,
          createdAt: subDays(new Date(), 10),
        },
        {
          userId: ctx.user.id,
          type: 'life_beat',
          title: 'Life Beat check-in',
          message: 'Confirm activity to keep your Life Beat status active.',
          read: true,
          createdAt: subDays(new Date(), 20),
        }
      );
    }

    if (ctx.personaKey === 'diego') {
      notifs.push(
        {
          userId: ctx.user.id,
          type: 'price_alert',
          title: 'BTC price alert',
          message: 'Bitcoin dropped below $58,000 — your stop-loss order is active.',
          read: false,
          createdAt: subDays(new Date(), 1),
        },
        {
          userId: ctx.user.id,
          type: 'defi_yield',
          title: 'DeFi yield update',
          message: 'Your Aave V3 position earned $120 in interest this week.',
          read: true,
          createdAt: subDays(new Date(), 3),
        },
        {
          userId: ctx.user.id,
          type: 'esg_update',
          title: 'ESG score change',
          message: "Ethereum's environmental score improved after the Dencun upgrade.",
          read: false,
          createdAt: subDays(new Date(), 8),
        }
      );
    }

    await this.prisma.userNotification.createMany({ data: notifs });
  }
}
