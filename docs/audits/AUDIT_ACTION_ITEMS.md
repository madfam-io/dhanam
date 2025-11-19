# Code Quality Audit - Action Items & Implementation Guide

**Audit Date:** November 16, 2025
**Status:** Ready for implementation
**Priority Order:** Critical → High → Medium → Low

---

## CRITICAL (MUST FIX BEFORE NEXT RELEASE)

### Action 1: Fix API TypeScript Configuration
**File:** `apps/api/tsconfig.json`
**Current State:**
```json
{
  "extends": "@dhanam/config/typescript/nestjs.json",
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noUncheckedIndexedAccess": false
  }
}
```

**Required Change:**
```json
{
  "extends": "@dhanam/config/typescript/nestjs.json",
  "compilerOptions": {
    // Remove these lines - inherit from base:
    // "strict": false,
    // "noImplicitAny": false,
    // "noUnusedLocals": false,
    // "noUnusedParameters": false,
    // "noUncheckedIndexedAccess": false
  }
}
```

**Expected Impact:**
- Will catch ~30 type errors in API code
- May require fixing unused parameters, implicit any types
- Estimated fix time: 3-5 hours

**Validation:**
```bash
cd apps/api
pnpm typecheck
```

**Note:** You may need to:
1. Add underscore prefix to intentionally unused parameters: `_unusedParam`
2. Type generic functions with explicit return types
3. Replace `any` types with proper types

---

### Action 2: Upgrade ESLint Rules to ERROR
**File:** `packages/config/eslint/base.js`

**Change #1: Line 34**
```javascript
// FROM:
'@typescript-eslint/no-explicit-any': 'warn',

// TO:
'@typescript-eslint/no-explicit-any': 'error',
```

**Change #2: Line 36**
```javascript
// FROM:
'@typescript-eslint/no-non-null-assertion': 'warn',

// TO:
'@typescript-eslint/no-non-null-assertion': 'error',
```

**Change #3: Add new rule after Line 51**
```javascript
// Add to rules object:
'no-unsafe-optional-chaining': 'error',
'no-unsafe-negation': 'error',
```

**Expected Impact:**
- Will fail lint for ~50+ "any" usages
- Mobile app icons will need type refactoring
- Estimated fix time: 2-3 hours

**Files That Will Fail:**
```
apps/mobile/app/accounts/connect.tsx
apps/mobile/app/(tabs)/accounts.tsx
apps/mobile/app/(tabs)/budgets.tsx
apps/mobile/app/(tabs)/transactions.tsx
apps/api/src/core/logger/log-sanitizer.ts
packages/esg/src/services/portfolio-analyzer.ts
[+ 10 more files]
```

**Validation:**
```bash
pnpm lint --max-warnings 0
```

---

### Action 3: Remove Console.log Statements
**Priority Files (20 total):**

#### High Priority (Production Code):
1. **apps/web/src/components/settings/PreferencesSection.tsx**
   - Replace: `console.log()` → `this.logger.log()`

2. **apps/web/src/components/providers/plaid-connect.tsx**
   - Replace debug logs with proper error logging

3. **apps/web/src/app/(admin)/admin/analytics/page.tsx**
   - Remove console.logs or use proper logger

4. **apps/api/src/core/config/env-validation.service.ts**
   - Use logger instead of console
   
5. **apps/mobile/src/contexts/AuthContext.tsx**
   - Replace: `console.log()` → proper context logger

#### Medium Priority (Demo/Seed Code):
- `apps/api/prisma/seed.ts` - Keep minimal startup logs
- `apps/api/src/modules/admin/seeds/feature-flags.seed.ts`

**Implementation:**
```typescript
// BEFORE:
console.log('User authenticated:', userId);

// AFTER (in components):
import { useLogger } from '@/hooks/useLogger';
const logger = useLogger();
logger.info('User authenticated', { userId });

// AFTER (in services):
this.logger.log('User authenticated', userId);
```

