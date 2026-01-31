import { Currency } from '@db';
import { subDays } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class EstateBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    if (ctx.personaKey === 'patricia') {
      await this.buildPatriciaEstate(ctx);
    } else if (ctx.personaKey === 'carlos') {
      await this.buildCarlosBasic(ctx);
    }
    // Other personas: no estate planning data
  }

  private async buildPatriciaEstate(ctx: DemoContext): Promise<void> {
    // Create household
    const household = await this.prisma.household.create({
      data: {
        name: 'Ruiz Family',
        type: 'family',
        baseCurrency: Currency.USD,
        description: 'Patricia Ruiz family estate planning',
      },
    });

    // Create spouse + 2 children as placeholder users
    const spouse = await this.prisma.user.create({
      data: {
        email: 'roberto.ruiz@dhanam.demo',
        passwordHash: 'DEMO_NO_PASSWORD',
        name: 'Roberto Ruiz',
        locale: 'es',
        timezone: 'America/Mexico_City',
        emailVerified: true,
        onboardingCompleted: false,
      },
    });
    const daughter = await this.prisma.user.create({
      data: {
        email: 'sofia.ruiz@dhanam.demo',
        passwordHash: 'DEMO_NO_PASSWORD',
        name: 'Sofía Ruiz',
        locale: 'es',
        timezone: 'America/Mexico_City',
        emailVerified: true,
        onboardingCompleted: false,
      },
    });
    const son = await this.prisma.user.create({
      data: {
        email: 'andres.ruiz@dhanam.demo',
        passwordHash: 'DEMO_NO_PASSWORD',
        name: 'Andrés Ruiz',
        locale: 'es',
        timezone: 'America/Mexico_City',
        emailVerified: true,
        onboardingCompleted: false,
      },
    });

    // Add household members
    const [_patriciaMember, spouseMember, daughterMember, sonMember] = await Promise.all([
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
          userId: spouse.id,
          relationship: 'spouse',
          isMinor: false,
          notes: 'Co-head of household',
        },
      }),
      this.prisma.householdMember.create({
        data: {
          householdId: household.id,
          userId: daughter.id,
          relationship: 'child',
          isMinor: false,
          notes: 'Adult daughter — attorney',
        },
      }),
      this.prisma.householdMember.create({
        data: {
          householdId: household.id,
          userId: son.id,
          relationship: 'child',
          isMinor: true,
          accessStartDate: new Date('2030-01-01'),
          notes: 'Minor son — trust access at 18',
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

    // Will
    const will = await this.prisma.will.create({
      data: {
        householdId: household.id,
        name: 'Ruiz Family Estate Plan 2025',
        status: 'active',
        lastReviewedAt: subDays(new Date(), 30),
        activatedAt: subDays(new Date(), 180),
        notes: 'Primary estate plan — reviewed annually with tax advisor',
        legalDisclaimer: true,
      },
    });

    // Beneficiaries + Executors
    await Promise.all([
      this.prisma.beneficiaryDesignation.create({
        data: {
          willId: will.id,
          beneficiaryId: spouseMember.id,
          assetType: 'bank_account',
          percentage: 50.0,
          notes: 'All liquid assets — 50%',
        },
      }),
      this.prisma.beneficiaryDesignation.create({
        data: {
          willId: will.id,
          beneficiaryId: daughterMember.id,
          assetType: 'bank_account',
          percentage: 25.0,
          notes: 'Liquid assets — 25%',
        },
      }),
      this.prisma.beneficiaryDesignation.create({
        data: {
          willId: will.id,
          beneficiaryId: sonMember.id,
          assetType: 'bank_account',
          percentage: 25.0,
          conditions: { type: 'age_requirement', minAge: 25 },
          notes: 'In trust until age 25',
        },
      }),
      this.prisma.beneficiaryDesignation.create({
        data: {
          willId: will.id,
          beneficiaryId: daughterMember.id,
          assetType: 'real_estate',
          percentage: 50.0,
          notes: 'Polanco penthouse — shared',
        },
      }),
      this.prisma.beneficiaryDesignation.create({
        data: {
          willId: will.id,
          beneficiaryId: sonMember.id,
          assetType: 'real_estate',
          percentage: 50.0,
          notes: 'Polanco penthouse — shared',
        },
      }),
      this.prisma.willExecutor.create({
        data: {
          willId: will.id,
          executorId: spouseMember.id,
          isPrimary: true,
          order: 1,
          acceptedAt: subDays(new Date(), 175),
          notes: 'Primary executor',
        },
      }),
      this.prisma.willExecutor.create({
        data: {
          willId: will.id,
          executorId: daughterMember.id,
          isPrimary: false,
          order: 2,
          acceptedAt: subDays(new Date(), 170),
          notes: 'Backup executor',
        },
      }),
    ]);

    // Life Beat config
    await this.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        lifeBeatEnabled: true,
        lifeBeatAlertDays: [30, 60, 90],
        lifeBeatLegalAgreedAt: subDays(new Date(), 180),
        lastLoginAt: subDays(new Date(), 5), // Active monitoring — last login 5 days ago
      },
    });

    // Inactivity alert history — shows Life Beat is actively monitoring
    await this.prisma.inactivityAlert.createMany({
      data: [
        {
          userId: ctx.user.id,
          alertLevel: 30,
          sentAt: subDays(new Date(), 25),
          channel: 'email',
          responded: true,
          respondedAt: subDays(new Date(), 25), // She logged in the same day
        },
        {
          userId: ctx.user.id,
          alertLevel: 60,
          sentAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
          channel: 'email',
          responded: false,
        },
        {
          userId: ctx.user.id,
          alertLevel: 90,
          sentAt: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000), // 65 days from now
          channel: 'email',
          responded: false,
        },
      ],
    });

    // Executor assignments
    await this.prisma.executorAssignment.createMany({
      data: [
        {
          userId: ctx.user.id,
          executorEmail: spouse.email,
          executorName: spouse.name,
          executorUserId: spouse.id,
          relationship: 'spouse',
          priority: 1,
          verified: true,
          verifiedAt: subDays(new Date(), 175),
        },
        {
          userId: ctx.user.id,
          executorEmail: daughter.email,
          executorName: daughter.name,
          executorUserId: daughter.id,
          relationship: 'child',
          priority: 2,
          verified: true,
          verifiedAt: subDays(new Date(), 170),
        },
      ],
    });
  }

  private async buildCarlosBasic(ctx: DemoContext): Promise<void> {
    // Basic beneficiary — just executor assignments
    await this.prisma.executorAssignment.create({
      data: {
        userId: ctx.user.id,
        executorEmail: 'spouse@dhanam.demo',
        executorName: 'Ana Mendoza',
        relationship: 'spouse',
        priority: 1,
        verified: false,
      },
    });
  }
}
