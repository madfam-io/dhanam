import { PrismaClient, Currency, AccountOwnership } from '../../generated/prisma';
import { subDays, addDays } from 'date-fns';
import { SeedContext } from './helpers';

export async function seedFeatures(prisma: PrismaClient, ctx: SeedContext) {
  // 1. MANUAL ASSETS
  console.log('\n🏠 Creating manual assets...');

  const [carlosCondo, carlosTesla, patriciaPE, patriciaArt, diegoLand, diegoBayc, diegoWearables, diegoDomain] =
    await Promise.all([
      prisma.manualAsset.create({
        data: {
          spaceId: ctx.carlosPersonal.id,
          name: 'CDMX Condo - Condesa',
          type: 'real_estate',
          description: '2BR/2BA condo in Colonia Condesa, Mexico City',
          currentValue: 4200000,
          currency: Currency.MXN,
          acquisitionDate: new Date('2020-03-15'),
          acquisitionCost: 3500000,
          metadata: { address: 'Av. Amsterdam 245', city: 'CDMX', state: 'CDMX', sqft: 95, propertyType: 'condo', bedrooms: 2, bathrooms: 2 },
        },
      }),
      prisma.manualAsset.create({
        data: {
          spaceId: ctx.carlosPersonal.id,
          name: '2022 Tesla Model 3',
          type: 'vehicle',
          description: 'Tesla Model 3 Long Range, Midnight Silver',
          currentValue: 620000,
          currency: Currency.MXN,
          acquisitionDate: new Date('2022-06-01'),
          acquisitionCost: 890000,
          metadata: { make: 'Tesla', model: 'Model 3', year: 2022, mileage: 35000, vin: '5YJ3E1EA1NF000001' },
        },
      }),
      prisma.manualAsset.create({
        data: {
          spaceId: ctx.enterpriseSpace.id,
          name: 'Sequoia Capital Fund XIV',
          type: 'private_equity',
          description: 'LP stake in Sequoia Capital Growth Fund XIV',
          currentValue: 50000,
          currency: Currency.USD,
          acquisitionDate: new Date('2021-09-01'),
          acquisitionCost: 50000,
          metadata: { companyName: 'Sequoia Capital', investmentDate: '2021-09-01', ownershipPercentage: 0.001, shares: 50, shareClass: 'LP' },
        },
      }),
      prisma.manualAsset.create({
        data: {
          spaceId: ctx.enterpriseSpace.id,
          name: 'Frida Kahlo Lithograph - Self Portrait',
          type: 'art',
          description: 'Authenticated Frida Kahlo lithograph, limited edition #23/100',
          currentValue: 180000,
          currency: Currency.MXN,
          acquisitionDate: new Date('2019-11-20'),
          acquisitionCost: 120000,
          metadata: { category: 'lithograph', year: 1944, condition: 'excellent', authenticity: 'verified' },
        },
      }),
      prisma.manualAsset.create({
        data: {
          spaceId: ctx.diegoSpace.id,
          name: 'The Sandbox LAND 3x3',
          type: 'collectible',
          description: '3x3 LAND plot in The Sandbox metaverse',
          currentValue: 2400,
          currency: Currency.USD,
          acquisitionDate: new Date('2022-01-15'),
          acquisitionCost: 4200,
          metadata: { category: 'metaverse_land', platform: 'The Sandbox', coordinates: '(-12, 45)', size: '3x3' },
        },
      }),
      prisma.manualAsset.create({
        data: {
          spaceId: ctx.diegoSpace.id,
          name: 'BAYC #7291',
          type: 'collectible',
          description: 'Bored Ape Yacht Club NFT #7291',
          currentValue: 18500,
          currency: Currency.USD,
          acquisitionDate: new Date('2021-08-10'),
          acquisitionCost: 32000,
          metadata: { category: 'nft', collection: 'Bored Ape Yacht Club', tokenId: 7291, blockchain: 'ethereum' },
        },
      }),
      prisma.manualAsset.create({
        data: {
          spaceId: ctx.diegoSpace.id,
          name: 'Decentraland Wearables Collection',
          type: 'collectible',
          description: 'Collection of rare Decentraland wearable NFTs',
          currentValue: 850,
          currency: Currency.USD,
          acquisitionDate: new Date('2022-05-20'),
          acquisitionCost: 1200,
          metadata: { category: 'nft_wearable', platform: 'Decentraland', items: 12 },
        },
      }),
      prisma.manualAsset.create({
        data: {
          spaceId: ctx.diegoSpace.id,
          name: 'diegonavarro.eth',
          type: 'domain',
          description: 'Premium ENS domain name',
          currentValue: 3200,
          currency: Currency.USD,
          acquisitionDate: new Date('2021-12-01'),
          acquisitionCost: 800,
          metadata: { domain: 'diegonavarro.eth', registrar: 'ENS', expiryDate: '2026-12-01' },
        },
      }),
    ]);

  // Additional manual assets for missing ManualAssetType coverage
  const [patriciaAngel, patriciaJewelry, carlosJewelry, diegoSandboxPortfolio] = await Promise.all([
    prisma.manualAsset.create({
      data: {
        spaceId: ctx.enterpriseSpace.id,
        name: 'Fintech Startup Series A',
        type: 'angel_investment',
        description: 'Angel investment in LATAM fintech startup - Series A round',
        currentValue: 50000,
        currency: Currency.USD,
        acquisitionDate: new Date('2023-03-15'),
        acquisitionCost: 50000,
        metadata: { companyName: 'PayLatam', round: 'Series A', equity: '0.5%', sector: 'fintech', stage: 'growth' },
      },
    }),
    prisma.manualAsset.create({
      data: {
        spaceId: ctx.enterpriseSpace.id,
        name: 'Estate Jewelry Collection',
        type: 'jewelry',
        description: 'Inherited estate jewelry collection - appraised value',
        currentValue: 25000,
        currency: Currency.USD,
        acquisitionDate: new Date('2018-06-01'),
        acquisitionCost: 15000,
        metadata: { items: 8, lastAppraisal: '2024-11-15', appraiser: 'Christie\'s México', insured: true },
      },
    }),
    prisma.manualAsset.create({
      data: {
        spaceId: ctx.carlosPersonal.id,
        name: 'Watch Collection',
        type: 'jewelry',
        description: 'Luxury watch collection (Rolex Submariner, Omega Speedmaster, TAG Heuer)',
        currentValue: 15000,
        currency: Currency.USD,
        acquisitionDate: new Date('2019-12-25'),
        acquisitionCost: 12000,
        metadata: { items: 3, watches: ['Rolex Submariner', 'Omega Speedmaster', 'TAG Heuer Carrera'], insured: true },
      },
    }),
    prisma.manualAsset.create({
      data: {
        spaceId: ctx.diegoSpace.id,
        name: 'Sandbox LAND Portfolio (Virtual RE)',
        type: 'other',
        description: 'Portfolio of Sandbox metaverse LAND parcels tracked as virtual real estate',
        currentValue: 7800,
        currency: Currency.USD,
        acquisitionDate: new Date('2022-01-15'),
        acquisitionCost: 12000,
        metadata: { category: 'virtual_real_estate', platform: 'The Sandbox', totalParcels: 5, totalSize: '7 plots' },
      },
    }),
  ]);

  // Batch valuation history for all manual assets
  const allManualAssets = [carlosCondo, carlosTesla, patriciaPE, patriciaArt, diegoLand, diegoBayc, diegoWearables, diegoDomain, patriciaAngel, patriciaJewelry, carlosJewelry, diegoSandboxPortfolio];
  const valuationRows: Array<{
    assetId: string;
    date: Date;
    value: number;
    currency: Currency;
    source: string;
  }> = [];

  for (const asset of allManualAssets) {
    for (let week = 8; week >= 0; week--) {
      const date = subDays(new Date(), week * 7);
      const variation = (Math.random() - 0.5) * 0.04;
      valuationRows.push({
        assetId: asset.id,
        date,
        value: Number(asset.currentValue) * (1 + variation),
        currency: asset.currency,
        source: asset.type === 'real_estate' ? 'zillow_api' : 'Manual Entry',
      });
    }
  }
  await prisma.manualAssetValuation.createMany({ data: valuationRows });

  // PE Cash Flows (batch)
  await prisma.privateEquityCashFlow.createMany({
    data: [
      { assetId: patriciaPE.id, type: 'capital_call', amount: -15000, currency: Currency.USD, date: new Date('2021-09-15'), description: 'Initial capital call' },
      { assetId: patriciaPE.id, type: 'capital_call', amount: -20000, currency: Currency.USD, date: new Date('2022-03-01'), description: 'Second capital call' },
      { assetId: patriciaPE.id, type: 'capital_call', amount: -15000, currency: Currency.USD, date: new Date('2022-09-01'), description: 'Final capital call' },
      { assetId: patriciaPE.id, type: 'management_fee', amount: -1000, currency: Currency.USD, date: new Date('2023-01-15'), description: '2023 management fee' },
      { assetId: patriciaPE.id, type: 'distribution', amount: 8000, currency: Currency.USD, date: new Date('2023-06-30'), description: 'Q2 2023 distribution' },
      { assetId: patriciaPE.id, type: 'management_fee', amount: -1000, currency: Currency.USD, date: new Date('2024-01-15'), description: '2024 management fee' },
      { assetId: patriciaPE.id, type: 'distribution', amount: 12000, currency: Currency.USD, date: new Date('2024-06-30'), description: 'Q2 2024 distribution' },
      { assetId: patriciaPE.id, type: 'distribution', amount: 5000, currency: Currency.USD, date: new Date('2024-12-31'), description: 'Q4 2024 distribution' },
    ],
  });

  console.log('  ✓ Created 12 manual assets with valuation history');
  console.log('  ✓ Created 8 PE cash flows for Sequoia fund');

  // 2. RECURRING TRANSACTIONS (batch)
  console.log('\n🔄 Creating recurring transactions...');

  await prisma.recurringTransaction.createMany({
    data: [
      { spaceId: ctx.mariaSpace.id, merchantName: 'Rent Payment', expectedAmount: 15000, currency: Currency.MXN, frequency: 'monthly', status: 'confirmed', occurrenceCount: 12, confidence: 0.99, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.mariaSpace.id, merchantName: 'Salary Deposit', expectedAmount: 42000, currency: Currency.MXN, frequency: 'biweekly', status: 'confirmed', occurrenceCount: 24, confidence: 0.98, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.mariaSpace.id, merchantName: 'Gym Membership', expectedAmount: 899, currency: Currency.MXN, frequency: 'monthly', status: 'confirmed', occurrenceCount: 8, confidence: 0.95, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.carlosPersonal.id, merchantName: 'Car Insurance', expectedAmount: 3500, currency: Currency.MXN, frequency: 'monthly', status: 'confirmed', occurrenceCount: 10, confidence: 0.97, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.carlosPersonal.id, merchantName: 'Salary Deposit', expectedAmount: 65000, currency: Currency.MXN, frequency: 'biweekly', status: 'confirmed', occurrenceCount: 24, confidence: 0.99, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.carlosBusiness.id, merchantName: 'Office Rent', expectedAmount: 35000, currency: Currency.MXN, frequency: 'monthly', status: 'confirmed', occurrenceCount: 12, confidence: 0.99, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.carlosBusiness.id, merchantName: 'Business Loan Payment', expectedAmount: 18500, currency: Currency.MXN, frequency: 'monthly', status: 'confirmed', occurrenceCount: 10, confidence: 0.98, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.diegoSpace.id, merchantName: 'Rent Payment', expectedAmount: 12000, currency: Currency.MXN, frequency: 'monthly', status: 'confirmed', occurrenceCount: 6, confidence: 0.99, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.diegoSpace.id, merchantName: 'Cloud Hosting', expectedAmount: 49, currency: Currency.USD, frequency: 'monthly', status: 'confirmed', occurrenceCount: 8, confidence: 0.92, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.diegoSpace.id, merchantName: 'Salary Deposit', expectedAmount: 38000, currency: Currency.MXN, frequency: 'weekly', status: 'confirmed', occurrenceCount: 18, confidence: 0.70, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 60) },
      { spaceId: ctx.diegoSpace.id, merchantName: 'LAND Rental - Parcel (-12, 45)', expectedAmount: 150, currency: Currency.USD, frequency: 'monthly', status: 'confirmed', occurrenceCount: 6, confidence: 0.88, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 45) },
      { spaceId: ctx.diegoSpace.id, merchantName: 'LAND Rental - Parcel (8, -22)', expectedAmount: 150, currency: Currency.USD, frequency: 'monthly', status: 'confirmed', occurrenceCount: 4, confidence: 0.85, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 30) },
      { spaceId: ctx.diegoSpace.id, merchantName: 'Sandbox Game Maker Revenue', expectedAmount: 320, currency: Currency.USD, frequency: 'monthly', status: 'confirmed', occurrenceCount: 3, confidence: 0.72, lastOccurrence: subDays(new Date(), Math.floor(Math.random() * 30)), nextExpected: addDays(new Date(), Math.floor(Math.random() * 30) + 1), confirmedAt: subDays(new Date(), 30) },
    ],
  });

  console.log('  ✓ Created 10 recurring transactions');

  // 3. SUBSCRIPTIONS (batch)
  console.log('\n📺 Creating subscriptions...');

  await prisma.subscription.createMany({
    data: [
      { spaceId: ctx.mariaSpace.id, serviceName: 'Netflix', category: 'streaming', amount: 199, currency: Currency.MXN, billingCycle: 'monthly', status: 'active', startDate: subDays(new Date(), Math.floor(Math.random() * 365) + 30), nextBillingDate: addDays(new Date(), Math.floor(Math.random() * 28) + 1), lastBillingDate: subDays(new Date(), Math.floor(Math.random() * 28)), annualCost: 2388, usageFrequency: 'high' },
      { spaceId: ctx.mariaSpace.id, serviceName: 'Spotify Family', category: 'music', amount: 269, currency: Currency.MXN, billingCycle: 'monthly', status: 'active', startDate: subDays(new Date(), Math.floor(Math.random() * 365) + 30), nextBillingDate: addDays(new Date(), Math.floor(Math.random() * 28) + 1), lastBillingDate: subDays(new Date(), Math.floor(Math.random() * 28)), annualCost: 3228, usageFrequency: 'high' },
      { spaceId: ctx.mariaSpace.id, serviceName: 'iCloud+ 200GB', category: 'cloud_storage', amount: 49, currency: Currency.MXN, billingCycle: 'monthly', status: 'active', startDate: subDays(new Date(), Math.floor(Math.random() * 365) + 30), nextBillingDate: addDays(new Date(), Math.floor(Math.random() * 28) + 1), lastBillingDate: subDays(new Date(), Math.floor(Math.random() * 28)), annualCost: 588, usageFrequency: 'medium' },
      { spaceId: ctx.carlosPersonal.id, serviceName: 'ChatGPT Plus', category: 'software', amount: 20, currency: Currency.USD, billingCycle: 'monthly', status: 'active', startDate: subDays(new Date(), Math.floor(Math.random() * 365) + 30), nextBillingDate: addDays(new Date(), Math.floor(Math.random() * 28) + 1), lastBillingDate: subDays(new Date(), Math.floor(Math.random() * 28)), annualCost: 240, usageFrequency: 'high' },
      { spaceId: ctx.carlosPersonal.id, serviceName: 'Adobe Creative Cloud', category: 'software', amount: 55, currency: Currency.USD, billingCycle: 'monthly', status: 'active', startDate: subDays(new Date(), Math.floor(Math.random() * 365) + 30), nextBillingDate: addDays(new Date(), Math.floor(Math.random() * 28) + 1), lastBillingDate: subDays(new Date(), Math.floor(Math.random() * 28)), annualCost: 660, usageFrequency: 'medium', savingsRecommendation: 'Consider annual plan ($53/mo saves $24/yr)' },
      { spaceId: ctx.carlosPersonal.id, serviceName: 'Gym - Sports World', category: 'fitness', amount: 1299, currency: Currency.MXN, billingCycle: 'monthly', status: 'active', startDate: subDays(new Date(), Math.floor(Math.random() * 365) + 30), nextBillingDate: addDays(new Date(), Math.floor(Math.random() * 28) + 1), lastBillingDate: subDays(new Date(), Math.floor(Math.random() * 28)), annualCost: 15588, usageFrequency: 'low', savingsRecommendation: 'Usage is low (2x/month). Consider downgrading or cancelling.' },
      { spaceId: ctx.diegoSpace.id, serviceName: 'AWS', category: 'software', amount: 85, currency: Currency.USD, billingCycle: 'monthly', status: 'active', startDate: subDays(new Date(), Math.floor(Math.random() * 365) + 30), nextBillingDate: addDays(new Date(), Math.floor(Math.random() * 28) + 1), lastBillingDate: subDays(new Date(), Math.floor(Math.random() * 28)), annualCost: 1020, usageFrequency: 'high', alternativeServices: [{ name: 'DigitalOcean', price: 48, url: 'https://digitalocean.com' }, { name: 'Hetzner', price: 35, url: 'https://hetzner.com' }] },
      { spaceId: ctx.diegoSpace.id, serviceName: 'Xbox Game Pass Ultimate', category: 'gaming', amount: 299, currency: Currency.MXN, billingCycle: 'monthly', status: 'active', startDate: subDays(new Date(), Math.floor(Math.random() * 365) + 30), nextBillingDate: addDays(new Date(), Math.floor(Math.random() * 28) + 1), lastBillingDate: subDays(new Date(), Math.floor(Math.random() * 28)), annualCost: 3588, usageFrequency: 'medium' },
    ],
  });

  console.log('  ✓ Created 8 active subscriptions');

  // 3b. CANCELLED & PAUSED SUBSCRIPTIONS (lifecycle demo)
  await prisma.subscription.createMany({
    data: [
      { spaceId: ctx.mariaSpace.id, serviceName: 'Gym - Sports World', category: 'fitness', amount: 1299, currency: Currency.MXN, billingCycle: 'monthly', status: 'cancelled', startDate: subDays(new Date(), 240), endDate: subDays(new Date(), 15), cancelledAt: subDays(new Date(), 15), cancellationReason: 'Switched to outdoor running and home workouts', annualCost: 15588, usageFrequency: 'low', lastBillingDate: subDays(new Date(), 45) },
      { spaceId: ctx.diegoSpace.id, serviceName: 'Discord Nitro', category: 'software', amount: 10, currency: Currency.USD, billingCycle: 'monthly', status: 'paused', startDate: subDays(new Date(), 180), annualCost: 120, usageFrequency: 'low', lastBillingDate: subDays(new Date(), 30), savingsRecommendation: 'Usage dropped to low — paused to evaluate need' },
    ],
  });

  console.log('  ✓ Created 2 cancelled/paused subscriptions');

  // 3c. JOINT ACCOUNT OWNERSHIP (Carlos + Patricia household)
  const carlosJointChecking = await prisma.account.findFirst({ where: { spaceId: ctx.carlosPersonal.id, type: 'checking' } });
  if (carlosJointChecking) {
    await prisma.account.update({
      where: { id: carlosJointChecking.id },
      data: { ownership: AccountOwnership.joint },
    });
    console.log('  ✓ Updated Carlos checking to joint ownership');
  }

  // 4. TRANSACTION SPLITS
  console.log('\n✂️ Creating transaction splits...');

  const carlosChecking = await prisma.account.findFirst({
    where: { spaceId: ctx.carlosPersonal.id, type: 'checking' },
  });

  if (carlosChecking) {
    const splitTransactions = [
      { description: 'Costco Groceries', amount: -4500, date: subDays(new Date(), 3), carlosPct: 50, patriciaPct: 50 },
      { description: 'CFE Electricity', amount: -2200, date: subDays(new Date(), 7), carlosPct: 50, patriciaPct: 50 },
      { description: 'Apartment Rent', amount: -25000, date: subDays(new Date(), 1), carlosPct: 60, patriciaPct: 40 },
      { description: 'Pujol Dinner', amount: -3800, date: subDays(new Date(), 10), carlosPct: 50, patriciaPct: 50 },
      { description: 'Cancún Vacation', amount: -45000, date: subDays(new Date(), 21), carlosPct: 60, patriciaPct: 40 },
      { description: 'IKEA Furniture', amount: -18000, date: subDays(new Date(), 14), carlosPct: 70, patriciaPct: 30 },
    ];

    for (const st of splitTransactions) {
      const txn = await prisma.transaction.create({
        data: {
          accountId: carlosChecking.id,
          amount: st.amount,
          currency: Currency.MXN,
          description: st.description,
          merchant: st.description.split(' ')[0],
          date: st.date,
          pending: false,
          isSplit: true,
        },
      });

      await prisma.transactionSplit.createMany({
        data: [
          {
            transactionId: txn.id,
            userId: ctx.carlosUser.id,
            amount: st.amount * st.carlosPct / 100,
            percentage: st.carlosPct,
            note: 'Carlos share',
          },
          {
            transactionId: txn.id,
            userId: ctx.adminUser.id,
            amount: st.amount * st.patriciaPct / 100,
            percentage: st.patriciaPct,
            note: 'Patricia share',
          },
        ],
      });
    }
  }

  console.log('  ✓ Created 6 split transactions with 12 splits');
}
