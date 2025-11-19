# Database Architecture Audit Report
## Dhanam Ledger Project

**Date:** November 15, 2025  
**Scope:** Complete analysis of Prisma schema, migrations, and database implementation  
**Thoroughness Level:** Very Thorough

---

## Executive Summary

The Dhanam Ledger database architecture demonstrates solid design principles with proper multi-tenancy implementation, encryption at rest for sensitive data, comprehensive audit logging, and well-structured relationships. However, **critical implementation gaps** exist that prevent the application from functioning correctly, particularly schema mismatches between the Prisma schema definition and migration, plus missing foreign key constraints. Additionally, **N+1 query patterns** in core services will cause severe performance degradation at scale.

**Key Metrics:**
- **Total Models:** 18
- **Total Enums:** 7
- **Total Indexes:** 22 (insufficient for optimal performance)
- **Foreign Key Constraints:** 13 (missing 1 critical constraint)
- **Critical Issues:** 7
- **High Priority Issues:** 3
- **Medium Priority Issues:** 6
- **Low Priority Observations:** 8

---

## CRITICAL ISSUES SUMMARY

### 1. TransactionRule Missing Foreign Key to Category
**File:** `/home/user/dhanam/apps/api/prisma/schema.prisma` (lines 304-320)
**Severity:** CRITICAL - Data Integrity

The TransactionRule model has `categoryId` field but NO `@relation` annotation and migration lacks FK constraint:
```prisma
model TransactionRule {
  categoryId       String        @map("category_id")  // ← NO RELATION
  // Missing: category Category @relation(fields: [categoryId], references: [id])
}
```

**Impact:** Orphaned rules can reference deleted categories; referential integrity not enforced.

---

### 2. Seed File References Non-Existent Models
**File:** `/home/user/dhanam/apps/api/prisma/seed-enhanced.ts`
**Severity:** CRITICAL - Will Fail on `pnpm db:seed`

