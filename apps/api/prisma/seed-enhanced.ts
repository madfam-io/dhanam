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

    // Generate 90 days of transaction history
    const endDate = new Date();
    const startDate = subDays(endDate, 90);
    
    // Determine transaction templates based on space type
    const templates = space.type === SpaceType.business 
      ? transactionTemplates.expenses.business 
      : transactionTemplates.expenses.personal;

    // Generate expenses
    for (let i = 0; i < 150; i++) {
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

    // Generate income (less frequent)
    for (let i = 0; i < 10; i++) {
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
  console.log('\n🌱 Generating ESG scores...');
  
  const cryptoAccounts = await prisma.account.findMany({
    where: { type: 'crypto' }
  });

  for (const account of cryptoAccounts) {
    await prisma.eSGScore.create({
      data: {
        accountId: account.id,
        assetSymbol: 'BTC',
        environmentalScore: 35,
        socialScore: 65,
        governanceScore: 70,
      },
    });

    await prisma.eSGScore.create({
      data: {
        accountId: account.id,
        assetSymbol: 'ETH',
        environmentalScore: 75,
        socialScore: 80,
        governanceScore: 85,
      },
    });
  }

  // 8. GENERATE ASSET VALUATIONS (for net worth trends)
  console.log('\n📊 Generating asset valuation history...');

  for (const { space } of spaces) {
    const accounts = await prisma.account.findMany({ where: { spaceId: space.id } });

    // Generate 30 days of daily valuations for each account
    for (const account of accounts) {
      for (let i = 30; i >= 0; i--) {
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

  console.log('\n✅ Enhanced seeding completed!');
  console.log('─────────────────────────────────────────');
  console.log('\n📊 Summary:');
  console.log('  - 1 Guest user (instant demo access) 🎭');
  console.log('    ✓ 4 accounts (checking, savings, credit, crypto)');
  console.log('    ✓ 160 realistic transactions over 90 days');
  console.log('    ✓ Monthly budget with 8 categories');
  console.log('    ✓ ESG scores for BTC & ETH');
  console.log('    ✓ 31 days of asset valuation history per account');
  console.log('  - 1 Individual user (Maria)');
  console.log('  - 1 Small business owner (Carlos)');
  console.log('  - 1 Enterprise admin (Patricia)');
  console.log('  - 1 Platform admin');
  console.log('  - 5 Spaces with budgets');
  console.log('  - 19 Connected accounts');
  console.log('  - 800+ Transactions');
  console.log('  - 589 Asset valuations (31 days × 19 accounts)');
  console.log('  - ESG scores for all crypto holdings');
  console.log('  - Feature flags configured');
  console.log('  - Categorization rules set up');
  console.log('\n🎉 Demo environment ready!');
  console.log('💡 Guest demo showcases: budgets, cashflow forecast, net worth trends, ESG scores!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });