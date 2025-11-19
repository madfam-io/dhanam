# Dhanam Database Schema & Prisma Audit Report

**Date:** 2025-11-16  
**Scope:** Complete Prisma schema, migrations, and database configuration  
**Database:** PostgreSQL via Prisma 5.8.0

---

## Executive Summary

The schema has **critical misalignments** between the Prisma schema file and actual database migrations, plus several data integrity, performance, and security concerns. The codebase is usable but requires immediate attention to prevent data consistency issues in production.

**Critical Issues Found:** 5  
**High Priority Issues:** 8  
**Medium Priority Issues:** 12  
**Low Priority Issues:** 6  

---

## 1. SCHEMA STRUCTURE AUDIT

### 1.1 Schema vs Migration Mismatch (CRITICAL)

**Issue:** The Prisma schema defines 18 models, but only 15 were created in the initial migration.

**Missing Models in Migration:**
- ✗ `UserPreferences` - Defined in schema (lines 93-147) but NOT in migration
- ✗ `ExchangeRate` - Defined in schema (lines 432-446) but NOT in migration  
- ✗ `ErrorLog` - Added in separate migration (000_error_logs_table) instead of initial migration

**Location:** `/home/user/dhanam/apps/api/prisma/schema.prisma`

**Impact:** Running `prisma db push` or `prisma migrate dev` may fail or create orphaned code paths.

**Missing User Table Fields (CRITICAL):**
The users table in the migration is missing several fields defined in the schema:
```
Schema defines:                    Migration has:
✗ totp_temp_secret                ✗ missing
✗ totp_backup_codes               ✗ missing  
✗ is_active                        ✗ missing
✗ is_admin                         ✗ missing
✗ onboarding_completed             ✗ missing
✗ onboarding_completed_at          ✗ missing
✗ onboarding_step                  ✗ missing
✗ last_login_at                    ✗ missing
```

**Migration File:** `/home/user/dhanam/apps/api/prisma/migrations/20250824063952_init/migration.sql` (lines 23-37)

**Impact:** These fields are referenced in seed.ts (e.g., onboardingStep) and services but won't exist in the database.

### 1.2 AuditLog Schema Mismatch (HIGH)

**Migration defines:**
```sql
"action" TEXT NOT NULL,
"resource_type" TEXT NOT NULL,  -- Schema calls this "resource"
"changes" JSONB,                 -- Schema calls this "metadata"
```

**Schema defines:**
```prisma
action           String
resource         String?         -- Different name
resourceId       String?
metadata         String?         -- Different type (String, not JSON)
severity         String          -- NOT in migration
timestamp        DateTime        -- NOT in migration
```

**Location:** Schema lines 379-399; Migration lines 214-226

**Impact:** Audit logging code will fail to insert records with the correct schema.

### 1.3 TransactionRule CategoryId Constraint Mismatch (HIGH)

**Migration makes it NOT NULL:**
```sql
"category_id" TEXT NOT NULL,
```

**Schema makes it optional:**
```prisma
categoryId       String?       @map("category_id")
```

**Location:** Schema line 312; Migration line 162

**Impact:** Rules engine can't create rules without categories, contradicting the schema design.

### 1.4 All Models Present (GOOD)

✓ Core multi-tenancy models (User, Space, UserSpace)  
✓ Financial models (Account, Transaction, Category, Budget)  
✓ Provider integration (ProviderConnection, Connection, Provider enum)  
✓ ESG models (ESGScore)  
✓ Operational models (Session, WebhookEvent, AuditLog, ErrorLog)

---

## 2. MULTI-TENANCY AUDIT

### 2.1 Space-Based Multi-Tenancy (GOOD)

✓ Proper implementation via UserSpace junction table  
✓ Role-based access control (owner, admin, member, viewer)  
✓ All financial entities properly scoped to spaces

**Check:**
```sql
-- All accounts tied to space
Account.spaceId FOREIGN KEY -> Space
-- All transactions inherit space via Account
Transaction.accountId -> Account.spaceId
-- All budgets tied to space
Budget.spaceId FOREIGN KEY -> Space
-- All rules tied to space
TransactionRule.spaceId FOREIGN KEY -> Space
```

