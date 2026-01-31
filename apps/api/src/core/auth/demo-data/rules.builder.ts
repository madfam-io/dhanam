import { Prisma } from '@db';

import { PrismaService } from '../../prisma/prisma.service';

import { DemoContext } from './types';

export class RulesBuilder {
  constructor(private prisma: PrismaService) {}

  async build(ctx: DemoContext): Promise<void> {
    const findCategory = (name: string) =>
      ctx.categories.find((c) => c.name.toLowerCase() === name.toLowerCase());

    const rules: Array<{
      spaceId: string;
      name: string;
      conditions: Prisma.InputJsonValue;
      categoryId: string | undefined;
      priority: number;
      enabled: boolean;
    }> = [];

    if (ctx.personaKey === 'maria') {
      const spaceId = ctx.spaces[0]?.id;
      if (!spaceId) return;

      const groceries = findCategory('Groceries');
      const entertainment = findCategory('Entertainment');

      rules.push(
        {
          spaceId,
          name: 'Grocery Stores',
          conditions: { descriptionPattern: 'walmart|soriana|chedraui|heb', type: 'regex' },
          categoryId: groceries?.id,
          priority: 1,
          enabled: true,
        },
        {
          spaceId,
          name: 'Food Delivery',
          conditions: { descriptionPattern: 'uber eats|rappi|didi food', type: 'regex' },
          categoryId: groceries?.id,
          priority: 2,
          enabled: true,
        },
        {
          spaceId,
          name: 'Streaming Services',
          conditions: { descriptionPattern: 'netflix|spotify|disney', type: 'regex' },
          categoryId: entertainment?.id,
          priority: 3,
          enabled: true,
        },
        {
          spaceId,
          name: 'Convenience Stores',
          conditions: { descriptionPattern: 'oxxo|7-eleven', type: 'regex' },
          categoryId: entertainment?.id,
          priority: 4,
          enabled: true,
        },
      );
    }

    if (ctx.personaKey === 'carlos') {
      // Use business space (second space)
      const bizSpace = ctx.spaces.find((s) => s.type === 'business');
      if (!bizSpace) return;

      const inventory = findCategory('Inventory');
      const payroll = findCategory('Payroll');

      rules.push(
        {
          spaceId: bizSpace.id,
          name: 'Restaurant Suppliers',
          conditions: { descriptionPattern: 'sysco|costos|proveedora', type: 'regex' },
          categoryId: inventory?.id,
          priority: 1,
          enabled: true,
        },
        {
          spaceId: bizSpace.id,
          name: 'Employee Expenses',
          conditions: { descriptionPattern: 'nomina|imss|infonavit', type: 'regex' },
          categoryId: payroll?.id,
          priority: 2,
          enabled: true,
        },
      );
    }

    if (ctx.personaKey === 'patricia') {
      const spaceId = ctx.spaces[0]?.id;
      if (!spaceId) return;

      const infra = findCategory('Infrastructure');

      rules.push({
        spaceId,
        name: 'SaaS Tools',
        conditions: { descriptionPattern: 'aws|google cloud|slack|notion', type: 'regex' },
        categoryId: infra?.id,
        priority: 1,
        enabled: true,
      });
    }

    if (ctx.personaKey === 'diego') {
      const spaceId = ctx.spaces[0]?.id;
      if (!spaceId) return;

      const crypto = findCategory('Crypto Investments');
      const gaming = findCategory('Gaming Purchases');

      rules.push(
        {
          spaceId,
          name: 'Crypto Exchanges',
          conditions: { descriptionPattern: 'binance|bitso|opensea', type: 'regex' },
          categoryId: crypto?.id,
          priority: 1,
          enabled: true,
        },
        {
          spaceId,
          name: 'Gaming Platforms',
          conditions: { descriptionPattern: 'steam|epic|discord', type: 'regex' },
          categoryId: gaming?.id,
          priority: 2,
          enabled: true,
        },
      );
    }

    if (rules.length > 0) {
      await this.prisma.transactionRule.createMany({
        data: rules
          .filter((r) => r.categoryId)
          .map((r) => ({ ...r, categoryId: r.categoryId! })),
      });
    }
  }
}