**Validation:**
```bash
grep -r "console\.log\|console\.error\|console\.warn" \
  apps/web/src \
  apps/mobile/app \
  apps/api/src \
  --include="*.ts" \
  --include="*.tsx" \
  | grep -v "node_modules" \
  | grep -v ".next"
```

---

## HIGH PRIORITY (THIS SPRINT)

### Action 4: Fix Mobile Icon Type Assertions
**Files Affected:** 6 mobile component files
**Examples:**

**File: `apps/mobile/app/accounts/connect.tsx` (Line 59, 123, 138)**
```typescript
// BEFORE:
router.push(`/accounts/connect/${providerId}` as any);
<Ionicons name={getTypeIcon(type) as any} />

// AFTER:
// Create proper type for provider icons
type IconName = keyof typeof Ionicons.glyphMap;
const getTypeIcon = (type: string): IconName => {
  const iconMap: Record<string, IconName> = {
    'checking': 'business',
    'savings': 'person',
    // ... map all types
  };
  return iconMap[type] || 'help';
};
router.push(`/accounts/connect/${providerId}`);
<Ionicons name={getTypeIcon(type)} />
```

**Other Files:**
- `apps/mobile/app/(tabs)/accounts.tsx` (Line 121)
- `apps/mobile/app/(tabs)/budgets.tsx` (Lines 229, 281)
- `apps/mobile/app/(tabs)/transactions.tsx` (Line 200)
- `apps/mobile/app/(auth)/welcome.tsx` (Line 59)

**Estimated Fix Time:** 2-3 hours

---

### Action 5: Fix API Error Handling Type Issues
**File: `apps/api/src/core/logger/log-sanitizer.ts`**

**Problem:** 9 instances of `any` type
```typescript
// BEFORE:
static sanitize(data: any, depth = 0): any {
  const sanitized: any = {};
  // ...
}

// AFTER:
static sanitize(data: unknown, depth = 0): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  // ...
}
```

**Similar Fixes Needed:**
- `apps/api/src/modules/budgets/budgets.service.ts` (4 instances)
- `apps/api/src/modules/email/email.service.ts` (3 instances)
- `packages/esg/src/services/portfolio-analyzer.ts` (3 instances)

**Estimated Fix Time:** 3-4 hours

---

### Action 6: Resolve TODO/FIXME Comments
**Create GitHub Issues for each:**

#### Issue 1: Plaid Integration
```
Title: Implement Plaid account integration
File: apps/api/src/modules/accounts/accounts.service.ts:74
Description: Add Plaid OAuth flow and account sync
Priority: High
Milestone: Q1 2025
```

#### Issue 2: Bitso Integration
```
Title: Implement Bitso crypto exchange integration
File: apps/api/src/modules/accounts/accounts.service.ts:77
Description: Add Bitso API integration for crypto portfolios
Priority: High
Milestone: Q1 2025
```

#### Issue 3: Multi-Space Support in Belvo
```
Title: Handle multiple spaces in Belvo provider
File: apps/api/src/modules/providers/belvo/belvo.service.ts:419
Description: Currently uses first space, need to support multiple
Priority: Medium
```

#### Issue 4: Error Handling in Belvo
```
Title: Improve Belvo webhook error handling
File: apps/api/src/modules/providers/belvo/belvo.service.ts:434-460
Description: Handle link failures and cleanup scenarios
Priority: Medium
```

---

## MEDIUM PRIORITY (NEXT SPRINT)

### Action 7: Improve Mobile Error Handling
**File: `apps/mobile/src/contexts/AuthContext.tsx`**

**Current Pattern:**
```typescript
try {
  // auth logic
} catch (error: any) {
  // error handling
}
```

**Better Pattern:**
```typescript
// Create error types
type AuthError = 
  | { type: 'network'; message: string }
  | { type: 'invalid_credentials'; message: string }
  | { type: 'server_error'; message: string };

try {
  // auth logic
} catch (error) {
  if (error instanceof NetworkError) {
    // handle network
  } else if (error instanceof ValidationError) {
    // handle validation
  }
}
```

