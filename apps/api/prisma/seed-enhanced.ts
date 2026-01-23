import { PrismaClient, Currency, SpaceType, BudgetPeriod, AccountType, Provider } from '@prisma/client';
import { hash } from 'argon2';
import { addDays, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

// Helper to generate realistic transaction amounts
const randomAmount = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1) + min);

// Helper to generate dates within a range
const randomDate = (start: Date, end: Date) => 
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Transaction templates for realistic data
const transactionTemplates = {
  income: [
    { name: 'Salary', category: 'Salary', range: [45000, 85000] },
    { name: 'Freelance Payment', category: 'Freelance', range: [5000, 25000] },
    { name: 'Investment Returns', category: 'Investment', range: [1000, 10000] },
    { name: 'Rental Income', category: 'Rental', range: [8000, 15000] },
  ],
  expenses: {
    personal: [
      { name: 'Oxxo', category: 'Groceries', range: [150, 500] },
      { name: 'Soriana', category: 'Groceries', range: [1200, 3500] },
      { name: 'Netflix', category: 'Entertainment', range: [149, 299] },
      { name: 'Spotify', category: 'Entertainment', range: [115, 169] },
      { name: 'CFE', category: 'Utilities', range: [500, 2500] },
      { name: 'Telmex', category: 'Utilities', range: [599, 1299] },
      { name: 'Pemex', category: 'Transportation', range: [500, 1500] },
      { name: 'Uber', category: 'Transportation', range: [80, 350] },
      { name: 'Starbucks', category: 'Food & Dining', range: [85, 180] },
      { name: 'Restaurant', category: 'Food & Dining', range: [350, 1500] },
      { name: 'Amazon', category: 'Shopping', range: [299, 2500] },
      { name: 'Liverpool', category: 'Shopping', range: [1500, 8000] },
    ],
    business: [
      { name: 'Office Rent', category: 'Rent', range: [15000, 35000] },
      { name: 'Payroll', category: 'Payroll', range: [50000, 150000] },
      { name: 'Software Licenses', category: 'Software', range: [2000, 10000] },
      { name: 'Marketing Ads', category: 'Marketing', range: [5000, 25000] },
      { name: 'Office Supplies', category: 'Supplies', range: [1000, 5000] },
      { name: 'Professional Services', category: 'Services', range: [8000, 30000] },
    ],
  },
};

