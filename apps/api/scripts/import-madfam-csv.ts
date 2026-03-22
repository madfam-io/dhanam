/**
 * MADFAM CSV → Dhanam Import Script
 *
 * Imports 117 Innovaciones MADFAM transactions from a Google Sheets CSV export.
 * Creates 3 spaces, accounts, categories, tags, and transactions.
 * Idempotent: safe to re-run (uses providerAccountId/providerTransactionId).
 *
 * Required env:
 *   CSV_PATH            - Path to the madfam-transactions.csv file
 *   DATABASE_URL        - Postgres connection string
 *
 * Optional env:
 *   TARGET_USER_EMAIL   - Dhanam user email (default: admin@madfam.io)
 *   DRY_RUN=true        - Log actions without writing to DB
 *
 * Usage:
 *   cd apps/api && CSV_PATH=../../data/madfam-transactions.csv pnpm tsx scripts/import-madfam-csv.ts
 */

import 'dotenv/config';
import * as fs from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '../generated/prisma';

import {
  parseCsv,
  routeToSpace,
  mapAccount,
  mapAmount,
  mapDate,
  parseGroupAndCategory,
  isIncomeGroup,
} from '../src/modules/migration/madfam-csv/madfam-csv-mapper';
import type {
  MadfamCsvRow,
  SpaceTarget,
} from '../src/modules/migration/madfam-csv/madfam-csv-types';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Default to DRY_RUN in production unless explicitly disabled
const isProduction = process.env.NODE_ENV === 'production';
const DRY_RUN = process.env.DRY_RUN ? process.env.DRY_RUN === 'true' : isProduction;

function log(phase: string, message: string) {
  const prefix = DRY_RUN ? '[DRY RUN] ' : '';
  console.log(`${prefix}[${phase}] ${message}`);
}

// ---------------------------------------------------------------------------
// Space definitions
// ---------------------------------------------------------------------------

interface SpaceDef {
  key: SpaceTarget;
  name: string;
  type: 'personal' | 'business';
}

const SPACE_DEFS: SpaceDef[] = [
  { key: 'innovaciones-madfam', name: 'Innovaciones MADFAM', type: 'business' },
  { key: 'socio-afac', name: 'MADFAM Socio AFAC', type: 'business' },
  { key: 'aldo-personal', name: 'Aldo Personal', type: 'personal' },
];

