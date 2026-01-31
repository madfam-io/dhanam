import { addDays, startOfWeek } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

interface ForecastConfig {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currency: string;
}

export class CashflowBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    const configs = this.getConfigsForPersona(ctx);
    if (configs.length === 0) return;

    const now = new Date();
    const startDate = startOfWeek(now, { weekStartsOn: 1 });
    const endDate = addDays(startDate, 56); // 8 weeks

    for (const { spaceId, config } of configs) {
      const weeks = this.generateWeeklyData(config, startDate);

      await this.prisma.cashflowForecast.create({
        data: {
          spaceId,
          startDate,
          endDate,
          weeks,
          confidence: 0.87,
          generatedAt: now,
        },
      });
    }
  }

  private generateWeeklyData(config: ForecastConfig, startDate: Date): object[] {
    const weeklyIncome = config.monthlyIncome / 4.33;
    const weeklyExpenses = config.monthlyExpenses / 4.33;
    let balance = config.currentBalance;
    const weeks: object[] = [];

    for (let w = 0; w < 8; w++) {
      const variance = 1 + (Math.random() - 0.5) * 0.16; // ±8%
      const isActual = w === 0;
      const income = Math.round(weeklyIncome * (isActual ? 1 : variance) * 100) / 100;
      const expenses = Math.round(weeklyExpenses * (isActual ? 1 : variance) * 100) / 100;
      const net = Math.round((income - expenses) * 100) / 100;
      balance = Math.round((balance + net) * 100) / 100;

      weeks.push({
        weekStart: addDays(startDate, w * 7)
          .toISOString()
          .split('T')[0],
        income,
        expenses,
        net,
        balance,
        isProjected: !isActual,
      });
    }

    return weeks;
  }

  private getConfigsForPersona(
    ctx: DemoContext
  ): Array<{ spaceId: string; config: ForecastConfig }> {
    const personal = ctx.spaces.find((s) => s.type === 'personal');
    const business = ctx.spaces.find((s) => s.type === 'business');

    switch (ctx.personaKey) {
      case 'guest':
        return personal
          ? [
              {
                spaceId: personal.id,
                config: {
                  currentBalance: 45000,
                  monthlyIncome: 55000,
                  monthlyExpenses: 38000,
                  currency: 'MXN',
                },
              },
            ]
          : [];

      case 'maria':
        return personal
          ? [
              {
                spaceId: personal.id,
                config: {
                  currentBalance: 85000,
                  monthlyIncome: 73000,
                  monthlyExpenses: 52000,
                  currency: 'MXN',
                },
              },
            ]
          : [];

      case 'carlos': {
        const results: Array<{ spaceId: string; config: ForecastConfig }> = [];
        if (personal) {
          results.push({
            spaceId: personal.id,
            config: {
              currentBalance: 120000,
              monthlyIncome: 65000,
              monthlyExpenses: 48000,
              currency: 'MXN',
            },
          });
        }
        if (business) {
          results.push({
            spaceId: business.id,
            config: {
              currentBalance: 380000,
              monthlyIncome: 250000,
              monthlyExpenses: 195000,
              currency: 'MXN',
            },
          });
        }
        return results;
      }

      case 'patricia':
        return business
          ? [
              {
                spaceId: business.id,
                config: {
                  currentBalance: 285000,
                  monthlyIncome: 45000,
                  monthlyExpenses: 32000,
                  currency: 'USD',
                },
              },
            ]
          : [];

      case 'diego':
        return personal
          ? [
              {
                spaceId: personal.id,
                config: {
                  currentBalance: 42000,
                  monthlyIncome: 35000,
                  monthlyExpenses: 28000,
                  currency: 'MXN',
                },
              },
            ]
          : [];

      default:
        return [];
    }
  }
}