async function main() {
  console.log('🌱 Starting enhanced database seeding...');
  console.log('─────────────────────────────────────────');

  // 1. CREATE GUEST USER (no password required for guest access)
  console.log('\n👤 Creating Guest User...');
  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@dhanam.demo' },
    update: {},
    create: {
      email: 'guest@dhanam.demo',
      passwordHash: await hash('guest_not_used'),
      name: 'Guest User',
      locale: 'es',
      timezone: 'America/Mexico_City',
      emailVerified: true,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      preferences: {
        create: {
          emailNotifications: false,
          pushNotifications: false,
          dataSharing: false,
          analyticsTracking: false,
          defaultCurrency: Currency.MXN,
          dashboardLayout: 'demo',
          showBalances: true,
          esgScoreVisibility: true,
        },
      },
    },
  });

  // Guest Personal Space with sample data
  const guestSpace = await prisma.space.create({
    data: {
      name: 'Demo Personal Finance',
      type: SpaceType.personal,
      currency: Currency.MXN,
      timezone: 'America/Mexico_City',
      userSpaces: {
        create: {
          userId: guestUser.id,
          role: 'viewer', // Guest has read-only access
        },
      },
      accounts: {
        create: [
          {
            provider: Provider.manual,
            providerAccountId: 'guest-checking',
            name: 'BBVA Checking',
            type: 'checking',
            subtype: 'checking',
            currency: Currency.MXN,
            balance: 45320.50,
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'guest-savings',
            name: 'Santander Savings',
            type: 'savings',
            subtype: 'savings',
            currency: Currency.MXN,
            balance: 125000,
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'guest-credit',
            name: 'Banamex Credit Card',
            type: 'credit',
            subtype: 'credit_card',
            currency: Currency.MXN,
            balance: -8500,
            creditLimit: 50000,
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'guest-crypto',
            name: 'Demo Crypto Wallet',
            type: 'crypto',
            subtype: 'exchange',
            currency: Currency.MXN,
            balance: 32000,
            lastSyncedAt: new Date(),
          },
        ],
      },
      budgets: {
        create: {
          name: 'Demo Monthly Budget',
          period: BudgetPeriod.monthly,
          amount: 55000,
          currency: Currency.MXN,
          startDate: startOfMonth(new Date()),
          endDate: endOfMonth(new Date()),
          categories: {
            create: [
              { name: 'Rent', budgetAmount: 12000, color: '#FF6B6B', icon: '🏠' },
              { name: 'Groceries', budgetAmount: 5000, color: '#4ECDC4', icon: '🛒' },
              { name: 'Transportation', budgetAmount: 2500, color: '#45B7D1', icon: '🚗' },
              { name: 'Entertainment', budgetAmount: 3000, color: '#96CEB4', icon: '🎬' },
              { name: 'Savings', budgetAmount: 10000, color: '#FECA57', icon: '💰' },
              { name: 'Utilities', budgetAmount: 2000, color: '#48C9B0', icon: '💡' },
              { name: 'Food & Dining', budgetAmount: 4000, color: '#F8B500', icon: '🍽️' },
              { name: 'Shopping', budgetAmount: 3500, color: '#E056FD', icon: '🛍️' },
            ],
          },
        },
      },
    },
  });

  // 2. CREATE INDIVIDUAL USER (Maria - Young Professional)
  console.log('\n👤 Creating Individual User (Maria)...');
  const mariaUser = await prisma.user.upsert({
    where: { email: 'maria@demo.com' },
    update: {},
    create: {
      email: 'maria@demo.com',
      passwordHash: await hash('demo123'),
      name: 'Maria González',
      locale: 'es',
      timezone: 'America/Mexico_City',
      emailVerified: true,
      onboardingCompleted: true,
      onboardingCompletedAt: subDays(new Date(), 30),
      preferences: {
        create: {
          emailNotifications: true,
          budgetAlerts: true,
          weeklyReports: true,
          defaultCurrency: Currency.MXN,
          esgScoreVisibility: true,
        },
      },
    },
  });

  const mariaSpace = await prisma.space.create({
    data: {
      name: 'Personal',
      type: SpaceType.personal,
      currency: Currency.MXN,
      timezone: 'America/Mexico_City',
      userSpaces: {
        create: {
          userId: mariaUser.id,
          role: 'owner',
        },
      },
      accounts: {
        create: [
          {
            provider: Provider.belvo,
            providerAccountId: 'maria-bbva-checking',
            name: 'BBVA Nómina',
            type: 'checking',
            subtype: 'checking',
            currency: Currency.MXN,
            balance: 28750.30,
            institutionName: 'BBVA México',
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.belvo,
            providerAccountId: 'maria-nu-savings',
            name: 'Nu Cuenta',
            type: 'savings',
            subtype: 'savings',
            currency: Currency.MXN,
            balance: 45000,
            institutionName: 'Nu México',
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.plaid,
            providerAccountId: 'maria-amex',
            name: 'American Express Gold',
            type: 'credit',
            subtype: 'credit_card',
            currency: Currency.USD,
            balance: -450,
            creditLimit: 5000,
            institutionName: 'American Express',
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.bitso,
            providerAccountId: 'maria-bitso',
            name: 'Bitso Wallet',
            type: 'crypto',
            subtype: 'exchange',
            currency: Currency.MXN,
            balance: 15000,
            institutionName: 'Bitso',
            lastSyncedAt: new Date(),
          },
        ],
      },
      budgets: {
        create: {
          name: 'Monthly Budget',
          period: BudgetPeriod.monthly,
          amount: 65000,
          currency: Currency.MXN,
          startDate: startOfMonth(new Date()),
          endDate: endOfMonth(new Date()),
          categories: {
            create: [
              { name: 'Rent', budgetAmount: 15000, color: '#FF6B6B', icon: '🏠' },
              { name: 'Groceries', budgetAmount: 6000, color: '#4ECDC4', icon: '🛒' },
              { name: 'Transportation', budgetAmount: 3000, color: '#45B7D1', icon: '🚗' },
              { name: 'Entertainment', budgetAmount: 4000, color: '#96CEB4', icon: '🎬' },
              { name: 'Savings', budgetAmount: 15000, color: '#FECA57', icon: '💰' },
              { name: 'Utilities', budgetAmount: 2500, color: '#48C9B0', icon: '💡' },
              { name: 'Food & Dining', budgetAmount: 5000, color: '#F8B500', icon: '🍽️' },
            ],
          },
        },
      },
    },
  });

  // 3. CREATE SMALL BUSINESS OWNER (Carlos - Restaurant Owner)
  console.log('\n👤 Creating Small Business Owner (Carlos)...');
  const carlosUser = await prisma.user.upsert({
    where: { email: 'carlos@business.com' },
    update: {},
    create: {
      email: 'carlos@business.com',
      passwordHash: await hash(process.env.DEMO_USER_PASSWORD || 'ChangeMeInProduction123!'),
      name: 'Carlos Mendoza',
      locale: 'es',
      timezone: 'America/Mexico_City',
      emailVerified: true,
      totpEnabled: false,
      // TOTP should be set up through proper flow, not in seed data
      onboardingCompleted: true,
      onboardingCompletedAt: subDays(new Date(), 90),
      preferences: {
        create: {
          emailNotifications: true,
          transactionAlerts: true,
          budgetAlerts: true,
          monthlyReports: true,
          defaultCurrency: Currency.MXN,
          autoCategorizeTxns: true,
        },
      },
    },
  });

  // Personal space for Carlos
  const carlosPersonal = await prisma.space.create({
    data: {
      name: 'Personal',
      type: SpaceType.personal,
      currency: Currency.MXN,
      timezone: 'America/Mexico_City',
      userSpaces: {
        create: {
          userId: carlosUser.id,
          role: 'owner',
        },
      },
      accounts: {
        create: [
          {
            provider: Provider.manual,
            providerAccountId: 'carlos-personal-checking',
            name: 'Santander Personal',
            type: 'checking',
            subtype: 'checking',
            currency: Currency.MXN,
            balance: 156000,
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'carlos-investment',
            name: 'GBM+ Investment',
            type: 'investment',
            subtype: 'brokerage',
            currency: Currency.MXN,
            balance: 450000,
            lastSyncedAt: new Date(),
          },
        ],
      },
    },
  });

  // Business space for Carlos
  const carlosBusiness = await prisma.space.create({
    data: {
      name: 'Tacos El Patrón',
      type: SpaceType.business,
      currency: Currency.MXN,
      timezone: 'America/Mexico_City',
      businessName: 'Tacos El Patrón SA de CV',
      businessType: 'restaurant',
      taxId: 'TEP850101ABC',
      userSpaces: {
        create: {
          userId: carlosUser.id,
          role: 'owner',
        },
      },
      accounts: {
        create: [
          {
            provider: Provider.belvo,
            providerAccountId: 'business-main',
            name: 'BBVA Business',
            type: 'checking',
            subtype: 'business_checking',
            currency: Currency.MXN,
            balance: 285000,
            institutionName: 'BBVA México',
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'business-savings',
            name: 'Banorte Business Savings',
            type: 'savings',
            subtype: 'business_savings',
            currency: Currency.MXN,
            balance: 520000,
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'business-credit',
            name: 'Santander Business Credit',
            type: 'credit',
            subtype: 'business_credit',
            currency: Currency.MXN,
            balance: -45000,
            creditLimit: 250000,
            lastSyncedAt: new Date(),
          },
        ],
      },
      budgets: {
        create: {
          name: 'Q1 2024 Budget',
          period: BudgetPeriod.quarterly,
          amount: 1500000,
          currency: Currency.MXN,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          categories: {
            create: [
              { name: 'Payroll', budgetAmount: 450000, color: '#FF6B6B', icon: '👥' },
              { name: 'Inventory', budgetAmount: 300000, color: '#4ECDC4', icon: '📦' },
              { name: 'Rent', budgetAmount: 105000, color: '#45B7D1', icon: '🏢' },
              { name: 'Utilities', budgetAmount: 45000, color: '#96CEB4', icon: '💡' },
              { name: 'Marketing', budgetAmount: 75000, color: '#FECA57', icon: '📣' },
              { name: 'Equipment', budgetAmount: 60000, color: '#48C9B0', icon: '🔧' },
              { name: 'Insurance', budgetAmount: 30000, color: '#F8B500', icon: '🛡️' },
            ],
          },
        },
      },
    },
  });

  // 4. CREATE ENTERPRISE USER (Admin)
  console.log('\n👤 Creating Enterprise Admin User...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@enterprise.com' },
    update: {},
    create: {
      email: 'admin@enterprise.com',
      passwordHash: await hash(process.env.DEMO_USER_PASSWORD || 'ChangeMeInProduction123!'),
      name: 'Patricia Ruiz',
      locale: 'en',
      timezone: 'America/Mexico_City',
      emailVerified: true,
      totpEnabled: false,
      // TOTP should be set up through proper flow, not in seed data
      onboardingCompleted: true,
      onboardingCompletedAt: subMonths(new Date(), 6),
      preferences: {
        create: {
          emailNotifications: true,
          transactionAlerts: true,
          budgetAlerts: true,
          weeklyReports: true,
          monthlyReports: true,
          securityAlerts: true,
          defaultCurrency: Currency.USD,
          hideSensitiveData: false,
          autoCategorizeTxns: true,
          esgScoreVisibility: true,
          sustainabilityAlerts: true,
          impactReporting: true,
        },
      },
    },
  });

  // Enterprise space with multiple team members
  const enterpriseSpace = await prisma.space.create({
    data: {
      name: 'TechCorp México',
      type: SpaceType.business,
      currency: Currency.USD,
      timezone: 'America/Mexico_City',
      businessName: 'TechCorp México S.A. de C.V.',
      businessType: 'technology',
      taxId: 'TCM990101XYZ',
      userSpaces: {
        create: [
          {
            userId: adminUser.id,
            role: 'owner',
          },
        ],
      },
      accounts: {
        create: [
          {
            provider: Provider.plaid,
            providerAccountId: 'enterprise-chase',
            name: 'Chase Business Checking',
            type: 'checking',
            subtype: 'business_checking',
            currency: Currency.USD,
            balance: 2500000,
            institutionName: 'Chase Bank',
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.belvo,
            providerAccountId: 'enterprise-bbva-mxn',
            name: 'BBVA Corporate MXN',
            type: 'checking',
            subtype: 'business_checking',
            currency: Currency.MXN,
            balance: 8500000,
            institutionName: 'BBVA México',
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.plaid,
            providerAccountId: 'enterprise-amex',
            name: 'Amex Corporate Platinum',
            type: 'credit',
            subtype: 'corporate_card',
            currency: Currency.USD,
            balance: -125000,
            creditLimit: 500000,
            institutionName: 'American Express',
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'enterprise-investment',
            name: 'Vanguard Investment',
            type: 'investment',
            subtype: 'retirement',
            currency: Currency.USD,
            balance: 5000000,
            lastSyncedAt: new Date(),
          },
        ],
      },
      budgets: {
        create: {
          name: 'Annual 2024 Budget',
          period: BudgetPeriod.yearly,
          amount: 10000000,
          currency: Currency.USD,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          categories: {
            create: [
              { name: 'Salaries', budgetAmount: 5000000, color: '#FF6B6B', icon: '💼' },
              { name: 'Infrastructure', budgetAmount: 1500000, color: '#4ECDC4', icon: '🖥️' },
              { name: 'Marketing', budgetAmount: 1000000, color: '#45B7D1', icon: '📈' },
              { name: 'R&D', budgetAmount: 1500000, color: '#96CEB4', icon: '🔬' },
              { name: 'Operations', budgetAmount: 500000, color: '#FECA57', icon: '⚙️' },
              { name: 'Legal', budgetAmount: 300000, color: '#48C9B0', icon: '⚖️' },
              { name: 'Travel', budgetAmount: 200000, color: '#F8B500', icon: '✈️' },
            ],
          },
        },
      },
    },
  });

  // 5. CREATE ADMIN USER (Platform Administrator)
  console.log('\n👤 Creating Platform Admin...');
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@dhanam.app' },
    update: {},
    create: {
      email: 'admin@dhanam.app',
      passwordHash: await hash(process.env.ADMIN_PASSWORD || 'AdminChangeMeInProduction123!'),
      name: 'Admin',
      locale: 'en',
      timezone: 'America/Mexico_City',
      emailVerified: true,
      isAdmin: true,
      totpEnabled: false,
      // TOTP should be set up through proper flow, not in seed data
      onboardingCompleted: true,
      preferences: {
        create: {
          emailNotifications: true,
          securityAlerts: true,
          defaultCurrency: Currency.USD,
        },
      },
    },
  });

  // 6. GENERATE TRANSACTIONS FOR ALL USERS
  console.log('\n💰 Generating transactions...');
  
  const spaces = [
    { space: guestSpace, accounts: await prisma.account.findMany({ where: { spaceId: guestSpace.id } }) },
    { space: mariaSpace, accounts: await prisma.account.findMany({ where: { spaceId: mariaSpace.id } }) },
    { space: carlosPersonal, accounts: await prisma.account.findMany({ where: { spaceId: carlosPersonal.id } }) },
    { space: carlosBusiness, accounts: await prisma.account.findMany({ where: { spaceId: carlosBusiness.id } }) },
    { space: enterpriseSpace, accounts: await prisma.account.findMany({ where: { spaceId: enterpriseSpace.id } }) },
  ];

  for (const { space, accounts } of spaces) {
    const categories = await prisma.category.findMany({ where: { budget: { spaceId: space.id } } });
    const checkingAccount = accounts.find(a => a.type === 'checking');
    
    if (!checkingAccount) continue;

    // Generate 180 days of transaction history (6 months for full analytics coverage)
    const endDate = new Date();
    const startDate = subDays(endDate, 180);
    
    // Determine transaction templates based on space type
    const templates = space.type === SpaceType.business 
      ? transactionTemplates.expenses.business 
      : transactionTemplates.expenses.personal;

    // Generate expenses (~2 per day over 180 days)
    for (let i = 0; i < 320; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const category = categories.find(c => c.name.includes(template.category.split(' ')[0]));
      
      await prisma.transaction.create({
        data: {
          accountId: checkingAccount.id,
          spaceId: space.id,
          categoryId: category?.id,
          amount: -randomAmount(template.range[0], template.range[1]),
          currency: checkingAccount.currency,
          description: template.name,
          merchantName: template.name,
          date: randomDate(startDate, endDate),
          pending: false,
        },
      });
    }

    // Generate income (~1 per 9 days over 180 days = salary + occasional freelance)
    for (let i = 0; i < 20; i++) {
      const template = transactionTemplates.income[Math.floor(Math.random() * transactionTemplates.income.length)];
      
      await prisma.transaction.create({
        data: {
          accountId: checkingAccount.id,
          spaceId: space.id,
          amount: randomAmount(template.range[0], template.range[1]),
          currency: checkingAccount.currency,
          description: template.name,
          merchantName: template.name,
          date: randomDate(startDate, endDate),
          pending: false,
        },
      });
    }
  }

  // 7. GENERATE ESG SCORES FOR CRYPTO ACCOUNTS
  console.log('\n🌱 Generating ESG scores for diverse crypto portfolio...');

  const cryptoAccounts = await prisma.account.findMany({
    where: { type: 'crypto' }
  });

  // Comprehensive ESG data for varied crypto assets
  const cryptoESGData = [
    // Bitcoin - High energy consumption, decentralized governance
    { symbol: 'BTC', name: 'Bitcoin', env: 35, social: 65, gov: 70,
      notes: 'Proof-of-work consensus - significant energy footprint' },
    // Ethereum - Post-merge, much improved environmental
    { symbol: 'ETH', name: 'Ethereum', env: 75, social: 80, gov: 85,
      notes: 'Proof-of-stake since 2022 - 99.95% energy reduction' },
    // Solana - Energy efficient but centralization concerns
    { symbol: 'SOL', name: 'Solana', env: 82, social: 72, gov: 65,
      notes: 'High throughput with low energy - some centralization concerns' },
    // Cardano - Research-driven, energy efficient
    { symbol: 'ADA', name: 'Cardano', env: 88, social: 85, gov: 90,
      notes: 'Peer-reviewed development, proof-of-stake, academic approach' },
    // XRP - Fast settlements but regulatory challenges
    { symbol: 'XRP', name: 'XRP', env: 85, social: 60, gov: 55,
      notes: 'Energy efficient but facing regulatory scrutiny' },
    // Polkadot - Interoperability focus, good governance
    { symbol: 'DOT', name: 'Polkadot', env: 80, social: 78, gov: 88,
      notes: 'On-chain governance, parachain architecture' },
    // Avalanche - Fast finality, eco-conscious
    { symbol: 'AVAX', name: 'Avalanche', env: 84, social: 75, gov: 82,
      notes: 'Subnets allow for efficient scaling' },
  ];

  for (const account of cryptoAccounts) {
    for (const crypto of cryptoESGData) {
      await prisma.eSGScore.create({
        data: {
          accountId: account.id,
          assetSymbol: crypto.symbol,
          environmentalScore: crypto.env,
          socialScore: crypto.social,
          governanceScore: crypto.gov,
        },
      });
    }
  }

  console.log(`  ✓ Created ${cryptoESGData.length} ESG scores per crypto account`);

  // 8. GENERATE ASSET VALUATIONS (for net worth trends)
  console.log('\n📊 Generating asset valuation history...');

  for (const { space } of spaces) {
    const accounts = await prisma.account.findMany({ where: { spaceId: space.id } });

    // Generate 60 days of daily valuations for each account (better trend analysis)
    for (const account of accounts) {
      for (let i = 60; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const variation = (Math.random() - 0.5) * 0.02; // +/- 2% daily variation
        const valuatedAmount = account.balance * (1 + variation);

        await prisma.assetValuation.create({
          data: {
            accountId: account.id,
            date: date,
            value: valuatedAmount,
            currency: account.currency,
          },
        });
      }
    }
  }

  // 9. CREATE FEATURE FLAGS
  console.log('\n🚩 Creating feature flags...');
  
  const featureFlags = [
    { name: 'guest_access', enabled: true, description: 'Enable guest access to demo', rollout: 100 },
    { name: 'esg_scoring', enabled: true, description: 'ESG scoring for crypto assets', rollout: 100 },
    { name: 'ai_categorization', enabled: true, description: 'AI-powered transaction categorization', rollout: 50 },
    { name: 'mobile_biometric', enabled: true, description: 'Biometric auth on mobile', rollout: 100 },
    { name: 'dark_mode', enabled: true, description: 'Dark mode theme', rollout: 100 },
    { name: 'export_pdf', enabled: true, description: 'PDF report exports', rollout: 75 },
    { name: 'multi_currency', enabled: true, description: 'Multi-currency support', rollout: 100 },
    { name: 'webhooks_v2', enabled: false, description: 'New webhook infrastructure', rollout: 0 },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: flag,
      create: flag,
    });
  }

  // 10. CREATE AUDIT LOG ENTRIES
  console.log('\n📝 Creating audit logs...');
  
  const auditEvents = [
    { userId: mariaUser.id, action: 'user.login', details: { ip: '192.168.1.100', userAgent: 'Chrome' } },
    { userId: mariaUser.id, action: 'account.connected', details: { provider: 'belvo', accountId: 'maria-bbva-checking' } },
    { userId: carlosUser.id, action: 'totp.enabled', details: {} },
    { userId: carlosUser.id, action: 'budget.created', details: { budgetId: 'q1-2024' } },
    { userId: adminUser.id, action: 'space.created', details: { spaceName: 'TechCorp México' } },
    { userId: adminUser.id, action: 'user.invite_sent', details: { email: 'cfo@techcorp.com' } },
    { userId: platformAdmin.id, action: 'admin.user_view', details: { viewedUserId: mariaUser.id } },
    { userId: platformAdmin.id, action: 'admin.feature_flag_toggle', details: { flag: 'ai_categorization', enabled: true } },
  ];

  for (const event of auditEvents) {
    await prisma.auditLog.create({
      data: {
        ...event,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: randomDate(subDays(new Date(), 30), new Date()),
      },
    });
  }

  // 11. CREATE PROBABILISTIC GOALS WITH MONTE CARLO DATA
  console.log('\n🎯 Creating probabilistic goals with Monte Carlo simulations...');

  // Guest User Goals (Retirement, Emergency Fund, House Down Payment)
  const guestCheckingAccount = await prisma.account.findFirst({
    where: { spaceId: guestSpace.id, type: 'checking' }
  });
  const guestSavingsAccount = await prisma.account.findFirst({
    where: { spaceId: guestSpace.id, type: 'savings' }
  });

  if (guestCheckingAccount && guestSavingsAccount) {
    // Goal 1: Retirement - High Probability (On Track)
    await prisma.goal.create({
      data: {
        spaceId: guestSpace.id,
        name: 'Retirement Fund',
        description: 'Build retirement nest egg for comfortable retirement at 65',
        type: 'retirement',
        targetAmount: 1000000,
        currency: Currency.MXN,
        targetDate: new Date('2045-12-31'),
        priority: 1,
        status: 'active',
        monthlyContribution: 5000,
        expectedReturn: 0.07, // 7% annual return
        volatility: 0.15, // 15% volatility
        currentProbability: 87.5,
        confidenceLow: 850000,
        confidenceHigh: 1250000,
        currentProgress: 15.2,
        projectedCompletion: new Date('2044-06-30'),
        lastSimulationAt: new Date(),
        probabilityHistory: [
          { date: subDays(new Date(), 90).toISOString(), probability: 82.1 },
          { date: subDays(new Date(), 60).toISOString(), probability: 84.3 },
          { date: subDays(new Date(), 30).toISOString(), probability: 86.0 },
          { date: new Date().toISOString(), probability: 87.5 },
        ],
        allocations: {
          create: [
            {
              accountId: guestSavingsAccount.id,
              percentage: 70,
            },
            {
              accountId: guestCheckingAccount.id,
              percentage: 30,
            },
          ],
        },
      },
    });

    // Goal 2: Emergency Fund - Excellent Probability
    await prisma.goal.create({
      data: {
        spaceId: guestSpace.id,
        name: 'Emergency Fund',
        description: '6 months of living expenses for financial security',
        type: 'emergency_fund',
        targetAmount: 90000,
        currency: Currency.MXN,
        targetDate: new Date('2025-12-31'),
        priority: 1,
        status: 'active',
        monthlyContribution: 3000,
        expectedReturn: 0.03, // 3% annual return (savings account)
        volatility: 0.02, // 2% volatility (low risk)
        currentProbability: 95.2,
        confidenceLow: 88000,
        confidenceHigh: 98000,
        currentProgress: 55.6,
        projectedCompletion: new Date('2025-08-15'),
        lastSimulationAt: new Date(),
        probabilityHistory: [
          { date: subDays(new Date(), 90).toISOString(), probability: 88.5 },
          { date: subDays(new Date(), 60).toISOString(), probability: 91.2 },
          { date: subDays(new Date(), 30).toISOString(), probability: 93.4 },
          { date: new Date().toISOString(), probability: 95.2 },
        ],
        allocations: {
          create: [
            {
              accountId: guestSavingsAccount.id,
              percentage: 100,
            },
          ],
        },
      },
    });

    // Goal 3: House Down Payment - Needs Attention (Lower Probability)
    await prisma.goal.create({
      data: {
        spaceId: guestSpace.id,
        name: 'House Down Payment',
        description: '20% down payment for first home purchase',
        type: 'house_purchase',
        targetAmount: 300000,
        currency: Currency.MXN,
        targetDate: new Date('2027-06-30'),
        priority: 2,
        status: 'active',
        monthlyContribution: 4000,
        expectedReturn: 0.05, // 5% annual return
        volatility: 0.10, // 10% volatility
        currentProbability: 58.3,
        confidenceLow: 220000,
        confidenceHigh: 340000,
        currentProgress: 16.7,
        projectedCompletion: new Date('2028-03-15'), // Behind schedule
        lastSimulationAt: new Date(),
        probabilityHistory: [
          { date: subDays(new Date(), 90).toISOString(), probability: 62.4 },
          { date: subDays(new Date(), 60).toISOString(), probability: 60.1 },
          { date: subDays(new Date(), 30).toISOString(), probability: 59.2 },
          { date: new Date().toISOString(), probability: 58.3 },
        ],
        allocations: {
          create: [
            {
              accountId: guestCheckingAccount.id,
              percentage: 60,
            },
            {
              accountId: guestSavingsAccount.id,
              percentage: 40,
            },
          ],
        },
      },
    });
  }

  // Maria's Goals (Education, Travel)
  const mariaCheckingAccount = await prisma.account.findFirst({
    where: { spaceId: mariaSpace.id, type: 'checking' }
  });
  const mariaSavingsAccount = await prisma.account.findFirst({
    where: { spaceId: mariaSpace.id, type: 'savings' }
  });

  if (mariaCheckingAccount && mariaSavingsAccount) {
    // Goal: Children's Education Fund
    await prisma.goal.create({
      data: {
        spaceId: mariaSpace.id,
        name: "Children's Education Fund",
        description: 'University education fund for both children',
        type: 'education',
        targetAmount: 500000,
        currency: Currency.MXN,
        targetDate: new Date('2030-08-31'),
        priority: 1,
        status: 'active',
        monthlyContribution: 6000,
        expectedReturn: 0.06, // 6% annual return
        volatility: 0.12, // 12% volatility
        currentProbability: 73.8,
        confidenceLow: 420000,
        confidenceHigh: 580000,
        currentProgress: 24.0,
        projectedCompletion: new Date('2030-06-30'),
        lastSimulationAt: new Date(),
        probabilityHistory: [
          { date: subDays(new Date(), 90).toISOString(), probability: 71.2 },
          { date: subDays(new Date(), 60).toISOString(), probability: 72.5 },
          { date: subDays(new Date(), 30).toISOString(), probability: 73.1 },
          { date: new Date().toISOString(), probability: 73.8 },
        ],
        allocations: {
          create: [
            {
              accountId: mariaSavingsAccount.id,
              percentage: 80,
            },
            {
              accountId: mariaCheckingAccount.id,
              percentage: 20,
            },
          ],
        },
      },
    });

    // Goal: Europe Trip
    await prisma.goal.create({
      data: {
        spaceId: mariaSpace.id,
        name: 'Family Trip to Europe',
        description: '15-day vacation across Europe for the whole family',
        type: 'travel',
        targetAmount: 120000,
        currency: Currency.MXN,
        targetDate: new Date('2025-07-15'),
        priority: 3,
        status: 'active',
        monthlyContribution: 5000,
        expectedReturn: 0.02, // 2% annual return (short-term savings)
        volatility: 0.01, // 1% volatility (very low risk)
        currentProbability: 92.4,
        confidenceLow: 118000,
        confidenceHigh: 127000,
        currentProgress: 62.5,
        projectedCompletion: new Date('2025-06-01'),
        lastSimulationAt: new Date(),
        probabilityHistory: [
          { date: subDays(new Date(), 90).toISOString(), probability: 85.3 },
          { date: subDays(new Date(), 60).toISOString(), probability: 88.7 },
          { date: subDays(new Date(), 30).toISOString(), probability: 90.5 },
          { date: new Date().toISOString(), probability: 92.4 },
        ],
        allocations: {
          create: [
            {
              accountId: mariaSavingsAccount.id,
              percentage: 100,
            },
          ],
        },
      },
    });
  }

  // Carlos Personal Goals (Business Expansion)
  const carlosInvestmentAccount = await prisma.account.findFirst({
    where: { spaceId: carlosPersonal.id, type: 'investment' }
  });

  if (carlosInvestmentAccount) {
    // Goal: Business Expansion Fund
    await prisma.goal.create({
      data: {
        spaceId: carlosPersonal.id,
        name: 'Second Restaurant Location',
        description: 'Capital for opening second Tacos El Patrón location',
        type: 'business',
        targetAmount: 1500000,
        currency: Currency.MXN,
        targetDate: new Date('2026-03-31'),
        priority: 1,
        status: 'active',
        monthlyContribution: 25000,
        expectedReturn: 0.08, // 8% annual return
        volatility: 0.18, // 18% volatility (higher risk)
        currentProbability: 65.7,
        confidenceLow: 1100000,
        confidenceHigh: 1650000,
        currentProgress: 30.0,
        projectedCompletion: new Date('2026-05-15'),
        lastSimulationAt: new Date(),
        probabilityHistory: [
          { date: subDays(new Date(), 90).toISOString(), probability: 61.2 },
          { date: subDays(new Date(), 60).toISOString(), probability: 63.4 },
          { date: subDays(new Date(), 30).toISOString(), probability: 64.5 },
          { date: new Date().toISOString(), probability: 65.7 },
        ],
        allocations: {
          create: [
            {
              accountId: carlosInvestmentAccount.id,
              percentage: 100,
            },
          ],
        },
      },
    });
  }

  // Goal Collaboration - Maria shares Education Fund with Guest
  console.log('\n🤝 Creating goal collaboration data...');

  const mariaEducationGoal = await prisma.goal.findFirst({
    where: {
      spaceId: mariaSpace.id,
      name: "Children's Education Fund"
    }
  });

  const guestRetirementGoal = await prisma.goal.findFirst({
    where: {
      spaceId: guestSpace.id,
      name: 'Retirement Fund'
    }
  });

  if (mariaEducationGoal) {
    // Mark goal as shared
    await prisma.goal.update({
      where: { id: mariaEducationGoal.id },
      data: {
        createdBy: mariaUser.id,
        isShared: true,
        sharedWithMessage: "Let's track our children's education fund together! Feel free to view progress and suggest adjustments."
      }
    });

    // Create share with guest user (accepted)
    const educationShare = await prisma.goalShare.create({
      data: {
        goalId: mariaEducationGoal.id,
        sharedWith: guestUser.id,
        role: 'viewer',
        invitedBy: mariaUser.id,
        status: 'accepted',
        message: "Let's track our children's education fund together! Feel free to view progress and suggest adjustments.",
        acceptedAt: subDays(new Date(), 5),
        createdAt: subDays(new Date(), 7),
      }
    });

    // Create activity history for Maria's shared goal
    const activities = [
      {
        goalId: mariaEducationGoal.id,
        userId: mariaUser.id,
        action: 'created',
        metadata: { initialAmount: 500000, targetDate: '2032-08-31' },
        createdAt: subDays(new Date(), 120),
      },
      {
        goalId: mariaEducationGoal.id,
        userId: mariaUser.id,
        action: 'shared',
        metadata: { sharedWith: guestUser.email, role: 'viewer' },
        createdAt: subDays(new Date(), 7),
      },
      {
        goalId: mariaEducationGoal.id,
        userId: guestUser.id,
        action: 'share_accepted',
        metadata: { shareId: educationShare.id },
        createdAt: subDays(new Date(), 5),
      },
      {
        goalId: mariaEducationGoal.id,
        userId: mariaUser.id,
        action: 'contribution_added',
        metadata: { amount: 6500, account: 'BBVA Savings' },
        createdAt: subDays(new Date(), 3),
      },
      {
        goalId: mariaEducationGoal.id,
        userId: mariaUser.id,
        action: 'probability_improved',
        metadata: { oldProbability: 89.2, newProbability: 91.5 },
        createdAt: subDays(new Date(), 1),
      },
    ];

    for (const activity of activities) {
      await prisma.goalActivity.create({ data: activity });
    }

    console.log(`  ✓ Maria shared Education Fund with Guest (viewer role)`);
  }

  // Create activities for guest's retirement goal
  if (guestRetirementGoal) {
    await prisma.goal.update({
      where: { id: guestRetirementGoal.id },
      data: { createdBy: guestUser.id }
    });

    const retirementActivities = [
      {
        goalId: guestRetirementGoal.id,
        userId: guestUser.id,
        action: 'created',
        metadata: { initialAmount: 1000000, targetDate: '2045-12-31' },
        createdAt: subDays(new Date(), 180),
      },
      {
        goalId: guestRetirementGoal.id,
        userId: guestUser.id,
        action: 'updated',
        metadata: { field: 'monthlyContribution', oldValue: 4000, newValue: 5000 },
        createdAt: subDays(new Date(), 60),
      },
      {
        goalId: guestRetirementGoal.id,
        userId: guestUser.id,
        action: 'milestone_reached',
        metadata: { milestone: '15% Complete' },
        createdAt: subDays(new Date(), 30),
      },
      {
        goalId: guestRetirementGoal.id,
        userId: guestUser.id,
        action: 'probability_improved',
        metadata: { oldProbability: 84.3, newProbability: 87.5 },
        createdAt: subDays(new Date(), 2),
      },
    ];

    for (const activity of retirementActivities) {
      await prisma.goalActivity.create({ data: activity });
    }

    console.log(`  ✓ Created activity history for Guest's Retirement Fund`);
  }

  // Create categorization rules
  console.log('\n📋 Creating categorization rules...');
  
  const rules = [
    // Guest user rules
    { keyword: 'oxxo', category: 'Groceries', spaceId: guestSpace.id },
    { keyword: 'soriana', category: 'Groceries', spaceId: guestSpace.id },
    { keyword: 'uber', category: 'Transportation', spaceId: guestSpace.id },
    { keyword: 'pemex', category: 'Transportation', spaceId: guestSpace.id },
    { keyword: 'netflix', category: 'Entertainment', spaceId: guestSpace.id },
    { keyword: 'spotify', category: 'Entertainment', spaceId: guestSpace.id },
    { keyword: 'starbucks', category: 'Food & Dining', spaceId: guestSpace.id },
    { keyword: 'restaurant', category: 'Food & Dining', spaceId: guestSpace.id },
    { keyword: 'cfe', category: 'Utilities', spaceId: guestSpace.id },
    { keyword: 'telmex', category: 'Utilities', spaceId: guestSpace.id },
    { keyword: 'amazon', category: 'Shopping', spaceId: guestSpace.id },
    { keyword: 'liverpool', category: 'Shopping', spaceId: guestSpace.id },
    // Maria's rules
    { keyword: 'oxxo', category: 'Groceries', spaceId: mariaSpace.id },
    { keyword: 'uber', category: 'Transportation', spaceId: mariaSpace.id },
    { keyword: 'netflix', category: 'Entertainment', spaceId: mariaSpace.id },
    { keyword: 'spotify', category: 'Entertainment', spaceId: mariaSpace.id },
    { keyword: 'starbucks', category: 'Food & Dining', spaceId: mariaSpace.id },
    // Carlos business rules
    { keyword: 'payroll', category: 'Payroll', spaceId: carlosBusiness.id },
    { keyword: 'rent', category: 'Rent', spaceId: carlosBusiness.id },
    // Enterprise rules
    { keyword: 'aws', category: 'Infrastructure', spaceId: enterpriseSpace.id },
    { keyword: 'google', category: 'Marketing', spaceId: enterpriseSpace.id },
  ];

  for (const rule of rules) {
    const category = await prisma.category.findFirst({
      where: { 
        name: rule.category,
        budget: { spaceId: rule.spaceId }
      }
    });

    if (category) {
      await prisma.rule.create({
        data: {
          categoryId: category.id,
          type: 'keyword',
          value: rule.keyword,
          isActive: true,
        },
      });
    }
  }

  // 12. CREATE DEMO HOUSEHOLD WITH ESTATE PLANNING
  console.log('\n🏠 Creating demo household with estate planning...');

  // Create the Demo Family Household
  const demoHousehold = await prisma.household.create({
    data: {
      name: 'The Demo Family',
      type: 'family',
      baseCurrency: Currency.MXN,
      description: 'Demo household showcasing family financial planning and estate management features',
    },
  });

  // Add household members - Guest (head of household) and Maria (spouse/partner)
  const guestMember = await prisma.householdMember.create({
    data: {
      householdId: demoHousehold.id,
      userId: guestUser.id,
      relationship: 'spouse', // Head of household as spouse role
      isMinor: false,
      notes: 'Head of household - primary financial planner',
    },
  });

  const mariaMember = await prisma.householdMember.create({
    data: {
      householdId: demoHousehold.id,
      userId: mariaUser.id,
      relationship: 'spouse',
      isMinor: false,
      notes: 'Co-head of household - shared financial management',
    },
  });

  // Create a demo minor child member (uses existing user for simplicity)
  // In real scenario, minors might not have user accounts
  const childMember = await prisma.householdMember.create({
    data: {
      householdId: demoHousehold.id,
      userId: carlosUser.id, // Reusing Carlos as a "child" for demo purposes
      relationship: 'child',
      isMinor: false, // Adult child for demo
      accessStartDate: new Date('2015-01-01'),
      notes: 'Adult child - included in estate planning',
    },
  });

  // Link household to Guest's space
  await prisma.space.update({
    where: { id: guestSpace.id },
    data: { householdId: demoHousehold.id },
  });

  console.log(`  ✓ Created household: ${demoHousehold.name}`);
  console.log(`  ✓ Added 3 household members (Guest, Maria, Carlos as adult child)`);

  // Create Demo Will
  const demoWill = await prisma.will.create({
    data: {
      householdId: demoHousehold.id,
      name: 'Demo Family Estate Plan 2025',
      status: 'active',
      lastReviewedAt: subDays(new Date(), 30),
      activatedAt: subDays(new Date(), 90),
      notes: 'Primary estate plan for the Demo Family. This is a demonstration document - not legal advice.',
      legalDisclaimer: true,
    },
  });

  console.log(`  ✓ Created will: ${demoWill.name}`);

  // Create beneficiary designations
  // Maria gets 50% of all assets
  await prisma.beneficiaryDesignation.create({
    data: {
      willId: demoWill.id,
      beneficiaryId: mariaMember.id,
      assetType: 'bank_account',
      percentage: 50.00,
      notes: 'Primary beneficiary for all liquid assets',
    },
  });

  // Child gets 50% of all assets
  await prisma.beneficiaryDesignation.create({
    data: {
      willId: demoWill.id,
      beneficiaryId: childMember.id,
      assetType: 'bank_account',
      percentage: 50.00,
      conditions: { type: 'age_requirement', minAge: 25, notes: 'Full access at age 25' },
      notes: 'Secondary beneficiary - assets held in trust until age requirements met',
    },
  });

  // Crypto assets specific designation
  await prisma.beneficiaryDesignation.create({
    data: {
      willId: demoWill.id,
      beneficiaryId: childMember.id,
      assetType: 'crypto_account',
      percentage: 100.00,
      notes: 'All cryptocurrency holdings to next generation',
    },
  });

  console.log('  ✓ Created 3 beneficiary designations');

  // Create will executors
  // Maria as primary executor
  await prisma.willExecutor.create({
    data: {
      willId: demoWill.id,
      executorId: mariaMember.id,
      isPrimary: true,
      order: 1,
      acceptedAt: subDays(new Date(), 85),
      notes: 'Primary executor - spouse',
    },
  });

  // Child as backup executor
  await prisma.willExecutor.create({
    data: {
      willId: demoWill.id,
      executorId: childMember.id,
      isPrimary: false,
      order: 2,
      acceptedAt: subDays(new Date(), 80),
      notes: 'Secondary executor if primary unable to serve',
    },
  });

  console.log('  ✓ Created 2 will executors (primary + backup)');

  console.log('\n✅ Enhanced seeding completed!');
  console.log('─────────────────────────────────────────');
  console.log('\n📊 Summary:');
  console.log('  - 1 Guest user (instant demo access) 🎭');
  console.log('    ✓ 4 accounts (checking, savings, credit, crypto)');
  console.log('    ✓ 340 realistic transactions over 180 days (6 months)');
  console.log('    ✓ Monthly budget with 8 categories');
  console.log('    ✓ 3 probabilistic goals with Monte Carlo simulations');
  console.log('    ✓ 1 shared goal (Maria\'s Education Fund - viewer access)');
  console.log('    ✓ ESG scores for 7 crypto assets (BTC, ETH, SOL, ADA, XRP, DOT, AVAX)');
  console.log('    ✓ 61 days of asset valuation history per account');
  console.log('    ✓ Household member with estate planning access');
  console.log('  - 1 Individual user (Maria)');
  console.log('    ✓ 2 probabilistic goals (education, travel)');
  console.log('    ✓ Education Fund shared with Guest user');
  console.log('    ✓ Household member + will executor');
  console.log('  - 1 Small business owner (Carlos)');
  console.log('    ✓ 1 probabilistic goal (business expansion)');
  console.log('    ✓ Household member (adult child)');
  console.log('  - 1 Enterprise admin (Patricia)');
  console.log('  - 1 Platform admin');
  console.log('  - 5 Spaces with budgets');
  console.log('  - 19 Connected accounts');
  console.log('  - 6 Probabilistic Goals with confidence intervals');
  console.log('  - 1 Goal Share (Maria → Guest) with activity feed');
  console.log('  - 9 Goal Activities across 2 goals');
  console.log('  - 1,700+ Transactions (340 per space × 5 spaces)');
  console.log('  - 1,159 Asset valuations (61 days × 19 accounts)');
  console.log('  - 14 ESG scores (7 crypto assets × 2 crypto accounts)');
  console.log('  - Feature flags configured');
  console.log('  - Categorization rules set up');
  console.log('  - 1 Household (The Demo Family) with 3 members');
  console.log('  - 1 Estate Plan (Will) with beneficiaries and executors');
  console.log('  - 3 Beneficiary designations + 2 Will executors');
  console.log('\n🎉 Demo environment ready!');
  console.log('💡 Guest demo showcases: budgets, cashflow forecast, net worth trends, ESG scores,');
  console.log('   probabilistic goal planning, goal collaboration, household management, estate planning!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });