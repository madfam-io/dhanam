# Database Schema Audit - Action Items

## Critical Issues (Fix Immediately - Blocks Feature Development)

### 1. User Table Missing Fields
**Priority:** CRITICAL  
**Effort:** 30 mins  
**Risk:** High - Onboarding & admin features won't work

**Task:**
- [ ] Create migration: `add_user_fields`
- [ ] Add fields to users table:
  - `totp_temp_secret TEXT` (for 2FA setup flow)
  - `totp_backup_codes TEXT[]` (for recovery)
  - `is_active BOOLEAN DEFAULT true`
  - `is_admin BOOLEAN DEFAULT false`
  - `onboarding_completed BOOLEAN DEFAULT false`
  - `onboarding_completed_at TIMESTAMP`
  - `onboarding_step TEXT`
  - `last_login_at TIMESTAMP`
- [ ] Update seed.ts to use these fields
- [ ] Test onboarding flow end-to-end

**Files to Update:**
```
/home/user/dhanam/apps/api/prisma/migrations/[timestamp]_add_user_fields/migration.sql
```

---

### 2. Missing UserPreferences Table
**Priority:** CRITICAL  
**Effort:** 20 mins  
**Risk:** Medium - User preferences feature will fail

**Task:**
- [ ] Create migration: `add_user_preferences`
- [ ] Create UserPreferences table from schema definition (lines 93-147)
- [ ] Verify UserPreferences relationship to User is created
- [ ] Test preferences endpoints once table exists

**Files to Update:**
```
/home/user/dhanam/apps/api/prisma/migrations/[timestamp]_add_user_preferences/migration.sql
```

---

### 3. Missing ExchangeRate Table
**Priority:** CRITICAL  
**Effort:** 15 mins  
**Risk:** Medium - FX rate caching won't work

**Task:**
- [ ] Create migration: `add_exchange_rates`
- [ ] Create ExchangeRate table from schema definition (lines 432-446)
- [ ] Add indexes for currency pair lookups
- [ ] Seed initial exchange rates (if applicable)

**Files to Update:**
```
/home/user/dhanam/apps/api/prisma/migrations/[timestamp]_add_exchange_rates/migration.sql
```

---

### 4. Fix ExchangeRate.rate Float to Decimal
**Priority:** CRITICAL  
**Effort:** 30 mins (requires migration)  
**Risk:** High - Currency conversion precision loss

**Problem:** `rate: Float` loses precision. Example: 1.23456789 → 1.2345678806304932

**Task:**
- [ ] Edit `/home/user/dhanam/apps/api/prisma/schema.prisma` line 436
  ```prisma
  // Before
  rate          Float
  
  // After
  rate          Decimal   @db.Decimal(19, 4)
  ```
- [ ] Create migration: `fix_exchange_rate_precision`
- [ ] Test FX rate calculations

**Files to Update:**
```
/home/user/dhanam/apps/api/prisma/schema.prisma (line 436)
/home/user/dhanam/apps/api/prisma/migrations/[timestamp]_fix_exchange_rate_precision/migration.sql
```

---

### 5. AuditLog Column Name Mismatch
**Priority:** CRITICAL  
**Effort:** 45 mins  
**Risk:** High - Audit logging breaks

**Problem:** Schema defines different column names than migration:
- Migration: `resource_type`, Schema: `resource`
- Migration: `changes`, Schema: `metadata`
- Migration missing: `severity`, `timestamp`

**Task:**
- [ ] Create migration: `fix_audit_log_columns`
- [ ] Rename columns:
  - `resource_type` → `resource`
  - `changes` → `metadata` (and change type to TEXT from JSONB)
- [ ] Add missing columns:
  - `severity TEXT DEFAULT 'low'`
  - `timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- [ ] Update AuditService to use correct column names

**Files to Update:**
```
/home/user/dhanam/apps/api/prisma/migrations/[timestamp]_fix_audit_log_columns/migration.sql
/home/user/dhanam/apps/api/src/core/audit/audit.service.ts (verify fields)
```

---

## High Priority Issues (Next Sprint - 1-2 weeks)

### 6. TOTP Backup Codes Should Be Hashed
**Priority:** HIGH  
**Effort:** 2-3 hours  
**Risk:** High - 2FA bypass if DB compromised

**Problem:** Backup codes stored in plaintext as `String[]`

**Solution:**
- [ ] Hash backup codes using same Argon2id as passwords
- [ ] Store hashes in database
- [ ] Update TOTP service to verify hashes instead of string comparison
- [ ] Update seed.ts to generate & hash codes

**Files to Update:**
```
/home/user/dhanam/apps/api/src/core/auth/totp.service.ts
/home/user/dhanam/apps/api/prisma/seed.ts
```

---

### 7. User.isActive Should Default to False
**Priority:** HIGH  
**Effort:** 1 hour  
**Risk:** Medium - Security best practice

**Problem:** Users active by default without email verification

**Task:**
- [ ] Change default in schema: `isActive Boolean @default(false)`
- [ ] Create migration
- [ ] Update auth flow to activate only after email verification
- [ ] Update seed.ts to set isActive = true for demo user

---

### 8. TransactionRule CategoryId Should Be Optional
**Priority:** HIGH  
**Effort:** 1 hour  
**Risk:** Medium - Rules engine constraint mismatch

**Problem:** Migration has NOT NULL, schema has optional

**Task:**
- [ ] Create migration to make `category_id` nullable
- [ ] Update rules.service.ts to handle null categoryId
- [ ] Test rules without categories

---

### 9. Add Missing Indexes
**Priority:** HIGH  
**Effort:** 2 hours  
**Risk:** Medium - Query performance degradation

**Indexes to Add:**
```prisma
// Transaction rules matching
model Transaction {
  @@index([merchant])
  @@index([description])
  // Compound for sync queries
  @@index([accountId, pending])
}

