import { PrismaClient, SpaceType, GoalActivityAction, Currency } from '../../generated/prisma';
import { subDays } from 'date-fns';
import { SeedContext, randomAmount, randomDate, transactionTemplates, cryptoESGData } from './helpers';

export async function seedTransactions(prisma: PrismaClient, ctx: SeedContext) {
  // 1. BATCH TRANSACTIONS
  console.log('\n💰 Generating transactions...');

  const spaceEntries = [
    ctx.guestSpace,
    ctx.mariaSpace,
    ctx.carlosPersonal,
    ctx.carlosBusiness,
    ctx.enterpriseSpace,
    ctx.diegoSpace,
  ];

  for (const space of spaceEntries) {
    const accounts = await prisma.account.findMany({ where: { spaceId: space.id } });
    const categories = await prisma.category.findMany({ where: { budget: { spaceId: space.id } } });
    const checkingAccount = accounts.find(a => a.type === 'checking');
    if (!checkingAccount) continue;

    const endDate = new Date();
    const startDate = subDays(endDate, 180);
    const templates = space.type === SpaceType.business
      ? transactionTemplates.expenses.business
      : transactionTemplates.expenses.personal;

    // Build expense transactions in-memory
    const expenseTxns = Array.from({ length: 320 }, () => {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const category = categories.find(c => c.name.includes(template.category.split(' ')[0]));
      return {
        accountId: checkingAccount.id,
        categoryId: category?.id ?? null,
        amount: -randomAmount(template.range[0], template.range[1]),
        currency: checkingAccount.currency,
        description: template.name,
        merchant: template.name,
        date: randomDate(startDate, endDate),
        pending: false,
      };
    });

    // Build income transactions in-memory
    const incomeTxns = Array.from({ length: 20 }, () => {
      const template = transactionTemplates.income[Math.floor(Math.random() * transactionTemplates.income.length)];
      return {
        accountId: checkingAccount.id,
        amount: randomAmount(template.range[0], template.range[1]),
        currency: checkingAccount.currency,
        description: template.name,
        merchant: template.name,
        date: randomDate(startDate, endDate),
        pending: false,
      };
    });

    await prisma.transaction.createMany({ data: [...expenseTxns, ...incomeTxns] });
  }

  // 2. ESG SCORES (batch per account)
  console.log('\n🌱 Generating ESG scores...');

  const allCryptoAccounts = await prisma.account.findMany({ where: { type: 'crypto' } });

  for (const account of allCryptoAccounts) {
    const esgRows = cryptoESGData.map(c => ({
      accountId: account.id,
      assetSymbol: c.symbol,
      environmentalScore: c.env,
      socialScore: c.social,
      governanceScore: c.gov,
      calculatedAt: new Date(),
    }));

    await prisma.eSGScore.createMany({ data: esgRows });
  }
  console.log(`  ✓ Created ESG scores for ${allCryptoAccounts.length} crypto accounts`);

  // 3. ASSET VALUATIONS (batch per space)
  console.log('\n📊 Generating asset valuation history...');

  for (const space of spaceEntries) {
    const accounts = await prisma.account.findMany({ where: { spaceId: space.id } });
    const valuationRows: Array<{
      accountId: string;
      date: Date;
      value: number;
      currency: typeof accounts[0]['currency'];
    }> = [];

    for (const account of accounts) {
      for (let i = 60; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const variation = (Math.random() - 0.5) * 0.02;
        valuationRows.push({
          accountId: account.id,
          date,
          value: Number(account.balance) * (1 + variation),
          currency: account.currency,
        });
      }
    }

    await prisma.assetValuation.createMany({ data: valuationRows });
  }

  // 4. CATEGORIZATION RULES
  console.log('\n📋 Creating categorization rules...');

  const ruleDefinitions = [
    { keyword: 'oxxo', category: 'Groceries', spaceId: ctx.guestSpace.id },
    { keyword: 'soriana', category: 'Groceries', spaceId: ctx.guestSpace.id },
    { keyword: 'uber', category: 'Transportation', spaceId: ctx.guestSpace.id },
    { keyword: 'pemex', category: 'Transportation', spaceId: ctx.guestSpace.id },
    { keyword: 'netflix', category: 'Entertainment', spaceId: ctx.guestSpace.id },
    { keyword: 'spotify', category: 'Entertainment', spaceId: ctx.guestSpace.id },
    { keyword: 'starbucks', category: 'Food & Dining', spaceId: ctx.guestSpace.id },
    { keyword: 'restaurant', category: 'Food & Dining', spaceId: ctx.guestSpace.id },
    { keyword: 'cfe', category: 'Utilities', spaceId: ctx.guestSpace.id },
    { keyword: 'telmex', category: 'Utilities', spaceId: ctx.guestSpace.id },
    { keyword: 'amazon', category: 'Shopping', spaceId: ctx.guestSpace.id },
    { keyword: 'liverpool', category: 'Shopping', spaceId: ctx.guestSpace.id },
    { keyword: 'oxxo', category: 'Groceries', spaceId: ctx.mariaSpace.id },
    { keyword: 'uber', category: 'Transportation', spaceId: ctx.mariaSpace.id },
    { keyword: 'netflix', category: 'Entertainment', spaceId: ctx.mariaSpace.id },
    { keyword: 'spotify', category: 'Entertainment', spaceId: ctx.mariaSpace.id },
    { keyword: 'starbucks', category: 'Food & Dining', spaceId: ctx.mariaSpace.id },
    { keyword: 'payroll', category: 'Payroll', spaceId: ctx.carlosBusiness.id },
    { keyword: 'rent', category: 'Rent', spaceId: ctx.carlosBusiness.id },
    { keyword: 'aws', category: 'Infrastructure', spaceId: ctx.enterpriseSpace.id },
    { keyword: 'google', category: 'Marketing', spaceId: ctx.enterpriseSpace.id },
  ];

  // Resolve categories and batch-create rules
  const ruleRows: Array<{
    spaceId: string;
    name: string;
    conditions: { type: string; value: string };
    categoryId: string;
    enabled: boolean;
  }> = [];

  for (const rule of ruleDefinitions) {
    const category = await prisma.category.findFirst({
      where: { name: rule.category, budget: { spaceId: rule.spaceId } },
    });
    if (category) {
      ruleRows.push({
        spaceId: rule.spaceId,
        name: `Auto-categorize ${rule.keyword}`,
        conditions: { type: 'keyword', value: rule.keyword },
        categoryId: category.id,
        enabled: true,
      });
    }
  }
  await prisma.transactionRule.createMany({ data: ruleRows });

  // 5. AUDIT LOGS
  console.log('\n📝 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      { userId: ctx.mariaUser.id, action: 'user.login', metadata: JSON.stringify({ ip: '192.168.1.100', userAgent: 'Chrome' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.mariaUser.id, action: 'account.connected', metadata: JSON.stringify({ provider: 'belvo', accountId: 'maria-bbva-checking' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.carlosUser.id, action: 'totp.enabled', metadata: null, ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.carlosUser.id, action: 'budget.created', metadata: JSON.stringify({ budgetId: 'q1-2024' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.adminUser.id, action: 'space.created', metadata: JSON.stringify({ spaceName: 'TechCorp México' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.adminUser.id, action: 'user.invite_sent', metadata: JSON.stringify({ email: 'cfo@techcorp.com' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.platformAdmin.id, action: 'admin.user_view', metadata: JSON.stringify({ viewedUserId: ctx.mariaUser.id }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.platformAdmin.id, action: 'admin.feature_flag_toggle', metadata: JSON.stringify({ flag: 'ai_categorization', enabled: true }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      // Diego audit logs
      { userId: ctx.diegoUser.id, action: 'account.connected', metadata: JSON.stringify({ provider: 'blockchain', accountId: 'diego-btc-wallet' }), ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.diegoUser.id, action: 'account.connected', metadata: JSON.stringify({ provider: 'blockchain', accountId: 'diego-defi-arbitrum' }), ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.diegoUser.id, action: 'order.created', metadata: JSON.stringify({ assetSymbol: 'BTC', type: 'stop_loss', targetPrice: 55000 }), ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.diegoUser.id, action: 'order.executed', metadata: JSON.stringify({ assetSymbol: 'BTC', type: 'dca', amount: 1000, currency: 'MXN' }), ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.diegoUser.id, action: 'esg.viewed', metadata: JSON.stringify({ tokens: ['ETH', 'SOL', 'AXS', 'SAND'] }), ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.diegoUser.id, action: 'user.login', metadata: JSON.stringify({ ip: '10.0.1.50', userAgent: 'Chrome' }), ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.diegoUser.id, action: 'order.created', metadata: JSON.stringify({ assetSymbol: 'SAND', type: 'oco' }), ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.diegoUser.id, action: 'account.connected', metadata: JSON.stringify({ provider: 'blockchain', accountId: 'diego-defi-base' }), ipAddress: '10.0.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      // Patricia audit logs
      { userId: ctx.adminUser.id, action: 'report.generated', metadata: JSON.stringify({ reportType: 'monthly_summary', period: '2026-01' }), ipAddress: '192.168.1.200', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.adminUser.id, action: 'space.settings_changed', metadata: JSON.stringify({ spaceName: 'TechCorp México', changed: ['currency', 'timezone'] }), ipAddress: '192.168.1.200', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.adminUser.id, action: 'budget.updated', metadata: JSON.stringify({ budgetName: 'Annual 2024', changes: ['R&D +200K', 'Travel -50K'] }), ipAddress: '192.168.1.200', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.adminUser.id, action: 'user.login', metadata: JSON.stringify({ ip: '192.168.1.200', userAgent: 'Safari', device: 'iPad Pro' }), ipAddress: '192.168.1.200', userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.adminUser.id, action: 'report.generated', metadata: JSON.stringify({ reportType: 'tax_summary', year: 2025 }), ipAddress: '192.168.1.200', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.adminUser.id, action: 'account.connected', metadata: JSON.stringify({ provider: 'plaid', accountId: 'enterprise-chase' }), ipAddress: '192.168.1.200', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      // Carlos audit logs
      { userId: ctx.carlosUser.id, action: 'asset.added', metadata: JSON.stringify({ assetName: '1967 VW Beetle', type: 'vehicle' }), ipAddress: '192.168.1.150', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.carlosUser.id, action: 'goal.created', metadata: JSON.stringify({ goalName: 'Second Restaurant Location', target: 1500000 }), ipAddress: '192.168.1.150', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.carlosUser.id, action: 'transaction.split', metadata: JSON.stringify({ description: 'Costco Groceries', splitWith: 'Patricia' }), ipAddress: '192.168.1.150', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.carlosUser.id, action: 'user.login', metadata: JSON.stringify({ ip: '192.168.1.150', userAgent: 'Chrome' }), ipAddress: '192.168.1.150', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.carlosUser.id, action: 'budget.created', metadata: JSON.stringify({ budgetName: 'Q2 2024 Business' }), ipAddress: '192.168.1.150', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.carlosUser.id, action: 'asset.added', metadata: JSON.stringify({ assetName: 'Wine Collection', type: 'collectible' }), ipAddress: '192.168.1.150', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      // Maria audit logs
      { userId: ctx.mariaUser.id, action: 'goal.shared', metadata: JSON.stringify({ goalName: 'Family Trip to Europe', sharedWith: 'Guest User' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.mariaUser.id, action: 'category.corrected', metadata: JSON.stringify({ merchant: 'Uber Eats', from: 'Transport', to: 'Food & Dining' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.mariaUser.id, action: 'subscription.cancelled', metadata: JSON.stringify({ service: 'Gym - Sports World', reason: 'Switched to outdoor running' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.mariaUser.id, action: 'user.login', metadata: JSON.stringify({ ip: '192.168.1.100', userAgent: 'Safari', device: 'iPhone 15' }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.mariaUser.id, action: 'budget.updated', metadata: JSON.stringify({ changes: ['Entertainment +500', 'Savings -500'] }), ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      // Guest (Life Beat) audit logs
      { userId: ctx.guestUser.id, action: 'life_beat.responded', metadata: JSON.stringify({ alertLevel: 30, channel: 'email' }), ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.guestUser.id, action: 'executor.assigned', metadata: JSON.stringify({ executor: 'Maria González', priority: 1 }), ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.guestUser.id, action: 'will.reviewed', metadata: JSON.stringify({ lastReview: '2025-12-01' }), ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.guestUser.id, action: 'user.login', metadata: JSON.stringify({ ip: '192.168.1.50', userAgent: 'Chrome' }), ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      // Platform Admin audit logs
      { userId: ctx.platformAdmin.id, action: 'admin.impersonation', metadata: JSON.stringify({ impersonatedUser: ctx.mariaUser.id, reason: 'Support ticket #4521' }), ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.platformAdmin.id, action: 'admin.user_search', metadata: JSON.stringify({ query: 'carlos@dhanam.demo' }), ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.platformAdmin.id, action: 'admin.audit_export', metadata: JSON.stringify({ dateRange: '2025-12-01 to 2026-01-01', format: 'csv' }), ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.platformAdmin.id, action: 'admin.user_view', metadata: JSON.stringify({ viewedUserId: ctx.diegoUser.id }), ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.platformAdmin.id, action: 'admin.feature_flag_toggle', metadata: JSON.stringify({ flag: 'gaming_dashboard', enabled: true }), ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
      { userId: ctx.platformAdmin.id, action: 'admin.user_search', metadata: JSON.stringify({ query: 'diego@dhanam.demo' }), ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', timestamp: randomDate(subDays(new Date(), 30), new Date()) },
    ],
  });

  // 6. DEFI TRANSACTIONS (Diego)
  console.log('\n🔗 Generating DeFi transactions for Diego...');

  const diegoDefiEthAccount = ctx.diegoDefiEthAccountId
    ? await prisma.account.findUnique({ where: { id: ctx.diegoDefiEthAccountId } })
    : null;
  const diegoDefiPolyAccount = ctx.diegoDefiPolygonAccountId
    ? await prisma.account.findUnique({ where: { id: ctx.diegoDefiPolygonAccountId } })
    : null;
  const diegoDaoAccount = ctx.diegoDaoGovernanceAccountId
    ? await prisma.account.findUnique({ where: { id: ctx.diegoDaoGovernanceAccountId } })
    : null;
  const diegoSandboxAccount = ctx.diegoSandboxLandAccountId
    ? await prisma.account.findUnique({ where: { id: ctx.diegoSandboxLandAccountId } })
    : null;

  const defiTxns: Array<{
    accountId: string;
    amount: number;
    currency: Currency;
    description: string;
    merchant: string;
    date: Date;
    pending: boolean;
    metadata?: object;
  }> = [];

  if (diegoDefiEthAccount) {
    defiTxns.push(
      { accountId: diegoDefiEthAccount.id, amount: -2500, currency: Currency.USD, description: 'Uniswap V3: Swap ETH → USDC', merchant: 'Uniswap', date: subDays(new Date(), 45), pending: false, metadata: { protocol: 'uniswap', type: 'swap' } },
      { accountId: diegoDefiEthAccount.id, amount: -5000, currency: Currency.USD, description: 'Aave V3: Supply ETH', merchant: 'Aave', date: subDays(new Date(), 40), pending: false, metadata: { protocol: 'aave', type: 'supply' } },
      { accountId: diegoDefiEthAccount.id, amount: 120, currency: Currency.USD, description: 'Aave V3: Interest earned', merchant: 'Aave', date: subDays(new Date(), 5), pending: false, metadata: { protocol: 'aave', type: 'yield' } },
      { accountId: diegoDefiEthAccount.id, amount: -3000, currency: Currency.USD, description: 'Curve: Deposit to 3pool', merchant: 'Curve Finance', date: subDays(new Date(), 35), pending: false, metadata: { protocol: 'curve', type: 'lp_deposit' } },
      { accountId: diegoDefiEthAccount.id, amount: 85, currency: Currency.USD, description: 'Curve: CRV farming rewards', merchant: 'Curve Finance', date: subDays(new Date(), 7), pending: false, metadata: { protocol: 'curve', type: 'farming_reward' } },
      { accountId: diegoDefiEthAccount.id, amount: -4200, currency: Currency.USD, description: 'Lido: Stake 2.1 ETH → stETH', merchant: 'Lido', date: subDays(new Date(), 30), pending: false, metadata: { protocol: 'lido', type: 'stake' } },
      { accountId: diegoDefiEthAccount.id, amount: 45, currency: Currency.USD, description: 'Lido: stETH staking rewards', merchant: 'Lido', date: subDays(new Date(), 3), pending: false, metadata: { protocol: 'lido', type: 'staking_reward' } },
    );
  }

  if (diegoDefiPolyAccount) {
    defiTxns.push(
      { accountId: diegoDefiPolyAccount.id, amount: -2000, currency: Currency.USD, description: 'QuickSwap: Add MATIC/USDC liquidity', merchant: 'QuickSwap', date: subDays(new Date(), 25), pending: false, metadata: { protocol: 'quickswap', type: 'lp_deposit' } },
      { accountId: diegoDefiPolyAccount.id, amount: 65, currency: Currency.USD, description: 'QuickSwap: LP fees earned', merchant: 'QuickSwap', date: subDays(new Date(), 4), pending: false, metadata: { protocol: 'quickswap', type: 'lp_fees' } },
    );
  }

  if (diegoDaoAccount) {
    defiTxns.push(
      { accountId: diegoDaoAccount.id, amount: -12, currency: Currency.USD, description: 'ENS DAO: Vote gas fee (Proposal #42)', merchant: 'ENS DAO', date: subDays(new Date(), 20), pending: false, metadata: { protocol: 'ens', type: 'governance_vote' } },
      { accountId: diegoDaoAccount.id, amount: -8, currency: Currency.USD, description: 'Uniswap Gov: Vote gas fee (Proposal #18)', merchant: 'Uniswap Governance', date: subDays(new Date(), 15), pending: false, metadata: { protocol: 'uniswap', type: 'governance_vote' } },
      { accountId: diegoDaoAccount.id, amount: -15, currency: Currency.USD, description: 'Aave Gov: Delegate voting power', merchant: 'Aave Governance', date: subDays(new Date(), 50), pending: false, metadata: { protocol: 'aave', type: 'delegate' } },
    );
  }

  if (diegoSandboxAccount) {
    defiTxns.push(
      { accountId: diegoSandboxAccount.id, amount: 320, currency: Currency.USD, description: 'Sandbox: SAND staking rewards', merchant: 'The Sandbox', date: subDays(new Date(), 10), pending: false, metadata: { protocol: 'sandbox', type: 'staking_reward' } },
      { accountId: diegoSandboxAccount.id, amount: 1200, currency: Currency.USD, description: 'Sandbox: Marketplace LAND sale', merchant: 'The Sandbox', date: subDays(new Date(), 60), pending: false, metadata: { protocol: 'sandbox', type: 'nft_sale' } },
      { accountId: diegoSandboxAccount.id, amount: -800, currency: Currency.USD, description: 'Sandbox: Purchase 1x1 LAND parcel', merchant: 'The Sandbox', date: subDays(new Date(), 90), pending: false, metadata: { protocol: 'sandbox', type: 'nft_purchase' } },
    );
  }

  // L2 DeFi transactions (Arbitrum & Base)
  const diegoDefiArbAccount = ctx.diegoDefiArbitrumAccountId
    ? await prisma.account.findUnique({ where: { id: ctx.diegoDefiArbitrumAccountId } })
    : null;
  const diegoDefiBaseAccount = ctx.diegoDefiBaseAccountId
    ? await prisma.account.findUnique({ where: { id: ctx.diegoDefiBaseAccountId } })
    : null;
  const diegoDecentralandAccount = ctx.diegoDecentralandAccountId
    ? await prisma.account.findUnique({ where: { id: ctx.diegoDecentralandAccountId } })
    : null;
  const diegoBtcAccount = ctx.diegoBtcAccountId
    ? await prisma.account.findUnique({ where: { id: ctx.diegoBtcAccountId } })
    : null;

  if (diegoDefiArbAccount) {
    defiTxns.push(
      { accountId: diegoDefiArbAccount.id, amount: -2500, currency: Currency.USD, description: 'GMX: Open ETH/USD Long 2x', merchant: 'GMX', date: subDays(new Date(), 20), pending: false, metadata: { protocol: 'gmx', type: 'perpetual_open', leverage: 2 } },
      { accountId: diegoDefiArbAccount.id, amount: 180, currency: Currency.USD, description: 'GMX: Unrealized PnL ETH/USD', merchant: 'GMX', date: subDays(new Date(), 2), pending: false, metadata: { protocol: 'gmx', type: 'pnl' } },
      { accountId: diegoDefiArbAccount.id, amount: -2000, currency: Currency.USD, description: 'Radiant: Supply USDC', merchant: 'Radiant Capital', date: subDays(new Date(), 18), pending: false, metadata: { protocol: 'radiant', type: 'supply' } },
      { accountId: diegoDefiArbAccount.id, amount: 32, currency: Currency.USD, description: 'Radiant: USDC lending interest', merchant: 'Radiant Capital', date: subDays(new Date(), 1), pending: false, metadata: { protocol: 'radiant', type: 'yield' } },
      { accountId: diegoDefiArbAccount.id, amount: -15, currency: Currency.USD, description: 'Arbitrum: Bridge from ETH mainnet', merchant: 'Arbitrum Bridge', date: subDays(new Date(), 22), pending: false, metadata: { type: 'bridge', from: 'ethereum', to: 'arbitrum' } },
    );
  }

  if (diegoDefiBaseAccount) {
    defiTxns.push(
      { accountId: diegoDefiBaseAccount.id, amount: -1800, currency: Currency.USD, description: 'Aerodrome: Add ETH/USDC LP', merchant: 'Aerodrome', date: subDays(new Date(), 15), pending: false, metadata: { protocol: 'aerodrome', type: 'lp_deposit' } },
      { accountId: diegoDefiBaseAccount.id, amount: 45, currency: Currency.USD, description: 'Aerodrome: LP rewards (AERO)', merchant: 'Aerodrome', date: subDays(new Date(), 2), pending: false, metadata: { protocol: 'aerodrome', type: 'farming_reward' } },
      { accountId: diegoDefiBaseAccount.id, amount: -1000, currency: Currency.USD, description: 'Uniswap Base: Add cbETH/WETH LP', merchant: 'Uniswap', date: subDays(new Date(), 12), pending: false, metadata: { protocol: 'uniswap-base', type: 'lp_deposit' } },
      { accountId: diegoDefiBaseAccount.id, amount: 12, currency: Currency.USD, description: 'Uniswap Base: LP fees earned', merchant: 'Uniswap', date: subDays(new Date(), 1), pending: false, metadata: { protocol: 'uniswap-base', type: 'lp_fees' } },
      { accountId: diegoDefiBaseAccount.id, amount: -8, currency: Currency.USD, description: 'Base: Bridge from ETH mainnet', merchant: 'Base Bridge', date: subDays(new Date(), 16), pending: false, metadata: { type: 'bridge', from: 'ethereum', to: 'base' } },
    );
  }

  // NFT Royalty income
  if (diegoSandboxAccount) {
    defiTxns.push(
      { accountId: diegoSandboxAccount.id, amount: 45, currency: Currency.USD, description: 'Sandbox: Marketplace royalty payment', merchant: 'The Sandbox', date: subDays(new Date(), 8), pending: false, metadata: { protocol: 'sandbox', type: 'royalty' } },
    );
  }
  if (diegoDefiEthAccount) {
    defiTxns.push(
      { accountId: diegoDefiEthAccount.id, amount: 120, currency: Currency.USD, description: 'OpenSea: Creator royalty (BAYC derivative)', merchant: 'OpenSea', date: subDays(new Date(), 12), pending: false, metadata: { protocol: 'opensea', type: 'royalty', collection: 'BAYC Derivatives' } },
    );
  }
  if (diegoDecentralandAccount) {
    defiTxns.push(
      { accountId: diegoDecentralandAccount.id, amount: 85, currency: Currency.USD, description: 'Decentraland: Wearable sale', merchant: 'Decentraland Marketplace', date: subDays(new Date(), 6), pending: false, metadata: { protocol: 'decentraland', type: 'nft_sale', item: 'Rare Cyberpunk Jacket' } },
    );
  }

  // Cross-chain bridge transactions
  if (diegoDefiEthAccount && diegoDefiArbAccount) {
    defiTxns.push(
      { accountId: diegoDefiEthAccount.id, amount: -1000, currency: Currency.USD, description: 'Bridge: ETH → Arbitrum (1000 USDC)', merchant: 'Arbitrum Bridge', date: subDays(new Date(), 22), pending: false, metadata: { type: 'bridge_out', destination: 'arbitrum', amount: 1000, token: 'USDC' } },
    );
  }
  if (diegoDefiEthAccount && diegoDefiBaseAccount) {
    defiTxns.push(
      { accountId: diegoDefiEthAccount.id, amount: -500, currency: Currency.USD, description: 'Bridge: ETH → Base (0.25 ETH)', merchant: 'Base Bridge', date: subDays(new Date(), 16), pending: false, metadata: { type: 'bridge_out', destination: 'base', amount: 0.25, token: 'ETH' } },
    );
  }

  if (defiTxns.length > 0) {
    await prisma.transaction.createMany({ data: defiTxns });
    console.log(`  ✓ Created ${defiTxns.length} DeFi/L2/bridge transactions for Diego`);
  }
}
