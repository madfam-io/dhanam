import { Currency } from '@db';
import { subDays } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

import {
  randomAmount,
  randomDate,
  transactionTemplates,
  biweeklySalaryDates,
  monthlySalaryDates,
} from './templates';
import { DemoContext } from './types';

interface TxnRow {
  accountId: string;
  amount: number;
  currency: Currency;
  description: string;
  merchant: string;
  date: Date;
  pending: boolean;
  categoryId?: string | null;
}

export class TransactionsBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    const txns: TxnRow[] = [];

    switch (ctx.personaKey) {
      case 'guest':
        this.addPersonalMX(ctx, txns, 30, 80, 6);
        break;
      case 'maria':
        this.addPersonalMX(ctx, txns, 90, 180, 12);
        this.addFreelanceIncome(ctx, txns, 90);
        this.addCryptoPurchases(ctx, txns, 90);
        break;
      case 'carlos':
        this.addPersonalMX(ctx, txns, 90, 120, 8);
        this.addBusinessMX(ctx, txns, 90, 150, 10);
        break;
      case 'patricia':
        this.addPersonalUS(ctx, txns, 90, 200, 15);
        break;
      case 'diego':
        this.addPersonalMX(ctx, txns, 90, 100, 8);
        this.addDeFi(ctx, txns, 90);
        break;
    }

    if (txns.length > 0) {
      await this.prisma.transaction.createMany({ data: txns });

      // Add AI categorization metadata and category corrections
      await this.addCategorizationIntelligence(ctx);
    }
  }

  /**
   * Adds ML categorization evidence: confidence scores in transaction metadata
   * and CategoryCorrection records showing the learning loop.
   */
  private async addCategorizationIntelligence(ctx: DemoContext): Promise<void> {
    const spaceIds = ctx.spaces.map((s) => s.id);

    // Set confidence scores on ~30% of categorized transactions
    const categorizedTxns = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId: { in: spaceIds } },
        categoryId: { not: null },
      },
      take: 100,
    });

    const toUpdate = categorizedTxns.filter(() => Math.random() < 0.3);
    for (const txn of toUpdate) {
      const confidence = Math.round((0.85 + Math.random() * 0.14) * 100) / 100;
      await this.prisma.transaction.update({
        where: { id: txn.id },
        data: {
          metadata: { categorizedBy: 'ml', confidenceScore: confidence },
        },
      });
    }

    // Mark remaining categorized as user-categorized
    const mlIds = new Set(toUpdate.map((t) => t.id));
    const userCategorized = categorizedTxns.filter((t) => !mlIds.has(t.id)).slice(0, 20);
    for (const txn of userCategorized) {
      await this.prisma.transaction.update({
        where: { id: txn.id },
        data: {
          metadata: { categorizedBy: 'user' },
        },
      });
    }

    // Create CategoryCorrection records (5-8 per persona)
    const corrections = this.getCorrectionTemplates(ctx);
    const correctionTxns = categorizedTxns.slice(0, corrections.length);

    for (let i = 0; i < Math.min(corrections.length, correctionTxns.length); i++) {
      const txn = correctionTxns[i];
      const corr = corrections[i];
      const correctedCat =
        ctx.categories.find(
          (c) =>
            c.name.toLowerCase().includes(corr.correctedTo.toLowerCase()) &&
            c.spaceId === txn.accountId
        ) ??
        ctx.categories.find((c) => c.name.toLowerCase().includes(corr.correctedTo.toLowerCase()));
      if (!correctedCat || !txn.categoryId) continue;

      const spaceId = ctx.spaces.find((s) =>
        ctx.accounts.some((a) => a.id === txn.accountId && a.spaceId === s.id)
      )?.id;
      if (!spaceId) continue;

      await this.prisma.categoryCorrection.create({
        data: {
          spaceId,
          transactionId: txn.id,
          originalCategoryId: txn.categoryId,
          correctedCategoryId: correctedCat.id,
          merchantPattern: corr.merchant,
          confidence: corr.originalConfidence,
          createdBy: ctx.user.id,
          appliedToFuture: true,
        },
      });
    }
  }

  private getCorrectionTemplates(ctx: DemoContext): Array<{
    merchant: string;
    correctedTo: string;
    originalConfidence: number;
  }> {
    switch (ctx.personaKey) {
      case 'maria':
        return [
          { merchant: 'OXXO', correctedTo: 'Entertainment', originalConfidence: 0.72 },
          { merchant: 'Amazon MX', correctedTo: 'Entertainment', originalConfidence: 0.65 },
          { merchant: 'Uber Eats', correctedTo: 'Groceries', originalConfidence: 0.78 },
          { merchant: 'MercadoLibre', correctedTo: 'Entertainment', originalConfidence: 0.58 },
          { merchant: 'Rappi', correctedTo: 'Groceries', originalConfidence: 0.71 },
          { merchant: 'Starbucks', correctedTo: 'Entertainment', originalConfidence: 0.82 },
        ];
      case 'carlos':
        return [
          { merchant: 'Costco', correctedTo: 'Inventory', originalConfidence: 0.69 },
          { merchant: 'Home Depot', correctedTo: 'Rent', originalConfidence: 0.55 },
          { merchant: 'OXXO', correctedTo: 'Entertainment', originalConfidence: 0.74 },
          { merchant: 'Liverpool', correctedTo: 'Entertainment', originalConfidence: 0.62 },
          { merchant: 'Gas Station', correctedTo: 'Transportation', originalConfidence: 0.88 },
        ];
      case 'patricia':
        return [
          { merchant: 'Amazon', correctedTo: 'Infrastructure', originalConfidence: 0.61 },
          { merchant: 'WeWork', correctedTo: 'Infrastructure', originalConfidence: 0.73 },
          { merchant: 'Uber', correctedTo: 'Salaries', originalConfidence: 0.52 },
          { merchant: 'Apple', correctedTo: 'R&D', originalConfidence: 0.67 },
          { merchant: 'Google Cloud', correctedTo: 'Infrastructure', originalConfidence: 0.91 },
        ];
      case 'diego':
        return [
          { merchant: 'Steam', correctedTo: 'Gaming Purchases', originalConfidence: 0.85 },
          { merchant: 'Discord Nitro', correctedTo: 'Gaming Purchases', originalConfidence: 0.79 },
          { merchant: 'Twitch', correctedTo: 'Entertainment', originalConfidence: 0.68 },
          { merchant: 'OpenSea', correctedTo: 'Crypto Investments', originalConfidence: 0.74 },
          { merchant: 'Binance', correctedTo: 'Crypto Investments', originalConfidence: 0.92 },
        ];
      default:
        return [
          { merchant: 'OXXO', correctedTo: 'Entertainment', originalConfidence: 0.72 },
          { merchant: 'Amazon MX', correctedTo: 'Entertainment', originalConfidence: 0.65 },
          { merchant: 'Uber Eats', correctedTo: 'Groceries', originalConfidence: 0.78 },
        ];
    }
  }

  private findAccount(ctx: DemoContext, type: string, spaceType?: string) {
    return ctx.accounts.find(
      (a) =>
        a.type === type &&
        (!spaceType || ctx.spaces.find((s) => s.id === a.spaceId)?.type === spaceType)
    );
  }

  private findCategory(ctx: DemoContext, name: string, spaceId?: string) {
    return ctx.categories.find(
      (c) =>
        c.name.toLowerCase().includes(name.toLowerCase()) && (!spaceId || c.spaceId === spaceId)
    );
  }

  private addPersonalMX(
    ctx: DemoContext,
    txns: TxnRow[],
    daysBack: number,
    expenseCount: number,
    incomeCount: number
  ) {
    const checking = this.findAccount(ctx, 'checking', 'personal');
    if (!checking) return;
    const now = new Date();
    const start = subDays(now, daysBack);
    const templates = transactionTemplates.expenses.personal_mx;

    for (let i = 0; i < expenseCount; i++) {
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const cat = this.findCategory(ctx, tpl.category, checking.spaceId);
      txns.push({
        accountId: checking.id,
        amount: -randomAmount(tpl.range[0], tpl.range[1]),
        currency: checking.currency as Currency,
        description: tpl.merchant,
        merchant: tpl.merchant,
        date: randomDate(start, now),
        pending: false,
        categoryId: cat?.id ?? null,
      });
    }

    // Salary income on biweekly schedule
    const salaryDates = biweeklySalaryDates(daysBack);
    const incomeTpl = transactionTemplates.income.personal_mx;
    for (const dt of salaryDates.slice(0, incomeCount)) {
      txns.push({
        accountId: checking.id,
        amount: randomAmount(incomeTpl[0].range[0], incomeTpl[0].range[1]),
        currency: checking.currency as Currency,
        description: incomeTpl[0].merchant,
        merchant: incomeTpl[0].merchant,
        date: dt,
        pending: false,
      });
    }
  }

  private addPersonalUS(
    ctx: DemoContext,
    txns: TxnRow[],
    daysBack: number,
    expenseCount: number,
    incomeCount: number
  ) {
    const checking = this.findAccount(ctx, 'checking');
    if (!checking) return;
    const now = new Date();
    const start = subDays(now, daysBack);
    const templates = transactionTemplates.expenses.personal_us;

    for (let i = 0; i < expenseCount; i++) {
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const cat = this.findCategory(ctx, tpl.category, checking.spaceId);
      txns.push({
        accountId: checking.id,
        amount: -randomAmount(tpl.range[0], tpl.range[1]),
        currency: Currency.USD,
        description: tpl.merchant,
        merchant: tpl.merchant,
        date: randomDate(start, now),
        pending: false,
        categoryId: cat?.id ?? null,
      });
    }

    const salaryDates = monthlySalaryDates(daysBack);
    const incomeTpl = transactionTemplates.income.personal_us;
    for (const dt of salaryDates.slice(0, incomeCount)) {
      txns.push({
        accountId: checking.id,
        amount: randomAmount(incomeTpl[0].range[0], incomeTpl[0].range[1]),
        currency: Currency.USD,
        description: incomeTpl[0].merchant,
        merchant: incomeTpl[0].merchant,
        date: dt,
        pending: false,
      });
    }
  }

  private addBusinessMX(
    ctx: DemoContext,
    txns: TxnRow[],
    daysBack: number,
    expenseCount: number,
    incomeCount: number
  ) {
    const bizSpace = ctx.spaces.find((s) => s.type === 'business');
    if (!bizSpace) return;
    const checking = ctx.accounts.find((a) => a.spaceId === bizSpace.id && a.type === 'checking');
    if (!checking) return;
    const now = new Date();
    const start = subDays(now, daysBack);
    const templates = transactionTemplates.expenses.business_mx;

    for (let i = 0; i < expenseCount; i++) {
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const cat = this.findCategory(ctx, tpl.category, bizSpace.id);
      txns.push({
        accountId: checking.id,
        amount: -randomAmount(tpl.range[0], tpl.range[1]),
        currency: Currency.MXN,
        description: tpl.merchant,
        merchant: tpl.merchant,
        date: randomDate(start, now),
        pending: false,
        categoryId: cat?.id ?? null,
      });
    }

    const revDates = monthlySalaryDates(daysBack);
    const revTpl = transactionTemplates.income.business_mx;
    for (const dt of revDates.slice(0, incomeCount)) {
      const tpl = revTpl[Math.floor(Math.random() * revTpl.length)];
      txns.push({
        accountId: checking.id,
        amount: randomAmount(tpl.range[0], tpl.range[1]),
        currency: Currency.MXN,
        description: tpl.merchant,
        merchant: tpl.merchant,
        date: dt,
        pending: false,
      });
    }
  }

  private addFreelanceIncome(ctx: DemoContext, txns: TxnRow[], daysBack: number) {
    const checking = this.findAccount(ctx, 'checking', 'personal');
    if (!checking) return;
    const dates = monthlySalaryDates(daysBack);
    for (const dt of dates) {
      txns.push({
        accountId: checking.id,
        amount: randomAmount(5000, 18000),
        currency: Currency.MXN,
        description: 'Freelance Transfer',
        merchant: 'Freelance Transfer',
        date: dt,
        pending: false,
      });
    }
  }

  private addCryptoPurchases(ctx: DemoContext, txns: TxnRow[], daysBack: number) {
    const crypto = this.findAccount(ctx, 'crypto');
    if (!crypto) return;
    const now = new Date();
    const start = subDays(now, daysBack);
    const purchases = ['BTC Purchase', 'ETH Purchase', 'SOL Purchase'];
    for (const desc of purchases) {
      txns.push({
        accountId: crypto.id,
        amount: -randomAmount(2000, 8000),
        currency: crypto.currency as Currency,
        description: desc,
        merchant: 'Bitso',
        date: randomDate(start, now),
        pending: false,
      });
    }
  }

  private addDeFi(ctx: DemoContext, txns: TxnRow[], daysBack: number) {
    const defiAccounts = ctx.accounts.filter((a) => a.subtype === 'defi' || a.subtype === 'gaming');
    if (defiAccounts.length === 0) return;
    const now = new Date();
    const start = subDays(now, daysBack);
    const templates = transactionTemplates.expenses.defi;

    for (let i = 0; i < 40; i++) {
      const account = defiAccounts[Math.floor(Math.random() * defiAccounts.length)];
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const cat = this.findCategory(ctx, tpl.category, account.spaceId);
      txns.push({
        accountId: account.id,
        amount: -randomAmount(tpl.range[0], tpl.range[1]),
        currency: account.currency as Currency,
        description: `${tpl.merchant}: Swap`,
        merchant: tpl.merchant,
        date: randomDate(start, now),
        pending: false,
        categoryId: cat?.id ?? null,
      });
    }

    // DeFi yield income
    for (const account of defiAccounts) {
      for (let i = 0; i < 5; i++) {
        txns.push({
          accountId: account.id,
          amount: randomAmount(10, 250),
          currency: account.currency as Currency,
          description: 'Yield / Staking Rewards',
          merchant: 'DeFi Protocol',
          date: randomDate(start, now),
          pending: false,
        });
      }
    }
  }
}