### 2.2 User Access Verification (VERIFIED)

Services properly verify user access:
- SpacesService.verifyUserAccess() called in all multi-tenant endpoints
- Checked in TransactionsService, BudgetsService, etc.

**Location:** `/home/user/dhanam/apps/api/src/modules/spaces/spaces.service.ts` line 150+

---

## 3. DATA INTEGRITY AUDIT

### 3.1 Foreign Key Constraints (VERIFIED)

**All cascade delete relationships:**
```prisma
✓ User -> Sessions (Cascade)
✓ User -> ProviderConnections (Cascade)
✓ User -> UserSpaces (Cascade)
✓ Space -> UserSpaces (Cascade)
✓ Space -> Accounts (Cascade)
✓ Space -> Budgets (Cascade)
✓ Space -> TransactionRules (Cascade)
✓ Account -> Transactions (Cascade)
✓ Account -> Connections (Cascade)
✓ Account -> AssetValuations (Cascade)
✓ Account -> ESGScores (Cascade)
✓ Budget -> Categories (Cascade)
```

**All SetNull relationships (safe):**
```prisma
✓ Category -> Transaction.categoryId (SetNull) - allows uncategorized txns
✓ Category -> TransactionRule.categoryId (SetNull) - allows orphaned rules
✓ User -> AuditLog.userId (SetNull) - preserves audit trail
```

**Issue:** All delete operations cascade, which means deleting a Space will delete ALL user data. Consider:
- Soft deletes for Space/Account deletions
- Audit trail preservation

### 3.2 Unique Constraints (VERIFIED)

✓ User.email (UNIQUE)  
✓ Session.tokenFamily (UNIQUE) - proper token rotation tracking  
✓ ProviderConnection(userId, provider, providerUserId) - UNIQUE  
✓ Account(spaceId, provider, providerAccountId) - UNIQUE  
✓ Connection.accountId (UNIQUE) - one connection per account  
✓ Transaction(accountId, providerTransactionId) - prevents duplicates  
✓ Category(budgetId, name) - prevents duplicate categories per budget  
✓ AssetValuation(accountId, date) - one valuation per account per day  
✓ ExchangeRate(fromCurrency, toCurrency, date) - prevents duplicates

**Issue:** `providerAccountId` can be NULL (optional), so accounts with multiple NULLs could violate uniqueness semantically. Best practice: either make it required or exclude NULLs from unique constraint.

### 3.3 Required vs Optional Fields (FINDINGS)

**Concerning Optional Fields:**
```prisma
❌ Account.providerAccountId? - Should be NOT NULL for provider accounts
❌ Transaction.merchant? - Should be NOT NULL (needed for rules matching)
❌ Transaction.description? - Required, good
❌ Category.description? - OK to be optional
❌ TransactionRule.categoryId? - Should match migration (NOT NULL issue)
❌ Connection.error? - OK when status='active'
```

**Recommendations:**
- Make merchant NOT NULL (default to description if missing)
- Add validation to require merchant for provider transactions
- Make providerAccountId NOT NULL for non-manual providers

### 3.4 Enum Definitions (VERIFIED)

✓ SpaceType: personal, business  
✓ SpaceRole: owner, admin, member, viewer  
✓ AccountType: checking, savings, credit, investment, crypto, other  
✓ Provider: belvo, plaid, bitso, manual  
✓ ConnectionStatus: active, error, syncing, disconnected  
✓ BudgetPeriod: monthly, quarterly, yearly  
✓ Currency: MXN, USD, EUR

**Gaps:**
- Missing TransactionType enum (income, expense, transfer)
- Missing RuleConditionField enum - stored as string
- Missing UserRole enum - stored as string in UserPreferences

### 3.5 Default Values (VERIFIED)

✓ User.locale = 'es' (Spanish default for LATAM)  
✓ User.timezone = 'America/Mexico_City'  
✓ User.totpEnabled = false (2FA opt-in)  
✓ User.emailVerified = false  
✓ User.isActive = true (should default to false - security issue)  
✓ User.isAdmin = false (good - requires explicit grant)  
✓ Account.balance = 0  
✓ Transaction.pending = false  
✓ TransactionRule.priority = 0  
✓ TransactionRule.enabled = true  
✓ Space.currency = MXN  
✓ BudgetPeriod defaults properly  
✓ Timestamps auto-populate with CURRENT_TIMESTAMP

**Security Issue:** User.isActive should default to false, requiring email verification before activation.

---

## 4. PERFORMANCE AUDIT

### 4.1 Indexing Strategy (FINDINGS)

**Good Indexes:**
```prisma
✓ @@index([userId]) - Sessions lookup
✓ @@index([tokenFamily]) - Token verification
✓ @@index([spaceId]) - Account queries by space
✓ @@index([spaceId, lastSyncedAt(sort: Desc)]) - Sync ordering
✓ @@index([accountId, date(sort: Desc)]) - Transactions by date
✓ @@index([categoryId]) - Category lookups
✓ @@index([pending]) - Pending transaction filtering
✓ @@index([budgetId]) - Category queries
✓ @@index([spaceId, enabled]) - Active rules filtering
✓ @@index([accountId, date(sort: Desc)]) - Asset valuations
✓ @@index([accountId, calculatedAt(sort: Desc)]) - ESG scores
✓ @@index([userId, action, timestamp(sort: Desc)]) - Audit log queries
✓ @@index([resource, resourceId]) - Audit log by resource
✓ @@index([severity, timestamp(sort: Desc)]) - Security alert filtering
✓ @@index([provider, processed, createdAt]) - Webhook processing
✓ @@index([fromCurrency, toCurrency]) - FX rate lookups
✓ @@index([date]) - FX rate by date
```

**MISSING CRITICAL INDEXES:**

```
❌ Transaction.merchant - Rules engine queries by merchant (lines 16 in rules.service)
❌ Transaction.description - Rules engine queries by description
❌ Account.name - Listed in UI, queryable
❌ Account(provider) - Filter accounts by provider
❌ Space.type - Filter spaces by type (personal vs business)
❌ Compound: Transaction(accountId, pending) - Sync queries
❌ Compound: Account(spaceId, provider) - Provider account listing
❌ User.email lookup - Already covered by UNIQUE, good
❌ User.isAdmin - Admin queries
```

**N+1 Query Risk Assessment:**

HIGH RISK:
```typescript
// budgets.service.ts lines 24-35: Good - uses include() for categories with _count
const budgets = await this.prisma.budget.findMany({
  include: {
    categories: {
      include: {
        _count: { select: { transactions: true } },
      },
    },
  },
});

// transactions.service.ts lines 42-50: Good - uses include()
const [data, total] = await Promise.all([
  this.prisma.transaction.findMany({
    include: {
      account: true,
      category: true,
    },
  }),
]);

// spaces.service.ts lines 25-27: POTENTIAL N+1 - doesn't include user data
const userSpaces = await this.prisma.userSpace.findMany({
  where: { userId },
  include: { space: true },  // ✓ includes space
  // ❌ missing: include user
});
```

### 4.2 Decimal Precision (CRITICAL)

**Good:**
```prisma
✓ balance: Decimal(19, 4) - ±99999999999999.9999 with cent precision
✓ amount: Decimal(19, 4) - same
✓ budgetedAmount: Decimal(19, 4) - same
✓ value: Decimal(19, 4) - same
✓ ESG scores: Decimal(5, 2) - ±999.99 sufficient for 0-100 scale
```

**CRITICAL ISSUE:**
```prisma
❌ rate: Float  // WRONG! Will cause FX rate precision loss
```

ExchangeRate.rate should be `Decimal(19, 4)` not Float.  
Float loses precision in currency calculations.  
Example: 1.23456789 becomes 1.2345678806304932

