import { startOfMonth, endOfMonth } from 'date-fns';

import { Currency, SpaceType, BudgetPeriod, Provider, User } from '@db';

import { PrismaService } from '../prisma/prisma.service';

interface GeoDefaults {
  locale: string;
  timezone: string;
  currency: string;
}

/**
 * Builds demo persona data at runtime when seed hasn't been run.
 * Each builder method is idempotent — skips creation if the user already has accounts.
 */
export class DemoDataBuilder {
  constructor(private prisma: PrismaService) {}

  async buildPersona(personaKey: string, geo: GeoDefaults): Promise<User> {
    const builders: Record<string, () => Promise<User>> = {
      guest: () => this.buildGuestPersona(geo),
      maria: () => this.buildMariaPersona(geo),
      carlos: () => this.buildCarlosPersona(geo),
      patricia: () => this.buildPatriciaPersona(geo),
      diego: () => this.buildDiegoPersona(geo),
    };

    const builder = builders[personaKey];
    if (!builder) {
      throw new Error(`Unknown persona: ${personaKey}`);
    }

    return builder();
  }

  private async buildGuestPersona(geo: GeoDefaults): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: 'guest@dhanam.demo',
        passwordHash: 'GUEST_NO_PASSWORD',
        name: 'Guest User',
        locale: geo.locale,
        timezone: geo.timezone,
        emailVerified: true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });

    await this.prisma.space.create({
      data: {
        name: 'Demo Personal Finance',
        type: SpaceType.personal,
        currency: geo.currency as Currency,
        timezone: geo.timezone,
        userSpaces: { create: { userId: user.id, role: 'viewer' } },
        accounts: {
          create: [
            {
              provider: Provider.manual,
              providerAccountId: 'guest-checking',
              name: 'BBVA Checking',
              type: 'checking',
              subtype: 'checking',
              currency: Currency.MXN,
              balance: 45320.5,
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
              ],
            },
          },
        },
      },
    });

    return user;
  }

  private async buildMariaPersona(_geo: GeoDefaults): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: 'maria@dhanam.demo',
        passwordHash: 'DEMO_NO_PASSWORD',
        name: 'Maria González',
        locale: 'es',
        timezone: 'America/Mexico_City',
        emailVerified: true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });

    await this.prisma.space.create({
      data: {
        name: 'Personal',
        type: SpaceType.personal,
        currency: Currency.MXN,
        timezone: 'America/Mexico_City',
        userSpaces: { create: { userId: user.id, role: 'owner' } },
        accounts: {
          create: [
            {
              provider: Provider.belvo,
              providerAccountId: 'maria-bbva-checking',
              name: 'BBVA Nómina',
              type: 'checking',
              subtype: 'checking',
              currency: Currency.MXN,
              balance: 28750.3,
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
                { name: 'Savings', budgetedAmount: 15000, color: '#FECA57', icon: '💰' },
                { name: 'Entertainment', budgetedAmount: 4000, color: '#96CEB4', icon: '🎬' },
              ],
            },
          },
        },
      },
    });

    return user;
  }

  private async buildCarlosPersona(_geo: GeoDefaults): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: 'carlos@dhanam.demo',
        passwordHash: 'DEMO_NO_PASSWORD',
        name: 'Carlos Mendoza',
        locale: 'es',
        timezone: 'America/Mexico_City',
        emailVerified: true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });

    // Personal space
    await this.prisma.space.create({
      data: {
        name: 'Personal',
        type: SpaceType.personal,
        currency: Currency.MXN,
        timezone: 'America/Mexico_City',
        userSpaces: { create: { userId: user.id, role: 'owner' } },
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

    // Business space
    await this.prisma.space.create({
      data: {
        name: 'Tacos El Patrón',
        type: SpaceType.business,
        currency: Currency.MXN,
        timezone: 'America/Mexico_City',
        userSpaces: { create: { userId: user.id, role: 'owner' } },
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
          ],
        },
        budgets: {
          create: {
            name: 'Q1 Budget',
            period: BudgetPeriod.quarterly,
            income: 1500000,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-03-31'),
            categories: {
              create: [
                { name: 'Payroll', budgetedAmount: 450000, color: '#FF6B6B', icon: '👥' },
                { name: 'Inventory', budgetedAmount: 300000, color: '#4ECDC4', icon: '📦' },
                { name: 'Rent', budgetedAmount: 105000, color: '#45B7D1', icon: '🏢' },
              ],
            },
          },
        },
      },
    });

    return user;
  }

  private async buildPatriciaPersona(_geo: GeoDefaults): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: 'patricia@dhanam.demo',
        passwordHash: 'DEMO_NO_PASSWORD',
        name: 'Patricia Ruiz',
        locale: 'en',
        timezone: 'America/Mexico_City',
        emailVerified: true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });

    await this.prisma.space.create({
      data: {
        name: 'TechCorp México',
        type: SpaceType.business,
        currency: Currency.USD,
        timezone: 'America/Mexico_City',
        userSpaces: { create: [{ userId: user.id, role: 'owner' }] },
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
            name: 'Annual Budget',
            period: BudgetPeriod.yearly,
            income: 10000000,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            categories: {
              create: [
                { name: 'Salaries', budgetedAmount: 5000000, color: '#FF6B6B', icon: '💼' },
                { name: 'Infrastructure', budgetedAmount: 1500000, color: '#4ECDC4', icon: '🖥️' },
                { name: 'R&D', budgetedAmount: 1500000, color: '#96CEB4', icon: '🔬' },
              ],
            },
          },
        },
      },
    });

    return user;
  }

  private async buildDiegoPersona(_geo: GeoDefaults): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: 'diego@dhanam.demo',
        passwordHash: 'DEMO_NO_PASSWORD',
        name: 'Diego Navarro',
        locale: 'es',
        timezone: 'America/Mexico_City',
        emailVerified: true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });

    await this.prisma.space.create({
      data: {
        name: 'Personal',
        type: SpaceType.personal,
        currency: Currency.MXN,
        timezone: 'America/Mexico_City',
        userSpaces: { create: { userId: user.id, role: 'owner' } },
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
              providerAccountId: 'diego-defi-ethereum',
              name: 'Ethereum DeFi Wallet',
              type: 'crypto',
              subtype: 'defi',
              currency: Currency.USD,
              balance: 28500,
              metadata: { network: 'ethereum', protocols: ['uniswap', 'aave', 'curve', 'lido'] },
              lastSyncedAt: new Date(),
            },
            {
              provider: Provider.blockchain,
              providerAccountId: 'diego-defi-polygon',
              name: 'Polygon DeFi Wallet',
              type: 'crypto',
              subtype: 'defi',
              currency: Currency.USD,
              balance: 6200,
              metadata: { network: 'polygon', protocols: ['quickswap', 'aave-polygon'] },
              lastSyncedAt: new Date(),
            },
            {
              provider: Provider.manual,
              providerAccountId: 'diego-sandbox-land',
              name: 'Sandbox LAND Portfolio',
              type: 'crypto',
              subtype: 'gaming',
              currency: Currency.USD,
              balance: 7800,
              metadata: { platform: 'The Sandbox' },
              lastSyncedAt: new Date(),
            },
            {
              provider: Provider.blockchain,
              providerAccountId: 'diego-dao-governance',
              name: 'DAO Governance Tokens',
              type: 'crypto',
              subtype: 'wallet',
              currency: Currency.USD,
              balance: 9400,
              metadata: { tokens: { ENS: 2400, UNI: 3600, AAVE: 3400 } },
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
                { name: 'Crypto Investments', budgetedAmount: 10000, color: '#F7931A', icon: '₿' },
                { name: 'Gaming Purchases', budgetedAmount: 2000, color: '#E74C3C', icon: '🕹️' },
                { name: 'Gas Fees', budgetedAmount: 500, color: '#95A5A6', icon: '⛽' },
              ],
            },
          },
        },
      },
    });

    return user;
  }
}