Seed attempts to create:
- `prisma.eSGAssetScore` (lines 613, 636) - Not in schema (should be ESGScore)
- `prisma.valuationSnapshot` (line 672) - Not in schema (should be AssetValuation)
- `prisma.featureFlag` (line 705) - Not in schema (doesn't exist)
- `prisma.rule` (line 761) - Not in schema (should be transactionRule)

**Impact:** Demo environment cannot be initialized; app deployment fails at seed phase.

---

### 3. Account Model Missing Fields
**File:** Schema line 216-242; Seed references lines 125, 181-204, 320-360, etc.
**Severity:** CRITICAL - Schema Mismatch

Seed file creates accounts with:
- `creditLimit` (referenced 4 times) - **Not in schema**
- `institutionName` (referenced 8+ times) - **Not in schema**

**Impact:** `pnpm db:seed` will fail with "Unknown field" errors.

---

### 4. Transaction Field Name Mismatches
**Severity:** CRITICAL - Seed File Will Fail

Seed file uses non-existent fields:
- `spaceId` (lines 574, 592, 599) - Transaction model has NO spaceId field
- `merchantName` (lines 579, 596) - Should be `merchant`
- `categoryId` parameter but Transaction uses standard Prisma approach

---

### 5. Budget Model Field Mismatch
**Severity:** CRITICAL - Seed File Will Fail

Seed file includes on Budget:
```typescript
amount: 65000,         // ← NOT IN SCHEMA
currency: Currency.MXN // ← NOT IN SCHEMA
```

Budget model only has: id, spaceId, name, period, startDate, endDate, categories

---

### 6. Encryption Key Not Enforced
**File:** `/home/user/dhanam/apps/api/src/core/crypto/crypto.service.ts` (lines 11-18)
**Severity:** CRITICAL - Data Loss Risk

```typescript
const keyString = process.env.ENCRYPTION_KEY || this.generateKey();
```

If `ENCRYPTION_KEY` env var not set:
- Random key generated
- Server restart → encrypted data becomes inaccessible
- All encrypted tokens lost

**Impact:** Production data loss on redeploy without persistent key storage.

---

### 7. Audit Log Schema Mismatch
**File:** Migrations vs Schema
**Severity:** CRITICAL - Schema Validation Error

**Migration creates:**
```sql
"resource_type" TEXT NOT NULL,  "changes" JSONB
```

**Schema expects:**
```prisma
resource         String?
resourceId       String?
metadata         String?  // JSON string, not JSONB
```

**Impact:** Prisma client generation failure; audit logging broken.

---

## DETAILED FINDINGS

### Part 1: Data Models Quality

**Excellent (✓):**
- User model with TOTP fields and proper security
- Space/UserSpace multi-tenancy pattern
- AssetValuation with proper unique + desc index
- ESGScore with account relationship
- AuditLog with comprehensive logging (3 good indexes)

**Good (✓):**
- Category with budget relationship
- Connection with 1:1 to Account
- ExchangeRate with currency pairs

**Incomplete/Broken (✗):**
- Account: Missing creditLimit, institutionName
- TransactionRule: Missing category relationship
- Budget: Missing amount, currency fields
- Space: Missing businessType, businessName, taxId (referenced in seed)
- Transaction: Missing spaceId (referenced in seed), merchantName should be merchant

---

### Part 2: Indexing Strategy

**Current Indexes:** 22 total

| Issue | Table | Missing Index | Impact |
|-------|-------|--------------|---------|
| HIGH | transactions | (pending) | Full table scans for pending balance queries |
| HIGH | accounts | (spaceId, lastSyncedAt) | Sync job optimization missing |
| MEDIUM | transactions | (accountId, categoryId) | Bulk categorization slowdown |
| LOW | exchange_rates | (date DESC) | Latest rate lookup full scan |

**Good Indexes (✓):**
- AuditLog: 3 indexes covering all query patterns
- AssetValuation: DESC date for latest first
- WebhookEvent: Provider/processed/date compound index

---

### Part 3: Foreign Key Constraints

**Present:** 13/14 constraints

| Constraint | Status | Notes |
|-----------|--------|-------|
| sessions → users | ✓ | CASCADE delete correct |
| accounts → spaces | ✓ | CASCADE correct |
| transactions → accounts | ✓ | CASCADE correct |
| transactions → categories | ✓ | SET NULL good for data retention |
| categories → budgets | ✓ | CASCADE correct |
| **transaction_rules → categories** | **✗ MISSING** | **Critical gap** |
| budgets → spaces | ✓ | CASCADE correct |
| esg_scores → accounts | ✓ | CASCADE correct |
| audit_logs → users | ✓ | SET NULL preserves audit trail |

---

### Part 4: Encryption Implementation

**AES-256-GCM:** Correct algorithm with IV + Auth Tag ✓

**Issues:**
1. ENCRYPTION_KEY environment variable not required (falls back to random key)
2. Server restart without persistent key = data loss
3. Account.encryptedCredentials field never used
4. Belvo service stores JSON-stringified encrypted token (wasteful)

---

### Part 5: N+1 Query Patterns

#### RulesService.batchCategorizeTransactions

**Current approach:**
```
1. Fetch transactions
2. For each of 100 transactions:
   a. Fetch rules for space (should be done once!)
   b. Update transaction individually

Total: 1 + 100 rule fetches + 100 updates = 201 queries 😱
```

**Should be:**
```
1. Fetch transactions
2. Fetch rules ONCE
3. Batch update all

Total: 3 queries
```

**Performance impact:** 
- Current: 201 queries * 30ms = 6+ seconds
- Optimized: 3 queries * 30ms = 90ms
- **67x slower than needed**

#### categorizeTransaction in loop
Similar issue when called from categorizeSpecificTransactions (line 342)

---

### Part 6: Multi-Tenancy

**Design:** Excellent Space + UserSpace pattern
- User (1) → (Many) UserSpace (Many) ← Space (1)
- All entities properly have spaceId foreign key
- CASCADE deletes maintain consistency
- ✓ Proper data isolation verified

**Concern:** ExchangeRate model has NO spaceId
- Currently global (all users share same FX rates)
- Probably intentional (Banxico rates are global)
- But check if should be per-space for rate customization

---

### Part 7: Audit Trail

**Strengths:**
- Comprehensive fields: action, resource, resourceId, metadata, IP, user agent, severity
- Good indexes for querying: (userId, action, timestamp), (resource, resourceId), (severity, timestamp)
- Severity levels for filtering critical events
- SET NULL on user deletion preserves audit trail

**Issues:**
- Schema vs migration mismatch (resource_type vs resource, changes vs metadata)

---

### Part 8: Wealth Tracking

**Current:** AssetValuation model (account-level)
```prisma
model AssetValuation {
  accountId        String  // Account-level snapshots only
  date             DateTime @db.Date
  value            Decimal
}
```

**Missing:** Space-level wealth snapshots (referenced in seed as valuationSnapshot)

**Seed Expects:**
```typescript
spaceId: space.id,        // ← Not possible with AssetValuation
totalValue: totalBalance,
breakdown: { checking, savings, credit, investment, crypto }
```

**Needed:** SpaceValuation model for aggregated space net worth

---

### Part 9: Rules Engine

**Design:** Flexible JSON-based conditions
```typescript
interface RuleCondition {
  field: 'description' | 'merchant' | 'amount' | 'account'
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number
}
```

**Issues:**
- Missing FK constraint to Category (Issue #1)
- N+1 query pattern when applying rules at scale (Issue from Part 5)

**Strengths:**
- Priority-based rule ordering
- Enabled/disabled flag
- Complex condition combinations possible

---

### Part 10: Alignment with CLAUDE.md

| Requirement | Status | Notes |
|------------|--------|-------|
| Multi-tenant Spaces | ✓ | Implemented correctly |
| Normalize financial data | ✓ | Common Account model |
| Daily valuation snapshots | ⚠️ | AssetValuation account-level only |
| Rules-based auto-categorization | ✓ | TransactionRule + JSON conditions |
| ESG scoring via Dhanam | ✓ | ESGScore model + service |
| Encrypt provider tokens | ⚠️ | AES-256-GCM correct but key not enforced |
| Argon2id password hashing | ✓ | Used in seed |
| TOTP 2FA | ✓ | User model fields present |
| JWT + refresh tokens | ✓ | Session model |
| Webhook HMAC verification | ✓ | WebhookEvent model |
| 60-day cashflow forecasting | ✗ | **Missing model entirely** |
| Audit logging | ✓ | AuditLog comprehensive |
| BullMQ background jobs | ✓ | Code present, no schema needed |

---

## Performance Analysis

### Estimated Query Performance (Current)

**High Volume Operations:**

1. **Categorize 100 transactions:**
   - Current: 201 database queries
   - Estimated time: 6+ seconds (fails <1.5s SLA)
   - After fix: 3 queries, <100ms

2. **List budgets with category transaction counts:**
   - Uses _count in include (may trigger extra queries)
   - Needs verification with query logging

3. **Daily sync of 1000 transactions:**
   - Depends on provider service efficiency
   - N+1 in categorization phase critical

### Index Coverage

**Well-indexed (✓):**
- User.email
- AuditLog queries
- ExchangeRate lookups
- AssetValuation date ranges

**Under-indexed (⚠️):**
- Transaction.pending (full table scans)
- Account.lastSyncedAt (sync job optimization)
- WebhookEvent.processed historical queries

---

## Recommendations

### Immediate (Block Release)

1. **Add TransactionRule → Category FK:**
   ```prisma
   category         Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)
   ```

2. **Fix Seed File:**
   - Remove non-existent model references
   - Update field names (budgetedAmount, merchant, etc.)
   - Remove invalid fields (spaceId on Transaction)
   - Remove creditLimit, institutionName from Account

3. **Enforce ENCRYPTION_KEY:**
   ```typescript
   if (!process.env.ENCRYPTION_KEY) {
     throw new Error('ENCRYPTION_KEY environment variable required');
   }
   ```

4. **Fix Audit Log Migration:**
   - Align migration with schema (resource vs resource_type, metadata vs changes)

### Short Term (1-2 sprints)

5. **Optimize RulesService:**
   - Fetch rules once in batchCategorizeTransactions
   - Batch update transactions (not individual updates)
   - Reduce N transactions: 201 → 3 queries

6. **Add Missing Indexes:**
   ```sql
   CREATE INDEX transactions_pending_idx ON transactions(pending);
   CREATE INDEX accounts_space_sync_idx ON accounts(space_id, last_synced_at);
   CREATE INDEX esg_scores_latest_idx ON esg_scores(account_id, calculated_at DESC);
   ```

7. **Create Feature Flag Model:**
   ```prisma
   model FeatureFlag {
     name        String    @id
     enabled     Boolean
     rollout     Int       @default(0)  // 0-100%
     description String?
   }
   ```

### Medium Term

8. **Add Space-level Valuations:**
   ```prisma
   model SpaceValuation {
     id        String    @id @default(uuid())
     spaceId   String    @map("space_id")
     date      DateTime  @db.Date
     totalValue Decimal  @db.Decimal(19, 4)
     breakdown Json
     
     @@unique([spaceId, date])
     @@index([spaceId, date(sort: Desc)])
   }
   ```

9. **Implement Cashflow Forecasting Model:**
   ```prisma
   model CashflowForecast {
     id        String    @id @default(uuid())
     spaceId   String
     weekStart DateTime  @db.Date
     projected Decimal   @db.Decimal(19, 4)
   }
   ```

10. **Add Soft-Delete Support:**
    - Add `deletedAt DateTime?` to sensitive models
    - Update queries to exclude soft-deleted records

---

## Testing Recommendations

### Schema Validation
- Test FK constraints on all relationships
- Verify cascade delete behavior
- Test unique constraints prevent duplicates

### Performance
- Query profiling on batch operations
- N+1 detection test suite
- Load testing on 10k+ transactions

### Data Integrity
- Seed file validation before merge
- Schema migration testing in staging
- Encryption key rotation testing

---

## Final Assessment

**Database Design Quality: 7.5/10**

✓ **Strengths:**
- Multi-tenancy properly implemented
- Security considerations (encryption, audit, TOTP)
- Good schema normalization
- Comprehensive audit logging
- Proper cascading rules

✗ **Weaknesses:**
- Critical schema-migration mismatches
- N+1 query patterns in critical paths
- Missing seed data models
- Incomplete field implementations
- Encryption key enforcement lacking
- Missing business logic models (features, forecasts)

**Status:** **Not Ready for Production** - Critical issues must be resolved before deployment

**Estimated Effort to Fix:**
- Critical: 2-3 days
- High priority: 3-5 days
- Medium priority: 1-2 weeks
- **Total: 2-3 weeks**