**Files to Update:**
- `apps/mobile/src/contexts/AuthContext.tsx` (3 catch blocks)
- `apps/mobile/src/contexts/OnboardingContext.tsx` (4 catch blocks)
- `apps/mobile/app/accounts/connect/plaid.tsx`
- `apps/mobile/app/(auth)/login.tsx`

**Estimated Fix Time:** 4-6 hours

---

### Action 8: Add ESLint Rule for Unsafe Operations
**File:** `packages/config/eslint/base.js`

**Add to rules section:**
```javascript
'@typescript-eslint/no-unsafe-argument': 'error',
'@typescript-eslint/no-unsafe-assignment': 'error',
'@typescript-eslint/no-unsafe-call': 'error',
'@typescript-eslint/no-unsafe-member-access': 'error',
'@typescript-eslint/no-unsafe-return': 'error',
```

**Expected Impact:**
- Will catch implicit any operations
- May catch 20-30 new issues
- Incremental adoption recommended

**Estimated Fix Time:** 6-8 hours

---

## LOW PRIORITY (FUTURE ENHANCEMENTS)

### Action 9: Bundle Size Monitoring
**Implementation:**
1. Add `next/bundle-analyzer` to web app
2. Create GitHub Action step for size comparison
3. Set size budgets for bundles

**Files to Create:**
```typescript
// next.config.js - Add analyzer for bundles
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**CI Step:**
```yaml
- name: Analyze bundle size
  run: ANALYZE=true pnpm build:web
```

---

### Action 10: Increase Test Coverage
**Current Target:** 80%
**Proposed Target:** 85%

**Modules Below Target:**
- Analyze coverage reports after implementing strict TS
- Focus on API business logic (accounts, transactions, budgets)
- Add integration tests for provider webhooks

---

### Action 11: Performance Monitoring
**Setup:**
1. Add `eslint-plugin-performance`
2. Monitor large bundle imports
3. Track build times in CI

---

## IMPLEMENTATION ROADMAP

### Week 1 (Critical Issues)
- [ ] Fix API TypeScript strict mode (3 hours)
- [ ] Upgrade ESLint rules (2 hours)
- [ ] Remove/replace console.log (3 hours)
- **Total:** 8 hours

### Week 2 (High Priority)
- [ ] Fix mobile icon types (3 hours)
- [ ] Fix API logger types (4 hours)
- [ ] Create GitHub issues for TODOs (2 hours)
- **Total:** 9 hours

### Week 3+ (Medium & Low Priority)
- [ ] Improve mobile error handling (5 hours)
- [ ] Add unsafe operation rules (8 hours)
- [ ] Bundle size monitoring (6 hours)
- [ ] Increase test coverage (8 hours)
- **Total:** 27 hours

---

## VALIDATION CHECKLIST

After implementing changes, validate with:

```bash
# 1. Type checking
pnpm typecheck

# 2. Linting
pnpm lint

# 3. Build all apps
pnpm build

# 4. Run tests
pnpm test

# 5. Check bundle size
cd apps/web && npm run build && du -sh .next

# 6. Run CI locally
gh act push -j lint,typecheck,test,build
```

---

## HELP & REFERENCES

### ESLint Configuration
- Base config: `packages/config/eslint/base.js`
- NestJS config: `packages/config/eslint/nestjs.js`
- Next.js config: `packages/config/eslint/nextjs.js`

### TypeScript Configuration
- Base config: `packages/config/typescript/base.json`
- API config: `apps/api/tsconfig.json` (NEEDS FIX)

### Testing
- API tests: `apps/api/test/`
- Web tests: `apps/web/test/`
- Unit test pattern: `*.spec.ts`
- E2E test pattern: `*.e2e-spec.ts`

### Logger Service
- Location: `apps/api/src/core/logger/logger.service.ts`
- Usage: `this.logger.log()`, `this.logger.error()`, etc.

---

**Created:** November 16, 2025
**Status:** Ready for team implementation
**Questions?** Refer to CODE_QUALITY_AUDIT_REPORT.md for detailed analysis
