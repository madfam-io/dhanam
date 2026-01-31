import { Currency, GoalShareStatus } from '@db';
import { subDays } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class HouseholdBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    if (ctx.personaKey !== 'carlos') return;
    await this.buildCarlosHousehold(ctx);
  }

  private async buildCarlosHousehold(ctx: DemoContext): Promise<void> {
    const personal = ctx.spaces.find((s) => s.type === 'personal');
    if (!personal) return;

    // Create household
    const household = await this.prisma.household.create({
      data: {
        name: 'Mendoza Family',
        type: 'family',
        baseCurrency: Currency.MXN,
        description: 'Carlos & Ana Mendoza household',
      },
    });

    // Create placeholder spouse user
    const ana = await this.prisma.user.create({
      data: {
        email: 'ana.mendoza@dhanam.demo',
        passwordHash: 'DEMO_NO_PASSWORD',
        name: 'Ana Mendoza',
        locale: 'es',
        timezone: 'America/Mexico_City',
        emailVerified: true,
        onboardingCompleted: false,
      },
    });

    // Create household members
    await Promise.all([
      this.prisma.householdMember.create({
        data: {
          householdId: household.id,
          userId: ctx.user.id,
          relationship: 'spouse',
          isMinor: false,
          notes: 'Head of household',
        },
      }),
      this.prisma.householdMember.create({
        data: {
          householdId: household.id,
          userId: ana.id,
          relationship: 'spouse',
          isMinor: false,
          notes: 'Co-head of household',
        },
      }),
    ]);

    // Link spaces to household
    for (const space of ctx.spaces) {
      await this.prisma.space.update({
        where: { id: space.id },
        data: { householdId: household.id },
      });
    }

    // Create transaction splits on shared expenses
    const personalChecking = ctx.accounts.find(
      (a) => a.spaceId === personal.id && a.type === 'checking'
    );
    if (personalChecking) {
      const sharedTxns = await this.prisma.transaction.findMany({
        where: {
          accountId: personalChecking.id,
          amount: { lt: 0 }, // expenses only
        },
        orderBy: { date: 'desc' },
        take: 15,
      });

      for (const txn of sharedTxns) {
        const isRentOrUtility = /renta|luz|agua|gas|cfe|telmex/i.test(
          txn.description + ' ' + (txn.merchant ?? '')
        );
        const percentage = isRentOrUtility ? 50 : 70; // 50/50 for rent/utilities, 70/30 for rest
        const amount = Number(txn.amount);

        await this.prisma.transaction.update({
          where: { id: txn.id },
          data: { isSplit: true },
        });

        await this.prisma.transactionSplit.createMany({
          data: [
            {
              transactionId: txn.id,
              userId: ctx.user.id,
              amount: Math.abs(amount) * (percentage / 100),
              percentage,
            },
            {
              transactionId: txn.id,
              userId: ana.id,
              amount: Math.abs(amount) * ((100 - percentage) / 100),
              percentage: 100 - percentage,
            },
          ],
        });
      }
    }

    // Account sharing permissions
    if (personalChecking) {
      await this.prisma.accountSharingPermission.create({
        data: {
          accountId: personalChecking.id,
          sharedWithId: ana.id,
          canView: true,
          canEdit: false,
          canDelete: false,
        },
      });
    }

    // Goal shares — share restaurant goal with Ana
    const goals = await this.prisma.goal.findMany({
      where: {
        spaceId: { in: ctx.spaces.map((s) => s.id) },
      },
      take: 2,
    });

    for (const goal of goals) {
      await this.prisma.goalShare.create({
        data: {
          goalId: goal.id,
          sharedWith: ana.id,
          role: 'contributor',
          invitedBy: ctx.user.id,
          status: GoalShareStatus.accepted,
          acceptedAt: subDays(new Date(), 30),
          message: 'Contributing together!',
        },
      });
    }
  }
}
