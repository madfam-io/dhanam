import { PrismaClient, Currency } from '../../generated/prisma';
import { subDays, subMonths, addDays } from 'date-fns';
import { SeedContext } from './helpers';

export async function seedMetadata(prisma: PrismaClient, ctx: SeedContext) {
  // 1. EXCHANGE RATES (batch)
  console.log('\n💱 Creating exchange rates...');

  const baseRates = { MXN_USD: 17.15, MXN_EUR: 18.85, USD_EUR: 1.10 };
  const exchangeRateRows: Array<{
    fromCurrency: Currency;
    toCurrency: Currency;
    rate: number;
    date: Date;
    source: string;
  }> = [];

  for (let i = 60; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const fluctuation = () => 1 + (Math.random() - 0.5) * 0.01;

    exchangeRateRows.push(
      { fromCurrency: Currency.MXN, toCurrency: Currency.USD, rate: 1 / (baseRates.MXN_USD * fluctuation()), date, source: 'banxico' },
      { fromCurrency: Currency.USD, toCurrency: Currency.MXN, rate: baseRates.MXN_USD * fluctuation(), date, source: 'banxico' },
      { fromCurrency: Currency.MXN, toCurrency: Currency.EUR, rate: 1 / (baseRates.MXN_EUR * fluctuation()), date, source: 'ecb' },
      { fromCurrency: Currency.EUR, toCurrency: Currency.MXN, rate: baseRates.MXN_EUR * fluctuation(), date, source: 'ecb' },
      { fromCurrency: Currency.USD, toCurrency: Currency.EUR, rate: 1 / (baseRates.USD_EUR * fluctuation()), date, source: 'ecb' },
      { fromCurrency: Currency.EUR, toCurrency: Currency.USD, rate: baseRates.USD_EUR * fluctuation(), date, source: 'ecb' },
    );
  }

  await prisma.exchangeRate.createMany({ data: exchangeRateRows });
  console.log('  ✓ Created 366 exchange rates (61 days × 6 pairs)');

  // 2. INCOME EVENTS & ZERO-BASED BUDGETING (Maria)
  console.log('\n💵 Creating income events and zero-based budgeting...');

  const mariaCategories = await prisma.category.findMany({
    where: { budget: { spaceId: ctx.mariaSpace.id } },
  });

  for (let month = 2; month >= 0; month--) {
    const salaryDate = subMonths(new Date(), month);
    const freelanceDate = addDays(salaryDate, 15);

    const salaryEvent = await prisma.incomeEvent.create({
      data: {
        spaceId: ctx.mariaSpace.id,
        amount: 42000,
        currency: Currency.MXN,
        source: 'paycheck',
        description: 'Biweekly salary - TechStartup',
        receivedAt: salaryDate,
        isAllocated: true,
      },
    });

    const freelanceEvent = await prisma.incomeEvent.create({
      data: {
        spaceId: ctx.mariaSpace.id,
        amount: 12000,
        currency: Currency.MXN,
        source: 'freelance',
        description: 'Freelance web design project',
        receivedAt: freelanceDate,
        isAllocated: true,
      },
    });

    // Salary allocations
    const salaryAllocations = [
      { name: 'Rent', amount: 15000 },
      { name: 'Groceries', amount: 6000 },
      { name: 'Transportation', amount: 3000 },
      { name: 'Entertainment', amount: 3000 },
      { name: 'Savings', amount: 8000 },
      { name: 'Utilities', amount: 2500 },
      { name: 'Food & Dining', amount: 4500 },
    ];

    const salaryAllocRows: Array<{ incomeEventId: string; categoryId: string; amount: number }> = [];
    for (const alloc of salaryAllocations) {
      const cat = mariaCategories.find(c => c.name === alloc.name);
      if (cat) {
        salaryAllocRows.push({ incomeEventId: salaryEvent.id, categoryId: cat.id, amount: alloc.amount });
      }
    }
    await prisma.incomeAllocation.createMany({ data: salaryAllocRows });

    // Freelance allocations
    const freelanceAllocations = [
      { name: 'Savings', amount: 7000 },
      { name: 'Entertainment', amount: 2000 },
      { name: 'Food & Dining', amount: 3000 },
    ];

    const freelanceAllocRows: Array<{ incomeEventId: string; categoryId: string; amount: number }> = [];
    for (const alloc of freelanceAllocations) {
      const cat = mariaCategories.find(c => c.name === alloc.name);
      if (cat) {
        freelanceAllocRows.push({ incomeEventId: freelanceEvent.id, categoryId: cat.id, amount: alloc.amount });
      }
    }
    await prisma.incomeAllocation.createMany({ data: freelanceAllocRows });
  }

  // Category goals
  const categoryGoalData = [
    { name: 'Rent', goalType: 'monthly_spending' as const, targetAmount: 15000, monthlyFunding: 15000 },
    { name: 'Savings', goalType: 'target_balance' as const, targetAmount: 200000, monthlyFunding: 15000, targetDate: new Date('2026-12-31') },
    { name: 'Groceries', goalType: 'monthly_spending' as const, targetAmount: 6000, monthlyFunding: 6000 },
    { name: 'Entertainment', goalType: 'percentage_income' as const, percentageTarget: 10, monthlyFunding: 5000 },
  ];

  const catGoalRows: Array<{
    categoryId: string;
    goalType: 'monthly_spending' | 'target_balance' | 'percentage_income';
    targetAmount?: number | null;
    targetDate?: Date | null;
    monthlyFunding?: number | null;
    percentageTarget?: number | null;
  }> = [];

  for (const cg of categoryGoalData) {
    const cat = mariaCategories.find(c => c.name === cg.name);
    if (cat) {
      catGoalRows.push({
        categoryId: cat.id,
        goalType: cg.goalType,
        targetAmount: cg.targetAmount ?? null,
        targetDate: (cg as any).targetDate ?? null,
        monthlyFunding: cg.monthlyFunding ?? null,
        percentageTarget: (cg as any).percentageTarget ?? null,
      });
    }
  }
  await prisma.categoryGoal.createMany({ data: catGoalRows });

  console.log('  ✓ Created 6 income events with 30 allocations');
  console.log('  ✓ Created 4 category goals');

  // 3. BILLING EVENTS (batch)
  console.log('\n💳 Creating billing events...');

  await prisma.billingEvent.createMany({
    data: [
      { userId: ctx.adminUser.id, type: 'subscription_created', amount: 9.99, currency: Currency.USD, status: 'succeeded', createdAt: subDays(new Date(), 180) },
      { userId: ctx.adminUser.id, type: 'subscription_renewed', amount: 9.99, currency: Currency.USD, status: 'succeeded', createdAt: subDays(new Date(), 30) },
      { userId: ctx.mariaUser.id, type: 'payment_failed', amount: 9.99, currency: Currency.USD, status: 'failed', metadata: { reason: 'card_declined', retryAt: addDays(new Date(), 3).toISOString() }, createdAt: subDays(new Date(), 5) },
    ],
  });

  console.log('  ✓ Created 3 billing events');

  // 4. USAGE METRICS (batch)
  console.log('\n📊 Creating usage metrics...');

  const activeUsers = [ctx.mariaUser, ctx.carlosUser, ctx.adminUser, ctx.diegoUser];
  const metricTypes = ['esg_calculation', 'monte_carlo_simulation', 'goal_probability', 'scenario_analysis', 'api_request'] as const;

  const metricRows: Array<{ userId: string; metricType: typeof metricTypes[number]; count: number; date: Date }> = [];
  for (const user of activeUsers) {
    for (const metricType of metricTypes) {
      metricRows.push({
        userId: user.id,
        metricType,
        count: Math.floor(Math.random() * 50) + 1,
        date: new Date(),
      });
    }
  }
  await prisma.usageMetric.createMany({ data: metricRows });

  console.log('  ✓ Created 20 usage metrics');

  // 5. NOTIFICATIONS (batch)
  console.log('\n🔔 Creating notifications...');

  await prisma.userNotification.createMany({
    data: [
      { userId: ctx.mariaUser.id, type: 'budget_alert', title: 'Budget Alert: Entertainment', message: 'You have used 85% of your Entertainment budget this month.', createdAt: subDays(new Date(), 2) },
      { userId: ctx.mariaUser.id, type: 'sync_complete', title: 'Account Sync Complete', message: 'All 4 accounts synced successfully.', read: true, readAt: subDays(new Date(), 1), createdAt: subDays(new Date(), 1) },
      { userId: ctx.carlosUser.id, type: 'budget_alert', title: 'Budget Alert: Inventory', message: 'Business inventory budget is 92% spent with 10 days remaining.', createdAt: subDays(new Date(), 3) },
      { userId: ctx.carlosUser.id, type: 'security_alert', title: 'New Login Detected', message: 'A new login was detected from Chrome on macOS. If this was not you, please change your password.', createdAt: subDays(new Date(), 7) },
      { userId: ctx.adminUser.id, type: 'subscription_renewal', title: 'Subscription Renewal', message: 'Your premium subscription will renew in 5 days ($9.99/month).', createdAt: subDays(new Date(), 5) },
      { userId: ctx.adminUser.id, type: 'sync_complete', title: 'Enterprise Sync Complete', message: 'All enterprise accounts have been synced. 3 new transactions detected.', read: true, readAt: new Date(), createdAt: new Date() },
      { userId: ctx.diegoUser.id, type: 'budget_alert', title: 'Budget Alert: Crypto Investments', message: 'Your crypto investment allocation for this month has been fully used.', createdAt: subDays(new Date(), 1) },
      { userId: ctx.diegoUser.id, type: 'security_alert', title: 'TOTP Reminder', message: 'Enable two-factor authentication for enhanced account security.', createdAt: subDays(new Date(), 14) },
    ],
  });

  console.log('  ✓ Created 8 notifications');
}