model Account {
  @@index([provider])
  @@index([name])
  // Compound for provider accounts
  @@index([spaceId, provider])
}

model Space {
  @@index([type])
}

model User {
  @@index([isAdmin])
}
```

**Task:**
- [ ] Edit schema.prisma
- [ ] Create migration: `add_missing_indexes`
- [ ] Run explain plans to verify index usage

---

### 10. TOTP Secrets Should Be Encrypted
**Priority:** HIGH  
**Effort:** 2-3 hours  
**Risk:** High - TOTP compromise if DB breached

**Problem:** `totpSecret` and `totpTempSecret` stored in plaintext

**Task:**
- [ ] Update CryptoService to encrypt/decrypt TOTP secrets
- [ ] Create migration if needed (schema change not required - just encryption)
- [ ] Update TOTP service to encrypt before storing, decrypt before using

---

## Medium Priority (Optimization & Quality - 2-4 weeks)

### 11. Soft Deletes for Sensitive Data
**Priority:** MEDIUM  
**Effort:** 4-6 hours  
**Risk:** Low - Data preservation

**Add soft delete support to:**
- [ ] Space
- [ ] Account
- [ ] Transaction
- [ ] User (optional)

**Implementation:**
```prisma
model Space {
  isDeleted   Boolean   @default(false) @map("is_deleted")
  deletedAt   DateTime? @map("deleted_at")
  @@index([isDeleted])
}
```

---

### 12. Fix N+1 Query in SpacesService
**Priority:** MEDIUM  
**Effort:** 30 mins  
**Risk:** Low - Performance

**Location:** `/home/user/dhanam/apps/api/src/modules/spaces/spaces.service.ts` lines 25-27

**Fix:**
```typescript
// Before
const userSpaces = await this.prisma.userSpace.findMany({
  where: { userId },
  include: { space: true },
});

// After - add user if needed
const userSpaces = await this.prisma.userSpace.findMany({
  where: { userId },
  include: { space: true, user: true },
});
```

---

### 13. Enhance Seed Script
**Priority:** MEDIUM  
**Effort:** 2-3 hours  
**Risk:** Low - Demo data completeness

**Add to seed.ts:**
- [ ] ESG scores for crypto accounts
- [ ] Transaction rules (at least 2-3 examples)
- [ ] Asset valuations for wealth tracking demo
- [ ] Exchange rates for multi-currency demo
- [ ] Audit log entries (auth success, etc.)

---

### 14. Make merchant & providerAccountId Non-Optional
**Priority:** MEDIUM  
**Effort:** 3-4 hours  
**Risk:** Medium - Data quality

**Task:**
- [ ] Review how nulls are currently handled
- [ ] Make `Transaction.merchant` NOT NULL (default to description)
- [ ] Make `Account.providerAccountId` NOT NULL for non-manual providers
- [ ] Create migration & update validation

---

## Testing & Validation

### Pre-Production Checklist
- [ ] Run `prisma validate` - zero errors
- [ ] Run `prisma generate` - regenerate client
- [ ] All migrations applied cleanly to test DB
- [ ] Seed script runs without errors
- [ ] All audit log queries work
- [ ] User preferences CRUD operations work
- [ ] FX rate lookups return correct precision
- [ ] TOTP flows work with encrypted secrets
- [ ] Budget period constraints enforced
- [ ] Soft delete queries filter correctly

### Performance Validation
- [ ] Run explain plans on top 10 queries
- [ ] Transaction list with 100K+ records <1.5s
- [ ] Budget listing with categories <500ms
- [ ] Rules matching on 1000 transactions <2s
- [ ] Connection pool doesn't exhaust under load

---

## Timeline Recommendation

**Week 1 (Blockers):** Critical issues 1-5  
**Week 2 (High Priority):** High priority issues 6-10  
**Week 3-4 (Polish):** Medium priority 11-14 + Testing

**Estimated Total Effort:** 25-30 engineering hours

---

## Files to Monitor

After fixes are applied, monitor these files for consistency:

```
/home/user/dhanam/apps/api/prisma/schema.prisma
/home/user/dhanam/apps/api/prisma/migrations/
/home/user/dhanam/apps/api/src/core/prisma/prisma.service.ts
/home/user/dhanam/apps/api/src/core/audit/audit.service.ts
/home/user/dhanam/apps/api/src/core/auth/totp.service.ts
/home/user/dhanam/apps/api/src/modules/users/users.service.ts
/home/user/dhanam/apps/api/src/modules/preferences/preferences.service.ts
/home/user/dhanam/apps/api/src/modules/fx-rates/fx-rates.service.ts
/home/user/dhanam/apps/api/prisma/seed.ts
```

---

**Last Updated:** 2025-11-16  
**Status:** Ready for assignment
