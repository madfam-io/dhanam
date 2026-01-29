import { PrismaClient, Currency, SpaceType, BudgetPeriod, Provider } from '../../generated/prisma';
import { hash } from 'argon2';
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { SeedContext } from './helpers';

export async function seedUsers(prisma: PrismaClient): Promise<SeedContext> {
  // 1. GUEST USER
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

  const guestSpace = await prisma.space.create({
    data: {
      name: 'Demo Personal Finance',
      type: SpaceType.personal,
      currency: Currency.MXN,
      timezone: 'America/Mexico_City',
      userSpaces: {
        create: { userId: guestUser.id, role: 'viewer' },
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
          income: 55000,
          startDate: startOfMonth(new Date()),
          endDate: endOfMonth(new Date()),
          categories: {
            create: [
              { name: 'Rent', budgetedAmount: 12000, color: '#FF6B6B', icon: '🏠' },
              { name: 'Groceries', budgetedAmount: 5000, color: '#4ECDC4', icon: '🛒' },
              { name: 'Transportation', budgetedAmount: 2500, color: '#45B7D1', icon: '🚗' },
              { name: 'Entertainment', budgetedAmount: 3000, color: '#96CEB4', icon: '🎬' },
              { name: 'Savings', budgetedAmount: 10000, color: '#FECA57', icon: '💰' },
              { name: 'Utilities', budgetedAmount: 2000, color: '#48C9B0', icon: '💡' },
              { name: 'Food & Dining', budgetedAmount: 4000, color: '#F8B500', icon: '🍽️' },
              { name: 'Shopping', budgetedAmount: 3500, color: '#E056FD', icon: '🛍️' },
            ],
          },
        },
      },
    },
  });

  // 2. MARIA (Young Professional)
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
        create: { userId: mariaUser.id, role: 'owner' },
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
            metadata: { institutionName: 'BBVA México' },
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
            metadata: { institutionName: 'Nu México' },
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

            metadata: { institutionName: 'American Express' },
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
            metadata: { institutionName: 'Bitso' },
            lastSyncedAt: new Date(),
          },
        ],
      },
      budgets: {
        create: {
          name: 'Monthly Budget',
          period: BudgetPeriod.monthly,
          income: 65000,
          startDate: startOfMonth(new Date()),
          endDate: endOfMonth(new Date()),
          categories: {
            create: [
              { name: 'Rent', budgetedAmount: 15000, color: '#FF6B6B', icon: '🏠' },
              { name: 'Groceries', budgetedAmount: 6000, color: '#4ECDC4', icon: '🛒' },
              { name: 'Transportation', budgetedAmount: 3000, color: '#45B7D1', icon: '🚗' },
              { name: 'Entertainment', budgetedAmount: 4000, color: '#96CEB4', icon: '🎬' },
              { name: 'Savings', budgetedAmount: 15000, color: '#FECA57', icon: '💰' },
              { name: 'Utilities', budgetedAmount: 2500, color: '#48C9B0', icon: '💡' },
              { name: 'Food & Dining', budgetedAmount: 5000, color: '#F8B500', icon: '🍽️' },
            ],
          },
        },
      },
    },
  });

  // 3. CARLOS (Small Business Owner)
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

  const carlosPersonal = await prisma.space.create({
    data: {
      name: 'Personal',
      type: SpaceType.personal,
      currency: Currency.MXN,
      timezone: 'America/Mexico_City',
      userSpaces: {
        create: { userId: carlosUser.id, role: 'owner' },
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

  const carlosBusiness = await prisma.space.create({
    data: {
      name: 'Tacos El Patrón',
      type: SpaceType.business,
      currency: Currency.MXN,
      timezone: 'America/Mexico_City',
      // NOTE: businessName/businessType/taxId removed — not in Space schema
      userSpaces: {
        create: { userId: carlosUser.id, role: 'owner' },
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
            metadata: { institutionName: 'BBVA México' },
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

            lastSyncedAt: new Date(),
          },
        ],
      },
      budgets: {
        create: {
          name: 'Q1 2024 Budget',
          period: BudgetPeriod.quarterly,
          income: 1500000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          categories: {
            create: [
              { name: 'Payroll', budgetedAmount: 450000, color: '#FF6B6B', icon: '👥' },
              { name: 'Inventory', budgetedAmount: 300000, color: '#4ECDC4', icon: '📦' },
              { name: 'Rent', budgetedAmount: 105000, color: '#45B7D1', icon: '🏢' },
              { name: 'Utilities', budgetedAmount: 45000, color: '#96CEB4', icon: '💡' },
              { name: 'Marketing', budgetedAmount: 75000, color: '#FECA57', icon: '📣' },
              { name: 'Equipment', budgetedAmount: 60000, color: '#48C9B0', icon: '🔧' },
              { name: 'Insurance', budgetedAmount: 30000, color: '#F8B500', icon: '🛡️' },
            ],
          },
        },
      },
    },
  });

  // 4. ENTERPRISE USER (Patricia)
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

  const enterpriseSpace = await prisma.space.create({
    data: {
      name: 'TechCorp México',
      type: SpaceType.business,
      currency: Currency.USD,
      timezone: 'America/Mexico_City',
      // NOTE: businessName/businessType/taxId removed — not in Space schema
      userSpaces: {
        create: [{ userId: adminUser.id, role: 'owner' }],
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
            metadata: { institutionName: 'Chase Bank' },
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
            metadata: { institutionName: 'BBVA México' },
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

            metadata: { institutionName: 'American Express' },
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
          income: 10000000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          categories: {
            create: [
              { name: 'Salaries', budgetedAmount: 5000000, color: '#FF6B6B', icon: '💼' },
              { name: 'Infrastructure', budgetedAmount: 1500000, color: '#4ECDC4', icon: '🖥️' },
              { name: 'Marketing', budgetedAmount: 1000000, color: '#45B7D1', icon: '📈' },
              { name: 'R&D', budgetedAmount: 1500000, color: '#96CEB4', icon: '🔬' },
              { name: 'Operations', budgetedAmount: 500000, color: '#FECA57', icon: '⚙️' },
              { name: 'Legal', budgetedAmount: 300000, color: '#48C9B0', icon: '⚖️' },
              { name: 'Travel', budgetedAmount: 200000, color: '#F8B500', icon: '✈️' },
            ],
          },
        },
      },
    },
  });

  // 5. PLATFORM ADMIN
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

  // 6. DIEGO (Web3/Metaverse)
  console.log('\n👤 Creating Web3 User (Diego)...');
  const diegoUser = await prisma.user.upsert({
    where: { email: 'diego@web3.com' },
    update: {},
    create: {
      email: 'diego@web3.com',
      passwordHash: await hash(process.env.DEMO_USER_PASSWORD || 'ChangeMeInProduction123!'),
      name: 'Diego Navarro',
      locale: 'es',
      timezone: 'America/Mexico_City',
      emailVerified: true,
      onboardingCompleted: true,
      onboardingCompletedAt: subDays(new Date(), 45),
      preferences: {
        create: {
          emailNotifications: true,
          transactionAlerts: true,
          budgetAlerts: true,
          defaultCurrency: Currency.MXN,
          esgScoreVisibility: true,
          sustainabilityAlerts: true,
        },
      },
    },
  });

  const diegoSpace = await prisma.space.create({
    data: {
      name: 'Personal',
      type: SpaceType.personal,
      currency: Currency.MXN,
      timezone: 'America/Mexico_City',
      userSpaces: {
        create: { userId: diegoUser.id, role: 'owner' },
      },
      accounts: {
        create: [
          {
            provider: Provider.belvo,
            providerAccountId: 'diego-bbva-checking',
            name: 'BBVA Nómina',
            type: 'checking',
            subtype: 'checking',
            currency: Currency.MXN,
            balance: 42500,
            metadata: { institutionName: 'BBVA México' },
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'diego-usd-savings',
            name: 'USD Savings',
            type: 'savings',
            subtype: 'savings',
            currency: Currency.USD,
            balance: 8200,
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.bitso,
            providerAccountId: 'diego-bitso',
            name: 'Bitso Exchange',
            type: 'crypto',
            subtype: 'exchange',
            currency: Currency.MXN,
            balance: 95000,
            metadata: { institutionName: 'Bitso' },
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.blockchain,
            providerAccountId: 'diego-eth-wallet',
            name: 'ETH Wallet',
            type: 'crypto',
            subtype: 'wallet',
            currency: Currency.USD,
            balance: 12500,
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.blockchain,
            providerAccountId: 'diego-sol-wallet',
            name: 'Solana Wallet',
            type: 'crypto',
            subtype: 'wallet',
            currency: Currency.USD,
            balance: 4800,
            lastSyncedAt: new Date(),
          },
          {
            provider: Provider.manual,
            providerAccountId: 'diego-gaming-wallet',
            name: 'Metaverse Gaming Wallet',
            type: 'crypto',
            subtype: 'gaming',
            currency: Currency.USD,
            balance: 3200,
            lastSyncedAt: new Date(),
          },
        ],
      },
      budgets: {
        create: {
          name: 'Monthly Budget',
          period: BudgetPeriod.monthly,
          income: 55000,
          startDate: startOfMonth(new Date()),
          endDate: endOfMonth(new Date()),
          categories: {
            create: [
              { name: 'Rent', budgetedAmount: 12000, color: '#FF6B6B', icon: '🏠' },
              { name: 'Groceries', budgetedAmount: 4000, color: '#4ECDC4', icon: '🛒' },
              { name: 'Crypto Investments', budgetedAmount: 10000, color: '#F7931A', icon: '₿' },
              { name: 'Entertainment', budgetedAmount: 3000, color: '#96CEB4', icon: '🎮' },
              { name: 'Transportation', budgetedAmount: 2500, color: '#45B7D1', icon: '🚗' },
              { name: 'Utilities', budgetedAmount: 2000, color: '#48C9B0', icon: '💡' },
            ],
          },
        },
      },
    },
  });

  // Add Diego's DeFi/Web3 accounts (separate creates for ID capture)
  const [diegoDefiEth, diegoDefiPolygon, diegoSandboxLand, diegoDaoGov] = await Promise.all([
    prisma.account.create({
      data: {
        spaceId: diegoSpace.id,
        provider: Provider.blockchain,
        providerAccountId: 'diego-defi-ethereum',
        name: 'Ethereum DeFi Wallet',
        type: 'crypto',
        subtype: 'defi',
        currency: Currency.USD,
        balance: 28500,
        metadata: {
          network: 'ethereum',
          protocols: ['uniswap', 'aave', 'curve', 'lido'],
          positions: {
            uniswap: { type: 'lp', pool: 'ETH/USDC', shareUsd: 8200 },
            aave: { type: 'lending', supplied: 'ETH', supplyUsd: 9500, apy: 3.2 },
            curve: { type: 'lp', pool: '3pool', shareUsd: 5800 },
            lido: { type: 'staking', staked: '2.1 ETH', stETHUsd: 5000, apy: 3.8 },
          },
        },
        lastSyncedAt: new Date(),
      },
    }),
    prisma.account.create({
      data: {
        spaceId: diegoSpace.id,
        provider: Provider.blockchain,
        providerAccountId: 'diego-defi-polygon',
        name: 'Polygon DeFi Wallet',
        type: 'crypto',
        subtype: 'defi',
        currency: Currency.USD,
        balance: 6200,
        metadata: {
          network: 'polygon',
          protocols: ['quickswap', 'aave-polygon'],
          positions: {
            quickswap: { type: 'lp', pool: 'MATIC/USDC', shareUsd: 3200 },
            aavePolygon: { type: 'lending', supplied: 'USDC', supplyUsd: 3000, apy: 4.1 },
          },
        },
        lastSyncedAt: new Date(),
      },
    }),
    prisma.account.create({
      data: {
        spaceId: diegoSpace.id,
        provider: Provider.manual,
        providerAccountId: 'diego-sandbox-land',
        name: 'Sandbox LAND Portfolio',
        type: 'crypto',
        subtype: 'gaming',
        currency: Currency.USD,
        balance: 7800,
        metadata: {
          platform: 'The Sandbox',
          parcels: [
            { coordinates: '(-12, 45)', size: '3x3', acquiredDate: '2022-01-15' },
            { coordinates: '(8, -22)', size: '1x1', acquiredDate: '2022-06-10' },
            { coordinates: '(31, 17)', size: '1x1', acquiredDate: '2023-03-01' },
          ],
          stakedSAND: 15000,
          stakingApy: 8.5,
        },
        lastSyncedAt: new Date(),
      },
    }),
    prisma.account.create({
      data: {
        spaceId: diegoSpace.id,
        provider: Provider.blockchain,
        providerAccountId: 'diego-dao-governance',
        name: 'DAO Governance Tokens',
        type: 'crypto',
        subtype: 'wallet',
        currency: Currency.USD,
        balance: 9400,
        metadata: {
          tokens: {
            ENS: { balance: 120, delegatedTo: 'self', votingPower: 120, valueUsd: 2400 },
            UNI: { balance: 450, delegatedTo: 'self', votingPower: 450, valueUsd: 3600 },
            AAVE: { balance: 35, delegatedTo: 'aave-governance.eth', votingPower: 35, valueUsd: 3400 },
          },
          proposals_voted: 14,
          last_vote_date: '2025-12-15',
        },
        lastSyncedAt: new Date(),
      },
    }),
  ]);

  // Set creditLimit on credit accounts (not available in nested create)
  await Promise.all([
    prisma.account.updateMany({
      where: { spaceId: guestSpace.id, providerAccountId: 'guest-credit' },
      data: { creditLimit: 50000 },
    }),
    prisma.account.updateMany({
      where: { spaceId: mariaSpace.id, providerAccountId: 'maria-amex' },
      data: { creditLimit: 5000 },
    }),
    prisma.account.updateMany({
      where: { spaceId: carlosBusiness.id, providerAccountId: 'business-credit' },
      data: { creditLimit: 250000 },
    }),
    prisma.account.updateMany({
      where: { spaceId: enterpriseSpace.id, providerAccountId: 'enterprise-amex' },
      data: { creditLimit: 500000 },
    }),
  ]);

  return {
    guestUser,
    mariaUser,
    carlosUser,
    adminUser,
    platformAdmin,
    diegoUser,
    guestSpace,
    mariaSpace,
    carlosPersonal,
    carlosBusiness,
    enterpriseSpace,
    diegoSpace,
    diegoDefiEthAccountId: diegoDefiEth.id,
    diegoDefiPolygonAccountId: diegoDefiPolygon.id,
    diegoSandboxLandAccountId: diegoSandboxLand.id,
    diegoDaoGovernanceAccountId: diegoDaoGov.id,
  };
}
