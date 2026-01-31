import { Currency } from '@db';
import { subDays } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class AnalyticsBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    await Promise.all([this.buildValuations(ctx), this.buildExchangeRates()]);
  }

  private async buildValuations(ctx: DemoContext): Promise<void> {
    const rows: Array<{
      accountId: string;
      date: Date;
      value: number;
      currency: Currency;
    }> = [];

    for (const account of ctx.accounts) {
      let value = account.balance;
      for (let i = 60; i >= 0; i--) {
        const variation = (Math.random() - 0.5) * 0.04; // +/-2%
        value = value * (1 + variation);
        rows.push({
          accountId: account.id,
          date: subDays(new Date(), i),
          value,
          currency: account.currency as Currency,
        });
      }
    }

    if (rows.length > 0) {
      await this.prisma.assetValuation.createMany({ data: rows });
    }
  }

  private async buildExchangeRates(): Promise<void> {
    // Check if rates already exist
    const existing = await this.prisma.exchangeRate.count();
    if (existing > 0) return;

    const rows: Array<{
      fromCurrency: Currency;
      toCurrency: Currency;
      rate: number;
      date: Date;
      source: string;
    }> = [];

    const pairs: Array<{ from: Currency; to: Currency; baseRate: number }> = [
      { from: Currency.MXN, to: Currency.USD, baseRate: 0.058 },
      { from: Currency.USD, to: Currency.MXN, baseRate: 17.2 },
      { from: Currency.MXN, to: Currency.EUR, baseRate: 0.054 },
      { from: Currency.EUR, to: Currency.MXN, baseRate: 18.5 },
      { from: Currency.USD, to: Currency.EUR, baseRate: 0.93 },
      { from: Currency.EUR, to: Currency.USD, baseRate: 1.08 },
    ];

    for (const { from, to, baseRate } of pairs) {
      for (let i = 60; i >= 0; i--) {
        const variation = (Math.random() - 0.5) * 0.02;
        rows.push({
          fromCurrency: from,
          toCurrency: to,
          rate: baseRate * (1 + variation),
          date: subDays(new Date(), i),
          source: 'banxico',
        });
      }
    }

    await this.prisma.exchangeRate.createMany({ data: rows });
  }
}