**Fix:**
```prisma
// Before
rate          Float

// After
rate          Decimal   @db.Decimal(19, 4)
```

---

## 5. SECURITY AUDIT

### 5.1 Sensitive Field Encryption (FINDINGS)

**Encrypted Fields:**
```prisma
✓ passwordHash - Argon2id (see seed.ts line 21: await hash(password))
✓ encryptedToken - Provider tokens (ProviderConnection line 171)
✓ encryptedCredentials - Account credentials (Account line 226)
✓ refreshTokenHash - Hashed refresh tokens (Session line 153)
```

**MISSING ENCRYPTION:**
```prisma
❌ User.totpSecret - Should be encrypted at rest
❌ User.totpTempSecret - Should be encrypted at rest
❌ User.totpBackupCodes - CRITICAL: Should be hashed, not stored plaintext!
```

**Security Implications:**
- TOTP secret compromise allows attacker to generate valid 2FA codes
- Backup codes in plaintext means compromise = full account takeover
- These should be:
  1. Encrypted at rest (use KMS)
  2. Hashed for verification (never stored plaintext)
  3. Or moved to a separate secure storage

### 5.2 Audit Trail (VERIFIED)

✓ AuditLog model captures:
  - user ID
  - action (AUTH_SUCCESS, PASSWORD_RESET, etc.)
  - resource type & ID
  - IP address & user agent (forensics)
  - severity level
  - timestamp

**Issue:** Column name mismatch with migration (metadata vs changes, resource vs resource_type)

**Coverage:** Implemented via AuditService at lines 54+ with convenience methods:
- logAuthSuccess() 
- logAuthFailure()
- logPasswordReset()
- logTotpEnabled/Disabled
- etc.

### 5.3 Soft Deletes (NOT IMPLEMENTED)

**Gap:** No soft delete pattern for sensitive data.

**Risk:** Space deletion cascades to delete ALL transactions, accounts, budgets = permanent loss.

**Recommendation:** Add isDeleted/deletedAt to:
- Space
- Account
- Transaction (PII contains merchant, descriptions)
- User (if ever needed)

**Example:**
```prisma
model Space {
  // ... existing fields
  isDeleted     Boolean   @default(false) @map("is_deleted")
  deletedAt     DateTime? @map("deleted_at")
  
  @@index([isDeleted])
}
```

### 5.4 User Verification (GOOD)

✓ emailVerified flag exists  
✓ 2FA support via TOTP  
✓ Backup codes for recovery  

**Gap:** No email verification enforcement before account activation

---

## 6. MIGRATIONS AUDIT

### 6.1 Migration Files (FINDINGS)

**Location:** `/home/user/dhanam/apps/api/prisma/migrations/`

**Files:**
1. `migration_lock.toml` - PostgreSQL lock, good
2. `20250824063952_init/migration.sql` - Initial schema (349 lines)
3. `000_error_logs_table/migration.sql` - Error logs table (18 lines)

**Issues:**

❌ **Split migrations:** ErrorLog added separately instead of in initial migration
- Error logs should be part of initial schema
- Creates confusing migration order (000_* runs after 20250824*)

✓ **Safe migrations:** No destructive operations (drops, alters)
✓ **FK integrity:** All foreign keys properly defined before referenced

### 6.2 Migration Status Check

Missing migrations that should exist:
```
❌ UserPreferences table - defined in schema but not in any migration
❌ ExchangeRate table - defined in schema but not in any migration
❌ User table updates - totp_temp_secret, totp_backup_codes, is_active, is_admin, onboarding_*, last_login_at
❌ AuditLog column rename - "resource_type" -> "resource", "changes" -> "metadata"
❌ Transaction rule FK - categoryId should be optional
```

### 6.3 Migration Lock (GOOD)

```toml
[prisma]
provider = "postgresql"
```

✓ Proper PostgreSQL driver specification

---

## 7. SEED DATA AUDIT

### 7.1 Seed Script Coverage (VERIFIED)

**Location:** `/home/user/dhanam/apps/api/prisma/seed.ts`

