import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@dhanam.app' },
    update: {},
    create: {
      email: 'demo@dhanam.app',
      passwordHash: await hash('demo123'),
      name: 'Demo User',
      locale: 'es',
      timezone: 'America/Mexico_City',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create personal space
  const personalSpace = await prisma.space.upsert({
    where: { id: 'demo-personal-space' },
    update: {},
    create: {
      id: 'demo-personal-space',
      name: 'Personal',
      type: 'personal',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      userSpaces: {
        create: {
          userId: demoUser.id,
          role: 'owner',
        },
      },
    },
  });

  console.log('✅ Created personal space:', personalSpace.name);

  // Create business space
  const businessSpace = await prisma.space.upsert({
    where: { id: 'demo-business-space' },
    update: {},
    create: {
      id: 'demo-business-space',
      name: 'Mi Negocio',
      type: 'business',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      userSpaces: {
        create: {
          userId: demoUser.id,
          role: 'owner',
        },
      },
    },
  });

  console.log('✅ Created business space:', businessSpace.name);

  // Create accounts for personal space
  const checkingAccount = await prisma.account.create({
    data: {
      spaceId: personalSpace.id,
      provider: 'manual',
      providerAccountId: 'manual-checking',
      name: 'BBVA Checking',
      type: 'checking',
      subtype: 'checking',
      currency: 'MXN',
      balance: 25000,
      lastSyncedAt: new Date(),
    },
  });

  const savingsAccount = await prisma.account.create({
    data: {
      spaceId: personalSpace.id,
      provider: 'manual',
      providerAccountId: 'manual-savings',
      name: 'BBVA Savings',
      type: 'savings',
      subtype: 'savings',
      currency: 'MXN',
      balance: 50000,
      lastSyncedAt: new Date(),
    },
  });

  const creditCard = await prisma.account.create({
    data: {
      spaceId: personalSpace.id,
      provider: 'manual',
      providerAccountId: 'manual-credit',
      name: 'Banamex Credit Card',
      type: 'credit',
      subtype: 'credit_card',
      currency: 'MXN',
      balance: -12500,
      lastSyncedAt: new Date(),
    },
  });

  console.log('✅ Created personal accounts');

  // Create budgets for personal space
  const personalBudget = await prisma.budget.create({
    data: {
      spaceId: personalSpace.id,
      name: 'Monthly Budget',
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      categories: {
        create: [
          {
            name: 'Groceries',
            budgetedAmount: 8000,
            color: '#22c55e',
            icon: 'shopping-cart',
          },
          {
            name: 'Transportation',
            budgetedAmount: 3000,
            color: '#3b82f6',
            icon: 'car',
          },
          {
            name: 'Entertainment',
            budgetedAmount: 2000,
            color: '#a855f7',
            icon: 'movie',
          },
          {
            name: 'Utilities',
            budgetedAmount: 2500,
            color: '#f59e0b',
            icon: 'home',
          },
          {
            name: 'Dining Out',
            budgetedAmount: 3500,
            color: '#ef4444',
            icon: 'utensils',
          },
        ],
      },
    },
  });

  console.log('✅ Created personal budget with categories');

  // Create sample transactions
  const categories = await prisma.category.findMany({
    where: { budgetId: personalBudget.id },
  });

  const groceriesCategory = categories.find((c) => c.name === 'Groceries')!;
  const transportCategory = categories.find((c) => c.name === 'Transportation')!;
  const diningCategory = categories.find((c) => c.name === 'Dining Out')!;

  // Groceries transactions
  await prisma.transaction.createMany({
    data: [
      {
        accountId: checkingAccount.id,
        amount: -1250,
        currency: 'MXN',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        description: 'Walmart groceries',
        merchant: 'Walmart',
        categoryId: groceriesCategory.id,
      },
      {
        accountId: checkingAccount.id,
        amount: -850,
        currency: 'MXN',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Soriana weekly shopping',
        merchant: 'Soriana',
        categoryId: groceriesCategory.id,
      },
      {
        accountId: creditCard.id,
        amount: -450,
        currency: 'MXN',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        description: 'OXXO snacks',
        merchant: 'OXXO',
        categoryId: groceriesCategory.id,
      },
    ],
  });

  // Transportation transactions
  await prisma.transaction.createMany({
    data: [
      {
        accountId: checkingAccount.id,
        amount: -500,
        currency: 'MXN',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        description: 'Uber rides',
        merchant: 'Uber',
        categoryId: transportCategory.id,
      },
      {
        accountId: checkingAccount.id,
        amount: -1200,
        currency: 'MXN',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        description: 'Gasoline',
        merchant: 'Pemex',
        categoryId: transportCategory.id,
      },
    ],
  });

  // Dining transactions
  await prisma.transaction.createMany({
    data: [
      {
        accountId: creditCard.id,
        amount: -650,
        currency: 'MXN',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Dinner at restaurant',
        merchant: 'La Casa de Toño',
        categoryId: diningCategory.id,
      },
      {
        accountId: creditCard.id,
        amount: -250,
        currency: 'MXN',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        description: 'Coffee',
        merchant: 'Starbucks',
        categoryId: diningCategory.id,
      },
    ],
  });

  // Income transaction
  await prisma.transaction.create({
    data: {
      accountId: checkingAccount.id,
      amount: 35000,
      currency: 'MXN',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      description: 'Salary deposit',
      merchant: 'Employer Inc',
    },
  });

  console.log('✅ Created sample transactions');

  // Create business account
  const businessAccount = await prisma.account.create({
    data: {
      spaceId: businessSpace.id,
      provider: 'manual',
      providerAccountId: 'manual-business',
      name: 'Business Checking',
      type: 'checking',
      subtype: 'business_checking',
      currency: 'MXN',
      balance: 125000,
      lastSyncedAt: new Date(),
    },
  });

  console.log('✅ Created business account');

  console.log('✨ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });