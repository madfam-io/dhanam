# Dhanam Monorepo - Dependency Health Fixes

## Critical Issues (Fix Before Production)

### 1. TypeScript Version Mismatch in Mobile
**File:** `apps/mobile/package.json` (line 71)
**Current:** `"typescript": "~5.3.3"`
**Should be:** `"typescript": "^5.3.0"`
**Reason:** All other packages use caret range; mobile uses tilde which is too restrictive
**Impact:** Potential TypeScript version inconsistencies between platforms

```bash
# Fix command:
npm install --save-dev typescript@^5.3.0
# Then update pnpm-lock.yaml
```

---

### 2. React Version Exact Pin in Mobile
**File:** `apps/mobile/package.json` (line 50)
**Current:** `"react": "18.2.0"`
**Should be:** `"react": "^18.2.0"`
**Reason:** Exact pins prevent automatic security patch updates
**Impact:** Mobile app won't receive critical React patch updates

```bash
# Fix command:
npm install --save react@^18.2.0
```

---

### 3. React-Query Version Gap
**File:** `apps/web/package.json` (line 32)
**Current:** `"@tanstack/react-query": "^5.17.0"` (in web)
**Mobile has:** `"@tanstack/react-query": "^5.28.9"`
**Action:** Sync to ^5.28.9 in web (or vice versa)
**Reason:** 11 minor versions gap can cause API inconsistencies
**Impact:** Potential query handling differences between platforms

```bash
# Option 1: Upgrade web to match mobile
npm install --save @tanstack/react-query@^5.28.9

# Option 2: Downgrade mobile
npm install --save @tanstack/react-query@^5.17.0
```

---

### 4. Bundle Minification Disabled
**Files:** 
- `packages/shared/tsup.config.ts` (line 10)
- `packages/ui/tsup.config.ts` (line 10)
- `packages/esg/tsup.config.ts`

**Current:** `minify: false`
**Should be:** `minify: process.env.NODE_ENV === 'production'`
**Reason:** Unminified code increases bundle size by 15-20%
**Impact:** Slower downloads and deployments for users

```typescript
// Updated config:
minify: process.env.NODE_ENV === 'production',
```

---

## High Priority Issues

### 5. Remove Unused Dependency: joi
**File:** `apps/api/package.json` (line 71)
**Current:** `"joi": "^18.0.1"`
**Issue:** Not used in codebase; project uses zod + class-validator
**Impact:** Unnecessary 50KB+ in node_modules

```bash
npm uninstall joi
```

---

### 6. Standardize Queue Library (bull vs bullmq)
**File:** `apps/api/package.json`
**Current:** Both `"bull": "^4.11.5"` and `"bullmq": "^5.1.0"` installed
**Issue:** Bull is deprecated; should migrate to bullmq exclusively
**Recommendation:** 
1. Audit current bull usage
2. Migrate to bullmq equivalents
3. Remove bull dependency
**Impact:** Reduces maintenance burden; bullmq is actively maintained

```bash
# After migration:
npm uninstall bull
```

---

### 7. Sync Axios Versions
**Current state:**
- API: `^1.11.0`
- Mobile: `^1.6.8`
- ESG: `^1.6.0`

**Should be:** All `^1.11.0`
**Reason:** API is 4 minor versions ahead; potential behavior differences
**Action:** Upgrade mobile and esg

```bash
npm install --save axios@^1.11.0
```

---

### 8. Add Bundle Size Monitoring to CI/CD
**Issue:** No automated bundle size checks
**Recommendation:** Add `size-limit` package and CI checks
**Implementation:**
```json
// Add to root package.json
{
  "devDependencies": {
    "size-limit": "^11.0.0"
  },
  "size-limit": [
    {
      "path": "packages/shared/dist/index.js",
      "limit": "10 KB"
    },
    {
      "path": "packages/ui/dist/index.js",
      "limit": "40 KB"
    }
  ]
}
```

---

### 9. Add Pre-commit Hooks
**Issue:** No git hooks for linting/formatting
**Recommendation:** Implement husky + lint-staged
**Installation:**
```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**Configure in root package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": "eslint --fix",
    "*.{ts,tsx,js,jsx,json,md}": "prettier --write"
  }
}
```

---

## Medium Priority Issues

### 10. ESLint Version Mismatch (Minor)
**Current:**
- Web/API: `^8.56.0`
- Mobile: `^8.57.0`

**Action:** Standardize to `^8.57.0`
**Impact:** Minor - only 1 version difference, but consistency matters

---

### 11. @types/react Version Mismatch
**Current:**
- Web/UI: `^18.2.47`
- Mobile: `~18.2.45`

**Should be:** All `^18.2.47`
**Action:** Update mobile types

---

### 12. Add Security Scanning
**Recommendation:** Implement Snyk or npm audit
```bash
npm install --save-dev snyk
npx snyk test
```

Add to CI/CD pipeline for automated security checks.

---

### 13. Add Changelog Generation
**Recommendation:** Implement commitizen and standard-version
```bash
npm install --save-dev commitizen standard-version
npx commitizen init cz-conventional-changelog --save-dev
```

---

### 14. Expand Next.js Image Domains
**File:** `apps/web/next.config.js` (line 21-23)
**Current:** Only `['localhost']`
**Should include:** Production domains when deployed
```javascript
images: {
  domains: ['localhost', 'api.dhanam.com', 'cdn.dhanam.com'],
},
```

---

## Implementation Priority Timeline

### Week 1 (Critical)
- [ ] Fix TypeScript version in mobile
- [ ] Fix React version pin in mobile
- [ ] Sync React-Query versions
- [ ] Enable bundle minification

### Week 2 (High Priority)
- [ ] Remove joi dependency
- [ ] Audit bull usage and plan migration
- [ ] Sync axios versions
- [ ] Add bundle size monitoring setup

### Week 3-4 (Medium Priority)
- [ ] Implement pre-commit hooks
- [ ] Add security scanning
- [ ] Standardize remaining version mismatches
- [ ] Add changelog generation

---

## Verification Steps

After each fix, run:
```bash
# Verify no new issues
pnpm lint

# Verify builds still work
pnpm build

# Verify tests pass
pnpm test

# Check lock file is updated
git diff pnpm-lock.yaml | head -50
```

---

## Additional Recommendations

1. **Documentation:** Add a DEPENDENCIES.md guide for the team explaining:
   - Why each major dependency is used
   - Version update guidelines
   - How to add new dependencies

2. **Version Update Policy:**
   - Patch updates: Apply automatically (security fixes)
   - Minor updates: Review and test quarterly
   - Major updates: Plan 1-2 sprints advance

3. **Dependency Audit Schedule:**
   - Weekly: Security scanning
   - Monthly: Version compatibility review
   - Quarterly: Major dependency updates

4. **Scripts to Add to package.json:**
   ```json
   {
     "audit": "npm audit --production",
     "deps:check": "npm outdated",
     "deps:update": "npm update",
     "size": "size-limit"
   }
   ```