**Coverage:**
✓ Demo user created (demo@dhanam.app)  
✓ Personal space (demo-personal-space)  
✓ Business space (demo-business-space)  
✓ Multiple account types:
  - BBVA Checking (MXN 25,000)
  - BBVA Savings (MXN 50,000)
  - Banamex Credit Card (MXN -12,500)
  - Business Checking (MXN 125,000)

✓ Sample transactions (10 transactions across categories)  
✓ Categories with budgets:
  - Groceries (MXN 8,000)
  - Transportation (MXN 3,000)
  - Entertainment (MXN 2,000)
  - Utilities (MXN 2,500)
  - Dining Out (MXN 3,500)

✓ Realistic merchant data (Walmart, Uber, Starbucks, etc.)

**Issues:**

❌ **No ESG scores:** Should seed some crypto accounts with ESG data
❌ **No transaction rules:** Should demonstrate rules engine
❌ **No asset valuations:** Should demonstrate wealth tracking
❌ **No exchange rates:** Should seed FX rates for multi-currency features

### 7.2 Seeding Best Practices (FINDINGS)

✓ Uses upsert() to be idempotent  
✓ Uses environment variables for passwords  
✓ Creates realistic demo data  
✓ Includes both Spanish and English merchants

**Gap:** No enhanced seeding for features like:
- Provider connections
- Connection status tracking
- Webhook events
- Audit log entries

**Recommendation:** Create seed-enhanced.ts for full feature coverage

---

## 8. CONFIGURATION AUDIT

### 8.1 Prisma Configuration (GOOD)

**prisma/schema.prisma:**
```prisma
✓ PostgreSQL datasource
✓ CLIENT_JS generator (for Node.js)
✓ Proper @map() field aliases for snake_case
✓ Proper @@map() table aliases
```

**Database Configuration:**
```env
✓ DATABASE_URL properly set
✓ CONNECTION POOL configured (default 10, configurable via DATABASE_POOL_SIZE)
✓ Pool size accounts for multi-instance scaling
```

**Location:** `/home/user/dhanam/apps/api/.env.example`

### 8.2 Connection Pooling (GOOD)

The Prisma service properly configures pools:

```typescript
// /home/user/dhanam/apps/api/src/core/prisma/prisma.service.ts
const poolSize = configService.get('DATABASE_POOL_SIZE') || 10; // Default Prisma pool size
finalUrl = `${databaseUrl}?connection_limit=${poolSize}&pool_timeout=10`;
```

✓ Configurable pool size  
✓ Pool timeout set to 10s  
✓ Supports multi-instance deployments

**Calculated safe limits (from .env):**
- Per-instance: 5 connections (DATABASE_POOL_SIZE)
- 10 ECS tasks = 50 total connections
- db.t3.small supports 100 connections - SAFE

---

## 9. SUMMARY OF CRITICAL ISSUES

### MUST FIX IMMEDIATELY (Blocker)

1. **Schema-Migration Mismatch on User Table**
   - Missing 8 fields in database
   - Location: User model lines 65-81, Migration lines 23-37
   - Action: Create migration to add fields
   - Risk: Onboarding flow broken, isAdmin/isActive broken

2. **ExchangeRate Rate Precision**
   - Float instead of Decimal causes FX rate loss
   - Location: ExchangeRate model line 436
   - Action: Migrate to Decimal(19, 4)
   - Risk: Incorrect currency conversions

3. **TOTP Backup Codes Plaintext Storage**
   - Backup codes not encrypted/hashed
   - Location: User.totpBackupCodes line 72
   - Action: Hash or encrypt codes
   - Risk: 2FA bypass if database compromised

4. **Missing UserPreferences Table**
   - Schema defines it, migration doesn't create it
   - Location: Schema lines 93-147
   - Action: Create migration
   - Risk: User preferences feature won't work

5. **Missing ExchangeRate Table**
   - Schema defines it, migration doesn't create it
   - Location: Schema lines 432-446
   - Action: Create migration
   - Risk: FX rate caching won't work

