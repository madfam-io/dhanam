import { Currency, RecurrenceFrequency, RecurringStatus } from '@db';
import { subDays, addDays } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

interface RecurringDef {
  spaceId: string;
  merchantName: string;
  expectedAmount: number;
  currency: Currency;
  frequency: RecurrenceFrequency;
  categoryName?: string;
}

export class RecurringBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    const defs = this.getRecurringForPersona(ctx);
    if (defs.length === 0) return;

    const rows = defs.map((d, i) => {
      const cat = ctx.categories.find(
        (c) =>
          d.categoryName &&
          c.name.toLowerCase().includes(d.categoryName.toLowerCase()) &&
          c.spaceId === d.spaceId
      );

      // Mix of statuses: 60% confirmed, 25% detected, 15% dismissed
      const totalDefs = defs.length;
      const confirmedThreshold = Math.ceil(totalDefs * 0.6);
      const detectedThreshold = Math.ceil(totalDefs * 0.85);

      let status: RecurringStatus;
      let confidence: number;
      let confirmedAt: Date | null;

      if (i < confirmedThreshold) {
        status = RecurringStatus.confirmed;
        confidence = 0.92 + Math.random() * 0.07;
        confirmedAt = subDays(new Date(), 60);
      } else if (i < detectedThreshold) {
        status = RecurringStatus.detected;
        confidence = 0.78 + Math.random() * 0.14; // 0.78-0.92
        confirmedAt = null;
      } else {
        status = RecurringStatus.dismissed;
        confidence = 0.65 + Math.random() * 0.15;
        confirmedAt = null;
      }

      const annualCost =
        d.frequency === 'monthly'
          ? d.expectedAmount * 12
          : d.frequency === 'biweekly'
            ? d.expectedAmount * 26
            : d.frequency === 'weekly'
              ? d.expectedAmount * 52
              : d.expectedAmount;

      return {
        spaceId: d.spaceId,
        merchantName: d.merchantName,
        expectedAmount: d.expectedAmount,
        currency: d.currency,
        frequency: d.frequency,
        status,
        categoryId: cat?.id ?? null,
        lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 28)),
        nextExpected: addDays(new Date(), Math.floor(Math.random() * 28) + 1),
        occurrenceCount: Math.floor(Math.random() * 12) + 3,
        confidence: Math.round(confidence * 100) / 100,
        confirmedAt,
        alertBeforeDays: 3,
        alertEnabled: status === RecurringStatus.confirmed,
        metadata: { annualCost: Math.round(annualCost) },
      };
    });

    await this.prisma.recurringTransaction.createMany({ data: rows });

    // For María: add a "detected" gym membership she forgot about
    if (ctx.personaKey === 'maria') {
      const pId = ctx.spaces.find((s) => s.type === 'personal')?.id;
      if (pId) {
        await this.prisma.recurringTransaction.create({
          data: {
            spaceId: pId,
            merchantName: 'Bodytech Gym',
            expectedAmount: 599,
            currency: Currency.MXN,
            frequency: 'monthly',
            status: RecurringStatus.detected,
            lastOccurrence: subDays(new Date(), 15),
            nextExpected: addDays(new Date(), 15),
            occurrenceCount: 8,
            confidence: 0.89,
            alertBeforeDays: 3,
            alertEnabled: false,
            metadata: {
              annualCost: 7188,
              detectionNote: 'Detected recurring charge — you may have forgotten this subscription',
            },
          },
        });
      }
    }
  }

  private getRecurringForPersona(ctx: DemoContext): RecurringDef[] {
    const personal = ctx.spaces.find((s) => s.type === 'personal');
    const business = ctx.spaces.find((s) => s.type === 'business');
    const pId = personal?.id ?? ctx.spaces[0]?.id;
    if (!pId) return [];

    switch (ctx.personaKey) {
      case 'guest':
        return [
          {
            spaceId: pId,
            merchantName: 'Renta Departamento',
            expectedAmount: 12000,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Rent',
          },
          {
            spaceId: pId,
            merchantName: 'Netflix MX',
            expectedAmount: 199,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Entertainment',
          },
          {
            spaceId: pId,
            merchantName: 'Nómina BBVA',
            expectedAmount: 55000,
            currency: Currency.MXN,
            frequency: 'biweekly',
            categoryName: 'Salary',
          },
        ];

      case 'maria':
        return [
          {
            spaceId: pId,
            merchantName: 'Renta Departamento',
            expectedAmount: 15000,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Rent',
          },
          {
            spaceId: pId,
            merchantName: 'Nómina BBVA',
            expectedAmount: 32500,
            currency: Currency.MXN,
            frequency: 'biweekly',
          },
          {
            spaceId: pId,
            merchantName: 'Sports World',
            expectedAmount: 799,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Entertainment',
          },
          {
            spaceId: pId,
            merchantName: 'Netflix MX',
            expectedAmount: 199,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Entertainment',
          },
          {
            spaceId: pId,
            merchantName: 'Spotify MX',
            expectedAmount: 115,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Entertainment',
          },
        ];

      case 'carlos': {
        const bId = business?.id ?? pId;
        return [
          {
            spaceId: pId,
            merchantName: 'Salario Personal',
            expectedAmount: 85000,
            currency: Currency.MXN,
            frequency: 'monthly',
          },
          {
            spaceId: pId,
            merchantName: 'Seguro Auto',
            expectedAmount: 3200,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Insurance',
          },
          {
            spaceId: bId,
            merchantName: 'Renta Local',
            expectedAmount: 45000,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Rent',
          },
          {
            spaceId: bId,
            merchantName: 'Préstamo Bancario',
            expectedAmount: 28000,
            currency: Currency.MXN,
            frequency: 'monthly',
          },
          {
            spaceId: bId,
            merchantName: 'Nómina Empleados',
            expectedAmount: 120000,
            currency: Currency.MXN,
            frequency: 'biweekly',
            categoryName: 'Payroll',
          },
        ];
      }

      case 'patricia': {
        const sId = business?.id ?? pId;
        return [
          {
            spaceId: sId,
            merchantName: 'Direct Deposit - TechCorp',
            expectedAmount: 45000,
            currency: Currency.USD,
            frequency: 'monthly',
            categoryName: 'Salaries',
          },
          {
            spaceId: sId,
            merchantName: 'Amex Autopay',
            expectedAmount: 12500,
            currency: Currency.USD,
            frequency: 'monthly',
          },
          {
            spaceId: sId,
            merchantName: 'Insurance Premium',
            expectedAmount: 2500,
            currency: Currency.USD,
            frequency: 'monthly',
          },
          {
            spaceId: sId,
            merchantName: 'Housekeeper',
            expectedAmount: 8000,
            currency: Currency.MXN,
            frequency: 'biweekly',
          },
        ];
      }

      case 'diego':
        return [
          {
            spaceId: pId,
            merchantName: 'Renta Departamento',
            expectedAmount: 12000,
            currency: Currency.MXN,
            frequency: 'monthly',
            categoryName: 'Rent',
          },
          {
            spaceId: pId,
            merchantName: 'Cloud Hosting (AWS)',
            expectedAmount: 1200,
            currency: Currency.MXN,
            frequency: 'monthly',
          },
          {
            spaceId: pId,
            merchantName: 'Nómina Semanal',
            expectedAmount: 13750,
            currency: Currency.MXN,
            frequency: 'weekly',
          },
          {
            spaceId: pId,
            merchantName: 'Sandbox LAND Rental',
            expectedAmount: 150,
            currency: Currency.USD,
            frequency: 'monthly',
          },
          {
            spaceId: pId,
            merchantName: 'Sandbox LAND Rental #2',
            expectedAmount: 150,
            currency: Currency.USD,
            frequency: 'monthly',
          },
          {
            spaceId: pId,
            merchantName: 'Axie Scholarship',
            expectedAmount: 80,
            currency: Currency.USD,
            frequency: 'weekly',
          },
        ];

      default:
        return [];
    }
  }
}