const ACCOUNTING_TAGS = [
  'Préstamo de Socio (AFAC)',
  'Aportación de Capital',
  'Gasto Deducible (Negocio)',
  'Gasto No Deducible',
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const csvPath = process.env.CSV_PATH;
  if (!csvPath) {
    console.error('ERROR: CSV_PATH is required');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const targetEmail = process.env.TARGET_USER_EMAIL || 'admin@madfam.io';

  console.log('========================================');
  console.log('  MADFAM CSV → Dhanam Import');
  console.log(`  Target user: ${targetEmail}`);
  console.log(`  CSV path: ${csvPath}`);
  console.log(`  Dry run: ${DRY_RUN}`);
  console.log('========================================\n');

  // -----------------------------------------------------------------------
  // Phase 1: INIT — Parse CSV and look up user
  // -----------------------------------------------------------------------
  log('INIT', `Reading CSV from ${csvPath}...`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCsv(csvContent);
  log('INIT', `Parsed ${rows.length} rows`);

  if (rows.length === 0) {
    console.error('ERROR: CSV contains no data rows');
    process.exit(1);
  }

  log('INIT', `Looking up user ${targetEmail}...`);
  const user = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!user) {
    console.error(`ERROR: User ${targetEmail} not found in Dhanam`);
    process.exit(1);
  }
  log('INIT', `Found user ${user.id}`);

  // -----------------------------------------------------------------------
  // Phase 2: SPACES — Upsert 3 spaces
  // -----------------------------------------------------------------------
  const spaceIds: Record<SpaceTarget, string> = {} as any;

  for (const spaceDef of SPACE_DEFS) {
    log('SPACES', `Processing space "${spaceDef.name}" (${spaceDef.type})...`);

    if (!DRY_RUN) {
      // Check if space already exists for this user
      const existingUserSpace = await prisma.userSpace.findFirst({
        where: { userId: user.id },
        include: { space: true },
      });

      // Look for a space matching by name among user's spaces
      const allUserSpaces = await prisma.userSpace.findMany({
        where: { userId: user.id },
        include: { space: true },
      });

      const existingSpace = allUserSpaces.find((us) => us.space.name === spaceDef.name);

      if (existingSpace) {
        spaceIds[spaceDef.key] = existingSpace.spaceId;
        log('SPACES', `  Exists: "${spaceDef.name}" → ${existingSpace.spaceId}`);
      } else {
        const space = await prisma.space.create({
          data: {
            name: spaceDef.name,
            type: spaceDef.type,
            currency: 'MXN',
          },
        });

        await prisma.userSpace.create({
          data: {
            userId: user.id,
            spaceId: space.id,
            role: 'owner',
          },
        });

        spaceIds[spaceDef.key] = space.id;
        log('SPACES', `  Created: "${spaceDef.name}" → ${space.id}`);
      }
    } else {
      spaceIds[spaceDef.key] = `dry-run-${spaceDef.key}`;
      log('SPACES', `  Would create: "${spaceDef.name}"`);
    }
  }

  // -----------------------------------------------------------------------
  // Phase 3: BUDGETS — One per space
  // -----------------------------------------------------------------------
  const budgetIds: Record<SpaceTarget, string> = {} as any;

  for (const spaceDef of SPACE_DEFS) {
    const spaceId = spaceIds[spaceDef.key];
    const budgetName = `${spaceDef.name} — Presupuesto`;
    log('BUDGETS', `Processing budget for "${spaceDef.name}"...`);

    if (!DRY_RUN) {
      // Check by origin metadata first
      let budget = await prisma.budget.findFirst({
        where: {
          spaceId,
          metadata: { path: ['origin'], equals: 'madfam-csv-import' },
        },
      });

      // Fallback: check by name
      if (!budget) {
        budget = await prisma.budget.findFirst({
          where: { spaceId, name: budgetName },
        });
      }

      if (budget) {
        budgetIds[spaceDef.key] = budget.id;
        log('BUDGETS', `  Exists: "${budgetName}" → ${budget.id}`);
      } else {
        budget = await prisma.budget.create({
          data: {
            space: { connect: { id: spaceId } },
            name: budgetName,
            period: 'monthly',
            startDate: new Date('2024-12-01'),
            metadata: {
              origin: 'madfam-csv-import',
              importedAt: new Date().toISOString(),
            },
          },
        });
        budgetIds[spaceDef.key] = budget.id;
        log('BUDGETS', `  Created: "${budgetName}" → ${budget.id}`);
      }
    } else {
      budgetIds[spaceDef.key] = `dry-run-budget-${spaceDef.key}`;
      log('BUDGETS', `  Would create: "${budgetName}"`);
    }
  }

  // -----------------------------------------------------------------------
  // Phase 4: CATEGORIES — Extract unique (groupName, subcategory) from CSV
  // -----------------------------------------------------------------------
  log('CATEGORIES', 'Extracting unique categories from CSV...');

  const categorySet = new Set<string>();
  const categoryPairs: Array<{ groupName: string; categoryName: string; isIncome: boolean }> = [];

  for (const row of rows) {
    const { groupName, categoryName } = parseGroupAndCategory(
      row.Categoria_Estrategica,
      row.Subcategoria
    );
    const key = `${groupName}::${categoryName}`;
    if (!categorySet.has(key)) {
      categorySet.add(key);
      categoryPairs.push({ groupName, categoryName, isIncome: isIncomeGroup(groupName) });
    }
  }

  log('CATEGORIES', `Found ${categoryPairs.length} unique categories`);

  // Category lookup: spaceKey::groupName::categoryName → categoryId
  const categoryMap = new Map<string, string>();

  for (const spaceDef of SPACE_DEFS) {
    const budgetId = budgetIds[spaceDef.key];

    for (let i = 0; i < categoryPairs.length; i++) {
      const { groupName, categoryName, isIncome } = categoryPairs[i];
      const lookupKey = `${spaceDef.key}::${groupName}::${categoryName}`;

      if (!DRY_RUN) {
        const existing = await prisma.category.findFirst({
          where: { budgetId, name: categoryName, groupName },
        });

        if (existing) {
          categoryMap.set(lookupKey, existing.id);
          log('CATEGORIES', `  Exists [${spaceDef.key}]: ${groupName} / ${categoryName}`);
        } else {
          const created = await prisma.category.create({
            data: {
              budget: { connect: { id: budgetId } },
              name: categoryName,
              groupName,
              isIncome,
              budgetedAmount: 0,
              sortOrder: i,
            },
          });
          categoryMap.set(lookupKey, created.id);
          log(
            'CATEGORIES',
            `  Created [${spaceDef.key}]: ${groupName} / ${categoryName} (income=${isIncome}) → ${created.id}`
          );
        }
      } else {
        log('CATEGORIES', `  Would create [${spaceDef.key}]: ${groupName} / ${categoryName}`);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Phase 5: TAGS — 4 accounting classification tags per space
  // -----------------------------------------------------------------------
  log('TAGS', 'Creating accounting classification tags...');

  // Tag lookup: spaceKey::tagName → tagId
  const tagMap = new Map<string, string>();

  for (const spaceDef of SPACE_DEFS) {
    const spaceId = spaceIds[spaceDef.key];

    for (const tagName of ACCOUNTING_TAGS) {
      const lookupKey = `${spaceDef.key}::${tagName}`;

      if (!DRY_RUN) {
        const existing = await prisma.tag.findUnique({
          where: { spaceId_name: { spaceId, name: tagName } },
        });

        if (existing) {
          tagMap.set(lookupKey, existing.id);
          log('TAGS', `  Exists [${spaceDef.key}]: ${tagName}`);
        } else {
          const created = await prisma.tag.create({
            data: {
              space: { connect: { id: spaceId } },
              name: tagName,
            },
          });
          tagMap.set(lookupKey, created.id);
          log('TAGS', `  Created [${spaceDef.key}]: ${tagName} → ${created.id}`);
        }
      } else {
        log('TAGS', `  Would create [${spaceDef.key}]: ${tagName}`);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Phase 6 & 7: ACCOUNTS + TRANSACTIONS — Process rows
  // -----------------------------------------------------------------------
  log('TRANSACTIONS', `Processing ${rows.length} transactions...`);

  // Account lookup: providerAccountId → accountId
  const accountMap = new Map<string, string>();

  let txCreated = 0;
  let txSkipped = 0;
  let txWarnings = 0;
  let accountsCreated = 0;
  let accountsExisting = 0;

  for (const row of rows) {
    const txNum = row.No_Transaccion;

    // Compute signed amount
    const amount = mapAmount(row.Ingreso, row.Egreso);
    if (amount === null) {
      log('TRANSACTIONS', `  WARN: Skipping tx ${txNum} — both Ingreso and Egreso are 0/empty`);
      txWarnings++;
      continue;
    }

    // Route to space
    const spaceTarget = routeToSpace(row.RFC, row.Clasificacion_Contable);
    const spaceId = spaceIds[spaceTarget];

    // Map account (lazy creation)
    let accountMapping;
    try {
      accountMapping = mapAccount(row.Cuenta_Origen, spaceTarget);
    } catch (err: any) {
      log('TRANSACTIONS', `  WARN: Skipping tx ${txNum} — ${err.message}`);
      txWarnings++;
      continue;
    }

    const providerTransactionId = `madfam-csv-${txNum}`;

    // Lazy account creation
    if (!accountMap.has(accountMapping.providerAccountId)) {
      if (!DRY_RUN) {
        const existingAccount = await prisma.account.findFirst({
          where: { spaceId, providerAccountId: accountMapping.providerAccountId },
        });

        if (existingAccount) {
          accountMap.set(accountMapping.providerAccountId, existingAccount.id);
          accountsExisting++;
          log(
            'ACCOUNTS',
            `  Exists: ${accountMapping.name} [${spaceTarget}] → ${existingAccount.id}`
          );
        } else {
          const created = await prisma.account.create({
            data: {
              space: { connect: { id: spaceId } },
              provider: 'manual',
              providerAccountId: accountMapping.providerAccountId,
              name: accountMapping.name,
              type: accountMapping.type,
              currency: 'MXN',
              balance: 0,
              metadata: { source: 'madfam-csv' },
            },
          });
          accountMap.set(accountMapping.providerAccountId, created.id);
          accountsCreated++;
          log('ACCOUNTS', `  Created: ${accountMapping.name} [${spaceTarget}] → ${created.id}`);
        }
      } else {
        accountMap.set(
          accountMapping.providerAccountId,
          `dry-run-${accountMapping.providerAccountId}`
        );
        log('ACCOUNTS', `  Would create: ${accountMapping.name} [${spaceTarget}]`);
      }
    }

    const accountId = accountMap.get(accountMapping.providerAccountId)!;

    // Resolve category
    const { groupName, categoryName } = parseGroupAndCategory(
      row.Categoria_Estrategica,
      row.Subcategoria
    );
    const categoryLookup = `${spaceTarget}::${groupName}::${categoryName}`;
    const categoryId = categoryMap.get(categoryLookup);

    // Resolve tag
    const tagLookup = `${spaceTarget}::${row.Clasificacion_Contable.trim()}`;
    const tagId = tagMap.get(tagLookup);

    // Parse date
    let txDate: Date;
    try {
      txDate = mapDate(row.Fecha_Operacion);
    } catch (err: any) {
      log('TRANSACTIONS', `  WARN: Skipping tx ${txNum} — ${err.message}`);
      txWarnings++;
      continue;
    }

    if (!DRY_RUN) {
      // Idempotency check
      const existing = await prisma.transaction.findFirst({
        where: { accountId, providerTransactionId },
      });

      if (existing) {
        txSkipped++;
        continue;
      }

      const created = await prisma.transaction.create({
        data: {
          account: { connect: { id: accountId } },
          providerTransactionId,
          amount,
          currency: 'MXN',
          description: row.Nota_Items || row.Concepto_Original || 'Unknown',
          merchant: row.Concepto_Original || null,
          ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
          date: txDate,
          pending: false,
          reviewed: true,
          reviewedAt: new Date(),
          metadata: {
            source: 'madfam-csv',
            originalCurrency: row.Moneda_Origen || 'MXN',
            mesCorte: row.Mes_Corte || null,
            rfc: row.RFC,
            clasificacionContable: row.Clasificacion_Contable,
          },
        },
      });

      // Create tag association
      if (tagId) {
        await prisma.transactionTag
          .create({
            data: {
              transaction: { connect: { id: created.id } },
              tag: { connect: { id: tagId } },
            },
          })
          .catch(() => {}); // Skip duplicates
      }

      txCreated++;
    } else {
      log(
        'TRANSACTIONS',
        `  Would create: [${spaceTarget}] ${row.Nota_Items} | ${amount} MXN | ${row.Fecha_Operacion} | ${groupName}/${categoryName}`
      );
      txCreated++;
    }
  }

  // -----------------------------------------------------------------------
  // Phase 8: SUMMARY
  // -----------------------------------------------------------------------
  console.log('\n========================================');
  console.log('  Import Summary');
  console.log('========================================');
  console.log(`  CSV rows:          ${rows.length}`);
  console.log(`  Spaces:            ${SPACE_DEFS.length}`);
  console.log(`  Budgets:           ${SPACE_DEFS.length}`);
  console.log(
    `  Category types:    ${categoryPairs.length} (x${SPACE_DEFS.length} spaces = ${categoryPairs.length * SPACE_DEFS.length})`
  );
  console.log(
    `  Tag types:         ${ACCOUNTING_TAGS.length} (x${SPACE_DEFS.length} spaces = ${ACCOUNTING_TAGS.length * SPACE_DEFS.length})`
  );
  console.log(`  Accounts created:  ${accountsCreated} (existing: ${accountsExisting})`);
  console.log(
    `  Transactions:      ${txCreated} created, ${txSkipped} skipped, ${txWarnings} warnings`
  );

  if (!DRY_RUN) {
    // Print DB counts per space
    console.log('\n  Database entity counts per space:');
    for (const spaceDef of SPACE_DEFS) {
      const spaceId = spaceIds[spaceDef.key];
      const [accounts, transactions, categories, tags] = await Promise.all([
        prisma.account.count({ where: { spaceId } }),
        prisma.transaction.count({ where: { account: { spaceId } } }),
        prisma.category.count({ where: { budget: { spaceId } } }),
        prisma.tag.count({ where: { spaceId } }),
      ]);
      console.log(`    ${spaceDef.name}:`);
      console.log(
        `      Accounts: ${accounts}, Transactions: ${transactions}, Categories: ${categories}, Tags: ${tags}`
      );
    }
  }

  console.log('\n  Import complete!');
  console.log('========================================\n');
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