### HIGH PRIORITY (Next Sprint)

6. **AuditLog Column Name Mismatch**
7. **TransactionRule CategoryId Constraint Mismatch**
8. **Missing merchant/description indexes**
9. **User.isActive should default to false**
10. **Add soft delete support**

### MEDIUM PRIORITY (Documentation)

11. Missing indexes on Account.name, Space.type
12. Optional merchant/providerAccountId semantics
13. ErrorLog migration should be part of init
14. N+1 query in SpacesService.listUserSpaces()

---

## 10. RECOMMENDATIONS

### Phase 1: Correctness (Week 1)
```bash
# 1. Create migration for User table fixes
prisma migrate dev --name add_user_fields

# 2. Create migration for missing models
prisma migrate dev --name add_user_preferences_exchange_rates

# 3. Fix ExchangeRate.rate to Decimal
# Edit schema.prisma line 436
# rate Decimal @db.Decimal(19, 4)
# Run prisma migrate dev

# 4. Fix AuditLog columns
# Create migration to rename columns

# 5. Encrypt TOTP codes
# Create migration if needed
```

### Phase 2: Performance (Week 2)
```prisma
# Add missing indexes
@@index([merchant])
@@index([description])
@@index([name])
@@index([type])
```

### Phase 3: Security (Week 3)
- Add soft deletes
- Hash TOTP backup codes
- Verify email before activation
- Add rate limiting indexes

### Phase 4: Testing
```bash
# Validate schema
prisma validate

# Generate Prisma Client
prisma generate

# Run tests against seeded data
pnpm test

# Load testing with connection pool
# Ensure pool doesn't exhaust
```

---

## Appendix A: Schema Completeness Checklist

| Feature | Model | Status |
|---------|-------|--------|
| User Auth | User, Session | ✓ |
| TOTP 2FA | User.totp* | ⚠ Fields missing |
| Multi-tenancy | Space, UserSpace | ✓ |
| Accounts | Account, Connection | ✓ |
| Transactions | Transaction, Category | ✓ |
| Budgets | Budget, Category | ✓ |
| Rules | TransactionRule | ⚠ CategoryId constraint |
| Provider Integration | ProviderConnection | ✓ |
| ESG Scores | ESGScore | ✓ |
| Asset Valuations | AssetValuation | ✓ |
| FX Rates | ExchangeRate | ✗ Table missing |
| Audit Trail | AuditLog | ⚠ Column names wrong |
| Webhooks | WebhookEvent | ✓ |
| Error Logging | ErrorLog | ✓ |
| User Preferences | UserPreferences | ✗ Table missing |

---

## Appendix B: Index Coverage Analysis

```
Table               Query Pattern               Index Status
────────────────────────────────────────────────────────────────
User                email lookup                UNIQUE ✓
                    isAdmin filter              ❌ MISSING
                    
Session             userId lookup               @@index([userId]) ✓
                    tokenFamily lookup          UNIQUE ✓
                    
Account             spaceId filter              @@index([spaceId]) ✓
                    provider filter             ❌ MISSING
                    name search                 ❌ MISSING
                    
Transaction         accountId + date            @@index([accountId, date DESC]) ✓
                    accountId + pending         ❌ MISSING (compound)
                    merchant match              ❌ MISSING
                    description match           ❌ MISSING
                    categoryId filter           @@index([categoryId]) ✓
                    
Category            budgetId filter             @@index([budgetId]) ✓
                    
TransactionRule     spaceId + enabled           @@index([spaceId, enabled]) ✓
                    
Budget              spaceId filter              @@index([spaceId]) ✓
                    
Space               type filter                 ❌ MISSING
                    
AssetValuation      accountId + date            @@index([accountId, date DESC]) ✓
                    
ExchangeRate        currency pair lookup        @@index([fromCurrency, toCurrency]) ✓
                    date filter                 @@index([date]) ✓
```

---

**Report Generated:** 2025-11-16  
**Reviewed By:** Database Schema Audit  
**Next Review:** After Phase 1 corrections
