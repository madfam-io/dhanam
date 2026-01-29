import { PrismaClient } from '../generated/prisma';
import { seedUsers } from './seed/users';
import { seedTransactions } from './seed/transactions';
import { seedGoals } from './seed/goals';
import { seedHousehold } from './seed/household';
import { seedFeatures } from './seed/features';
import { seedMetadata } from './seed/metadata';
import { seedConnections } from './seed/connections';
import { seedAdvanced } from './seed/advanced';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enhanced database seeding...');
  console.log('─────────────────────────────────────────');

  // 1. Foundation: users, spaces, accounts, budgets
  const ctx = await seedUsers(prisma);

  // 2. Transactions, ESG scores, valuations, rules, audit logs
  await seedTransactions(prisma, ctx);

  // 3. Goals, Monte Carlo data, collaboration, activities
  await seedGoals(prisma, ctx);

  // 4. Household, estate planning, will, beneficiaries
  await seedHousehold(prisma, ctx);

  // 5. Manual assets, PE cash flows, recurring, subscriptions, splits
  await seedFeatures(prisma, ctx);

  // 6. Exchange rates, income events, billing, usage, notifications
  await seedMetadata(prisma, ctx);

  // 7. Provider connections, health status, institution mappings
  await seedConnections(prisma, ctx);

  // 8. Simulations, sharing, orders, executors, corrections
  await seedAdvanced(prisma, ctx);

  console.log('\n✅ Enhanced seeding completed!');
  console.log('─────────────────────────────────────────');
  console.log('\n📊 Summary:');
  console.log('  - 1 Guest user (instant demo access)');
  console.log('  - 1 Individual user (Maria) with zero-based budgeting');
  console.log('  - 1 Small business owner (Carlos) with manual assets');
  console.log('  - 1 Enterprise admin (Patricia) with PE fund');
  console.log('  - 1 Web3/Metaverse user (Diego) with DeFi, DAO, multi-chain');
  console.log('  - 1 Platform admin');
  console.log('  - 6 Spaces with budgets');
  console.log('  - 29 Connected accounts (incl. 4 new DeFi/DAO)');
  console.log('  - 12 Manual assets (jewelry, angel_investment, other)');
  console.log('  - 8 PE cash flows');
  console.log('  - 10 Recurring transactions');
  console.log('  - 8 Subscriptions');
  console.log('  - 6 Split transactions (12 splits)');
  console.log('  - 366 Exchange rates (61 days)');
  console.log('  - 6 Income events with 30 allocations');
  console.log('  - 4 Category goals');
  console.log('  - 3 Billing events');
  console.log('  - 20 Usage metrics');
  console.log('  - 16 Notifications (DeFi, ESG, Life Beat, executor)');
  console.log('  - 15 ESG tokens for all crypto accounts');
  console.log('  - 2,000+ Transactions (incl. DeFi swaps, staking, governance)');
  console.log('  - 1,500+ Asset valuations');
  console.log('  - 6 Connections + 12 attempts + 4 health statuses');
  console.log('  - 8 Institution-provider mappings');
  console.log('  - 4 Simulations (Monte Carlo, scenario, safe withdrawal)');
  console.log('  - 4 Account sharing permissions (Yours/Mine/Ours)');
  console.log('  - 6 Transaction orders + 4 executions');
  console.log('  - 2 Executor assignments (Life Beat)');
  console.log('  - 6 Category corrections (AI feedback loop)');
  console.log('  - Household, estate planning, goals, rules');
  console.log('\n🎉 Demo environment ready!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
