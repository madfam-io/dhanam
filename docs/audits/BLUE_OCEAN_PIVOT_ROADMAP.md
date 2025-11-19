# Strategic Codebase Audit: Blue Ocean Pivot Roadmap
## "Project Dhanam" - Autonomous Family Office Strategy

**Date:** 2025-11-19
**Branch:** `claude/audit-strategy-pivot-016qmW2iALtwYzNLcpwtKzUq`
**Audit Scope:** Strategic architectural assessment for pivot from budget tracking to autonomous family office

---

## Executive Summary

**EXCELLENT NEWS:** The Dhanam codebase is **already positioned in Blue Ocean waters**. There are **zero "Red Ocean" legacy features** to deprecate. The current architecture focuses entirely on wealth tracking, budgeting, and ESG insights—not day trading or paper trading.

**THE CHALLENGE:** While free from legacy debt, the codebase lacks **critical family office infrastructure**:
- No household/family entity modeling
- No goal-based asset allocation
- No stochastic simulation engines (Monte Carlo)
- No transaction execution capabilities
- No subscription/tiering infrastructure

**THE OPPORTUNITY:** Strong foundations exist for rapid Blue Ocean feature development:
- ✅ Multi-tenant architecture (Space-based)
- ✅ Enterprise-grade security (Argon2id, KMS, TOTP 2FA)
- ✅ Multi-currency support with FX tracking
- ✅ ESG scoring (unique differentiator)
- ✅ Daily valuation snapshots (wealth trending)
- ✅ Feature flags system

**Blue Ocean Readiness Score:** 35/100
**Estimated Pivot Timeline:** 24-32 weeks (6-8 months)

---

## Phase 1: The "Red Ocean" Purge Assessment

### FINDING: Zero Deprecation Required ✅

**Comprehensive searches revealed NO Red Ocean features:**

#### 1. Technical Analysis: NONE FOUND
- ❌ No TradingView integrations
- ❌ No technical indicators (RSI, MACD, Bollinger Bands)
- ❌ No candlestick charts or OHLC data
- ❌ No intraday price tickers

**What exists instead:**
- ✅ Recharts for budget analytics (spending vs budgeted)
- ✅ React-native-chart-kit for balance trends
- ✅ Bitso API used ONLY for portfolio valuation (not trading)

#### 2. Paper Trading: NONE FOUND
- ❌ No virtual trading engines
- ❌ No mock portfolios
- ❌ No historical trade replay
- ❌ No backtesting functionality

**What exists instead:**
- ✅ "Demo accounts" are just seed data (maria@demo.com)
- ✅ Standard development fixtures only

#### 3. Gamification: NONE FOUND
- ❌ No leaderboards
- ❌ No contests or competitions
- ❌ No social sharing features
- ❌ No achievement/badge systems

**What exists instead:**
- ✅ "Score" mentions are exclusively ESG scoring
- ✅ Pure utility focus on wealth management

#### 4. Trading Performance Metrics: NONE FOUND
- ❌ No benchmark comparisons (vs S&P 500)
- ❌ No alpha/beta calculations
- ❌ No Sharpe ratio or volatility metrics

**What exists instead:**
- ✅ Net worth calculation (assets - liabilities)
- ✅ 60-day cashflow forecasting
- ✅ Income vs expenses tracking
- ✅ Spending by category

**Database Schema Review:**
- ✅ Zero trading history schemas
- ✅ Zero contest/leaderboard tables
- ✅ Zero achievement tracking
- ✅ 100% budget/wealth tracking focus

**Verdict:** The codebase is **perfectly positioned** in Blue Ocean strategy. Marketing should emphasize "wealth tracking" and "budget management," NOT "investing" or "trading."

---

## Phase 2: Blue Ocean Gap Analysis

### 1. Simulation Engine Readiness

**Current State: Deterministic Only**

| Capability | Status | Type | Reusability |
|-----------|--------|------|-------------|
| Net Worth Calculation | ✅ Exists | Deterministic | High |
| 60-Day Cashflow Forecast | ✅ Exists | Linear Projection | Moderate |
| Budget Tracking | ✅ Exists | Deterministic | Moderate |
| Daily Valuation Snapshots | ✅ Exists | Historical | High |
| ESG Scoring | ✅ Exists | Weighted Calc | Moderate |
| **Monte Carlo Simulation** | ❌ Missing | - | **CRITICAL GAP** |
| **Retirement Projections** | ❌ Missing | - | **CRITICAL GAP** |
| **Tax Optimization** | ❌ Missing | - | Medium Gap |
| **Risk Analytics** | ❌ Missing | - | **CRITICAL GAP** |

**Key Findings:**

**Existing Calculators:**
- **Analytics Service** (`apps/api/src/modules/analytics/analytics.service.ts`)
  - Net worth: Simple assets - liabilities
  - Cashflow forecast: Historical 90-day average → 60-day linear projection
  - Hardcoded variability (10% income, 15% expense) but **unused**
  - No pattern detection for recurring transactions
  - No seasonality adjustments

**Missing Statistical Foundation:**
- ❌ No standard deviation, variance, correlation
- ❌ No probability distributions
- ❌ No confidence intervals
- ❌ No scenario analysis ("what-if" calculations)
- ❌ No compound interest modeling

**Critical Gap:** Cannot answer "What's the probability I'll retire with $2M by age 65?" without stochastic modeling.

**Effort to Build:**
- Add statistical library (jStat or simple-statistics): 1 week
- Implement Monte Carlo framework: 3-4 weeks
- Build retirement projection engine: 2-3 weeks
- Tax harvesting algorithms: 4-6 weeks

---

### 2. Data Model Flexibility (Prisma Schema)

**Blue Ocean Readiness: 15/100**

#### Multi-Entity/Family Support: CRITICAL GAPS

**Current Capabilities:**
- ✅ Multi-tenant via `Space` model (personal/business)
- ✅ `UserSpace` junction with roles (owner/admin/member/viewer)
- ✅ Clean data isolation per Space

**Missing for Family Office:**
- ❌ No "Household" or "Family" entity
- ❌ No family member relationships (spouse, child, parent, trustee)
- ❌ No beneficiary designation fields
- ❌ No date of birth (needed for age-based planning)
- ❌ Accounts owned by Space, not assignable to individual members

**Example Use Case NOT Supported:**
> "Dad's IRA is 40% allocated to Retirement goal, 60% to Education goal. Upon death, 50% goes to Spouse, 25% to Child 1, 25% to Child 2."

#### Goal-Based Bucketing: COMPLETELY MISSING

**Evidence:**
- ✅ i18n strings exist (`wealthGoals`, `retirementGoal`, `savingsGoal`) in `packages/shared/src/i18n/es/wealth.ts`
- ❌ **ZERO schema support** (no Goal model, no allocations, no tracking)

**Current Budgets vs Required Goals:**
- **Budgets:** "How much can I spend on groceries this month?" ✅ Exists
- **Goals:** "Am I on track to retire at 65 with $2M?" ❌ Missing

**Gap Summary:**
- ❌ No Goal model
- ❌ No goal-to-account relationship
- ❌ No fractional asset allocation (40% retirement / 60% house)
- ❌ No progress tracking toward goals
- ❌ No goal timelines or target amounts

#### Estate Planning Support: ZERO INFRASTRUCTURE

**Searches for "beneficiary", "will", "estate", "inheritance", "trust" → NO MATCHES**

**Missing Schemas:**
- ❌ No Beneficiary model
- ❌ No Will/Testament model
- ❌ No Executor/Trustee designation
- ❌ No Trust structures
- ❌ No inheritance planning

**Required for "Digital Will" Feature:**
```prisma
model Household {
  id        String
  name      String
  members   HouseholdMember[]
  goals     Goal[]
}

model Will {
  id            String
  householdId   String
  status        WillStatus
  beneficiaries BeneficiaryDesignation[]
  executors     WillExecutor[]
}

model BeneficiaryDesignation {
  beneficiaryId String
  assetId       String
  percentage    Decimal
  conditions    Json?
}
```

**Current State:** 0% of this schema exists

---

### 3. Execution Capability Assessment

**Current State: 100% READ-ONLY**

**Existing Provider Integrations:**

| Provider | Region | Capabilities | Write Operations |
|----------|--------|--------------|------------------|
| **Belvo** | Mexico | OAuth, balance sync, 90-day transaction history | ❌ None |
| **Plaid** | US | Link flow, account sync, webhooks | ❌ None |
| **Bitso** | Crypto | Portfolio balance, trade history, price updates | ❌ None |
| **Blockchain** | ETH/BTC | Address tracking, xPub imports | ❌ None (explicitly read-only) |

**All integrations support:**
- ✅ Account balance reading
- ✅ Transaction history syncing
- ✅ Webhook handlers for updates
- ❌ Trade execution
- ❌ Order placement
- ❌ Fund transfers

**Transactional Security Infrastructure:**

**STRONG FOUNDATIONS:**
- ✅ TOTP 2FA (production-ready)
- ✅ Audit logging (comprehensive: AUTH, PROVIDER, DATA_WRITE)
- ✅ Webhook HMAC verification (timing-safe comparison)
- ✅ JWT (15-min lifetime) + Refresh tokens (30-day, rotating)
- ✅ Argon2id password hashing (64MB memory, cost=3)

**CRITICAL GAPS:**
- ❌ No explicit idempotency keys (uses providerTransactionId for dedup)
- ❌ Missing AWS KMS integration (uses env variable keys, not KMS as spec requires)
- ❌ No transaction verification flows (no OTP for high-value operations)
- ❌ No order limit enforcement

**Provider Abstraction: NONE**

**Current Structure:** Each provider is a siloed module (BelvoModule, PlaidModule, BitsoModule, BlockchainModule)

**Issues:**
- No shared interface or base class
- Duplicate code patterns (webhook verification, encryption, error handling)
- No strategy pattern for provider-agnostic operations

**Effort to Add Execution:**

**Phase 1: Infrastructure (3-4 weeks)**
- Implement idempotency middleware
- Add AWS KMS integration (per spec)
- Create provider abstraction layer (`IExecutionProvider` interface)
- Build transaction verification flows

**Phase 2: Provider Integration (2-3 weeks)**
- Option A: BSE StAR MF (India mutual funds)
- Option B: Smallcase Gateway (India equities)
- Implement order placement endpoints
- Add regulatory audit trails

**Phase 3: Security & Compliance (2-3 weeks)**
- Enforce 2FA for orders
- Implement order limits per user tier
- Build transaction monitoring/alerts
- Add regulatory reporting

**Total Effort: HIGH (8-12 weeks, 2-3 developers)**

---

### 4. Income Smoothing & Irregularity Detection

**Current State: Basic Aggregation Only**

**Existing Analytics:**
- ✅ Sum of positive transactions = income
- ✅ Sum of negative transactions = expenses
- ✅ Historical 90-day average
- ✅ Monthly income vs expenses

**Evidence of Planned Features (Not Implemented):**
```typescript
// packages/shared/src/types/analytics.types.ts
'irregular_income'        // Line 106 - type exists
'recurring_charge'        // Line 107 - type exists
```

**User Preferences Schema:**
- `recurringTransactionDetection: boolean` flag exists
- ❌ **No actual detection implementation found**

**Missing Income Analysis:**
- ❌ No salary vs bonus identification
- ❌ No recurring payment pattern recognition
- ❌ No income frequency analysis (monthly, biweekly, irregular)
- ❌ No income volatility scoring
- ❌ No seasonal income patterns
- ❌ **No "safe-to-spend" buffer algorithm**

**Transaction Categorization:**
- ✅ Rules engine exists with pattern matching (contains, equals, startsWith, etc.)
- ✅ Common presets (groceries, gas, restaurants, ATM)
- ❌ **No automatic salary vs bonus distinction**
- ❌ No ML-based categorization
- ❌ No confidence scoring

**Critical Gap for Gig Economy Users:**
Current cashflow forecast uses simple historical average. For freelancers with irregular income (e.g., $0 in January, $15k in February, $3k in March), the forecast is misleading.

**Required Algorithm:**
```
Safe-to-Spend = Current Balance - (
  Upcoming Bills (next 30 days) +
  Income Volatility Buffer (2x std dev) +
  Emergency Reserve (user-defined)
)
```

**Effort to Build:**
- Pattern detection for recurring transactions: 2-3 weeks
- Income regularity scoring: 1-2 weeks
- Safe-to-spend algorithm: 2 weeks
- Confidence intervals for forecasts: 1 week

---

## Phase 3: Tiering & Security Architecture

### Authorization Granularity: 2/10 for Premium Tiering

**Current State:**

**Existing Guards:**
1. `JwtAuthGuard` - Binary authenticated/unauthenticated
2. `AdminGuard` - Checks if user is owner/admin in ANY space
3. `SpaceGuard` - Per-space role checking (owner/admin/member/viewer)

**Feature Flags System:**
- ✅ Redis-based with user allowlists
- ✅ Percentage rollout support
- ✅ Current features: ESG Scoring, Advanced Analytics, Cashflow Forecasting, AI Categorization
- ❌ **No subscription tier enforcement** (purely admin-controlled)

**Critical Gap: NO SUBSCRIPTION MODEL**

**Evidence:**
- ❌ No `User.subscriptionTier` field in Prisma schema
- ❌ No payment/billing integration (Stripe search = no results)
- ❌ All controllers use `@UseGuards(JwtAuthGuard)` without tier checking
- ❌ No usage metering for calculations

**Example - ESG Controller** (`apps/api/src/modules/esg/esg.controller.ts`):
```typescript
@UseGuards(JwtAuthGuard)  // ✓ Authenticated
@UseGuards(SpaceGuard)    // ✓ Space membership
// ✗ NO tier checking - anyone can access ESG scoring
```

**What's Missing:**

```prisma
// NEEDED: Schema addition
enum SubscriptionTier {
  free
  basic
  premium
}

model User {
  subscriptionTier       SubscriptionTier @default(free)
  subscriptionExpiresAt  DateTime?
  stripeCustomerId       String?
  stripeSubscriptionId   String?
}
```

```typescript
// NEEDED: Tier-based guard
@Injectable()
export class SubscriptionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.get('tier', context.getHandler());
    const user = request.user;

    if (user.subscriptionTier === 'free' && requiredTier === 'premium') {
      throw new PaymentRequiredException('Upgrade to Premium');
    }

    return true;
  }
}

// Usage:
@RequiresPremium()
@Get('v2/portfolio/monte-carlo')
async getRetirementProbability() { ... }
```

**Missing Components:**
- ❌ Subscription model
- ❌ Tier-based authorization decorators
- ❌ Payment integration (Stripe)
- ❌ Webhook handlers for subscription events
- ❌ Usage metering (ESG calculations, analytics requests)
- ❌ Billing history tracking

---

### Zero-Knowledge Potential: 3/10 (Hybrid Only)

**Current Encryption:**

**Server-Side Encryption (Strong):**
- ✅ AES-256-GCM via AWS KMS (production)
- ✅ Encrypted provider tokens (`ProviderConnection.encryptedToken`)
- ✅ Encrypted account credentials
- ✅ Proper authenticated encryption with random IVs

**Password Security:**
- ✅ Argon2id (64MB memory, cost=3, parallelism=4)
- ✅ SHA-256 for TOTP backup codes

**Zero-Knowledge Feasibility:**

**BLOCKERS:**
1. **Server-Side Keys:** All encryption keys managed server-side (KMS or ENV)
2. **Business Logic Dependencies:**
   - ESG scoring requires reading crypto balances
   - Analytics aggregations need transaction amounts
   - Cashflow forecasting requires plaintext financial data
   - Budget category matching needs transaction descriptions
3. **Provider Integrations:** Belvo/Plaid/Bitso tokens must be server-decryptable for API calls

**FEASIBLE for Premium Tier (Hybrid Approach):**
```
Basic Tier:  Server-side encryption (current)
Premium Tier: Client-side encrypted "vault" for sensitive notes/documents
  - User-derived encryption keys (PBKDF2 from password + salt)
  - Encrypted metadata fields (JSON blobs)
  - Server stores encrypted data but CANNOT read
  - Trade-off: No server-side search on encrypted fields
```

**NOT FEASIBLE for:**
- Transaction amounts (needed for budgeting)
- Account balances (needed for net worth)
- Provider credentials (needed for syncing)

**Marketing Recommendation:**
- ✅ "Enhanced Privacy Mode" (client-encrypted notes/documents)
- ❌ "Full Zero-Knowledge" (impossible due to business logic)
- ✅ "Bank-Level Security" (Argon2id, KMS, TOTP 2FA, audit logging)

---

### Security Strengths for Blue Ocean Pivot

**Authentication Security: 9/10**

**Excellent Implementations:**
- ✅ JWT (15-min lifetime, short-lived per spec)
- ✅ Refresh tokens (Redis, 30-day, SHA-256 hashed, rotation on refresh)
- ✅ TOTP 2FA (Speakeasy, QR codes, 10 hashed backup codes)
- ✅ Rate limiting (IP-based for auth, IP+User-Agent for sensitive ops)
- ✅ Audit logging (AUTH_SUCCESS/FAILURE, PASSWORD_RESET, TOTP changes)

**Minor Gaps:**
- ❌ No breach password checking (mentioned in CLAUDE.md, not implemented)
- ❌ No IP allowlisting for admin accounts

**Data Privacy: 8/10**

**Strong Points:**
- ✅ Clean multi-tenant isolation (Space-based)
- ✅ Comprehensive audit trail
- ✅ Log sanitizer for sensitive data
- ✅ Session management with expiration

**Gaps:**
- ❌ No Postgres Row-Level Security (relies on application guards)
- ❌ No data residency controls (LATAM requirement not enforced)
- ❌ No GDPR data export automation

---

## Pivot Roadmap Report

### KEEP: Strong Foundations (No Changes Needed)

**1. Core Architecture ✅**
- Multi-tenant Space model
- UserSpace role-based access control
- Prisma schema structure
- NestJS/Fastify backend architecture

**2. Authentication & Security ✅**
- JWT + Refresh token implementation
- TOTP 2FA system
- Argon2id password hashing
- Audit logging infrastructure
- Log sanitization

**3. Provider Integrations ✅**
- Belvo (Mexico banking)
- Plaid (US banking)
- Bitso (crypto exchange)
- Blockchain (ETH/BTC address tracking)
- Webhook HMAC verification
- Token encryption (KMS)

**4. Financial Infrastructure ✅**
- Daily valuation snapshots
- FX rate tracking (Banxico API)
- Multi-currency support (MXN/USD/EUR)
- Transaction categorization rules engine
- Budget tracking system

**5. Unique Differentiators ✅**
- ESG scoring for crypto assets (Dhanam package)
- Portfolio-weighted ESG analysis
- LATAM-first focus (Mexico region)
- Multilingual support (ES/EN)

**6. DevOps & Quality ✅**
- Monorepo structure (Turborepo + pnpm)
- Docker compose for local dev
- Feature flags system (Redis-based)
- Comprehensive test infrastructure

**Files to Preserve:**
- `/apps/api/src/core/auth/` - Authentication services
- `/apps/api/src/modules/providers/` - Provider integrations
- `/apps/api/src/modules/analytics/analytics.service.ts` - Base analytics
- `/packages/esg/` - ESG scoring package
- `/apps/api/src/core/crypto/` - Encryption services
- `/apps/api/prisma/schema.prisma` - Core schema (extend, don't replace)

---

### REFACTOR: Salvageable Components

**1. Cashflow Forecasting (Moderate Refactor)**

**Current:** Simple linear projection with hardcoded variability
```typescript
// apps/api/src/modules/analytics/analytics.service.ts:74-130
avgWeeklyIncome, avgWeeklyExpenses → 60-day linear projection
```

**Refactor to:**
- Pattern detection for recurring transactions
- Seasonal adjustment algorithms
- Confidence intervals
- Income regularity scoring
- Probabilistic forecasting

**Effort:** 3-4 weeks

**2. Budget Analytics (Extend to Goals)**

**Current:** Budget vs actual spending, category-level tracking
```typescript
// apps/api/src/modules/budgets/budgets.service.ts
Categories with budgeted amounts, percentage utilized
```

**Refactor to:**
- Migrate concept to Goals (Retirement, Education, House)
- Add goal-to-account allocation mapping
- Progress tracking with probability of success
- Timeline-based projections

**Effort:** 4-6 weeks

**3. Portfolio Allocation (Basic → Advanced)**

**Current:** Simple account type aggregation
```typescript
// Portfolio analyzer groups by account type
checking, savings, investment, crypto
```

**Refactor to:**
- Asset class allocation (equities, bonds, alternatives, crypto)
- Target allocation vs actual drift detection
- Tax-efficient rebalancing recommendations
- Correlation and covariance analysis

**Effort:** 4-5 weeks

**4. Rules Engine (Extend for Income Analysis)**

**Current:** Transaction categorization via pattern matching
```typescript
// apps/api/src/modules/categories/rules.service.ts
Field matching: description, merchant, amount, account
Operators: contains, equals, startsWith, greaterThan, lessThan
```

**Refactor to:**
- Income pattern detection (salary vs bonus)
- Recurring payment identification
- Income frequency classification (monthly, biweekly, irregular)
- Confidence scoring per categorization

**Effort:** 3-4 weeks

**5. Space Model (Extend for Households)**

**Current:** SpaceType = personal | business
```prisma
model Space {
  id    String
  type  SpaceType
}
```

**Refactor to:**
```prisma
model Space {
  id           String
  type         SpaceType  // Keep existing
  householdId  String?    // New optional field

  household    Household? @relation(fields: [householdId], references: [id])
}

model Household {
  id       String
  name     String
  type     HouseholdType  // family, trust, estate
  members  HouseholdMember[]
  spaces   Space[]
}
```

**Effort:** 4-6 weeks (includes migration)

**6. Feature Flags → Subscription Tiers**

**Current:** Admin-controlled flags with user allowlists
```typescript
// Redis-based feature flags
isEnabled('esg-scoring', userId)
```

**Refactor to:**
```typescript
// Subscription tier enforcement
@RequiresTier('premium')
canAccess('advanced-analytics', user)
```

**Effort:** 2-3 weeks

---

### BUILD: Top 3 Missing Architectural Pillars

### **PILLAR 1: Stochastic Simulation Engine (CRITICAL)**

**Priority:** HIGHEST
**Business Impact:** Core differentiator for "Autonomous Family Office"
**Estimated Effort:** 8-10 weeks

**Components to Build:**

**1.1 Statistical Foundation Library**
```typescript
// NEW: /packages/simulations/src/utils/statistics.ts

export class Statistics {
  static mean(values: number[]): number;
  static stdDev(values: number[]): number;
  static percentile(values: number[], p: number): number;
  static correlation(x: number[], y: number[]): number;
}
```

**1.2 Monte Carlo Simulation Engine**
```typescript
// NEW: /packages/simulations/src/engines/monte-carlo.ts

export interface SimulationConfig {
  initialBalance: number;
  monthlyContribution: number;
  yearsToSimulate: number;
  iterations: number;          // e.g., 10,000
  returnDistribution: {
    mean: number;               // e.g., 0.07 (7% annual)
    stdDev: number;             // e.g., 0.15 (15% volatility)
  };
  inflationRate: number;        // e.g., 0.03
}

export interface SimulationResult {
  medianOutcome: number;
  percentile10: number;         // Worst 10%
  percentile90: number;         // Best 10%
  probabilityOfSuccess: number; // % reaching goal
  yearlyProjections: {
    year: number;
    median: number;
    p10: number;
    p90: number;
  }[];
}

export class MonteCarloEngine {
  simulate(config: SimulationConfig): SimulationResult;

  private runIteration(config: SimulationConfig): number;
  private sampleReturn(mean: number, stdDev: number): number;
}
```

**1.3 Retirement Probability Calculator**
```typescript
// NEW: /apps/api/src/modules/simulations/retirement.service.ts

export class RetirementSimulationService {
  calculateRetirementProbability(params: {
    currentAge: number;
    retirementAge: number;
    currentSavings: number;
    monthlyContribution: number;
    targetAmount: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  }): Promise<SimulationResult>;

  calculateSafeWithdrawalRate(params: {
    portfolioValue: number;
    yearsInRetirement: number;
    successProbability: number;  // e.g., 0.95 for 95%
  }): Promise<number>;
}
```

**1.4 Scenario Analysis Framework**
```typescript
// NEW: /packages/simulations/src/engines/scenario-analysis.ts

export interface Scenario {
  name: string;
  shocks: {
    type: 'income_loss' | 'market_crash' | 'expense_spike' | 'tax_change';
    magnitude: number;
    startYear: number;
    duration: number;
  }[];
}

export class ScenarioAnalyzer {
  analyzeScenario(
    baselineConfig: SimulationConfig,
    scenario: Scenario
  ): ComparisonResult;

  // Predefined scenarios
  static readonly SCENARIOS = {
    JOB_LOSS: Scenario;
    MARKET_CRASH_2008: Scenario;
    MEDICAL_EMERGENCY: Scenario;
  };
}
```

**Dependencies:**
- Add `jstat` or `simple-statistics` npm package
- Add `@types/jstat` for TypeScript support

**Database Changes:**
```prisma
// NEW: apps/api/prisma/schema.prisma additions

model Simulation {
  id               String   @id @default(uuid())
  userId           String
  spaceId          String?
  goalId           String?
  type             SimulationType
  config           Json
  result           Json
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id])
  space            Space?   @relation(fields: [spaceId], references: [id])
  goal             Goal?    @relation(fields: [goalId], references: [id])

  @@index([userId, createdAt])
}

enum SimulationType {
  retirement
  goal_probability
  safe_withdrawal
  scenario_stress_test
}
```

**API Endpoints:**
```typescript
// NEW: apps/api/src/modules/simulations/simulations.controller.ts

@Controller('simulations')
export class SimulationsController {

  @RequiresPremium()  // ← Tier-gated
  @Post('retirement')
  async simulateRetirement(@Body() dto: RetirementSimulationDto) { ... }

  @RequiresPremium()
  @Post('goal/:goalId/probability')
  async calculateGoalProbability(@Param('goalId') goalId: string) { ... }

  @RequiresPremium()
  @Post('scenarios/:scenarioId')
  async analyzeScenario(@Param('scenarioId') scenarioId: string) { ... }
}
```

**Testing Strategy:**
- Unit tests: Statistical functions (mean, stdDev, percentile)
- Integration tests: Monte Carlo convergence (10k iterations → stable results)
- Snapshot tests: Known scenarios (reproduce 2008 crash simulation)

**Milestones:**
- Week 1-2: Statistical library + unit tests
- Week 3-5: Monte Carlo engine + validation
- Week 6-7: Retirement calculator + scenario analysis
- Week 8-10: API integration + frontend UI

---

### **PILLAR 2: Household & Goal-Based Planning (CRITICAL)**

**Priority:** HIGHEST
**Business Impact:** Enables family office value proposition
**Estimated Effort:** 10-12 weeks

**Components to Build:**

**2.1 Household Entity Schema**
```prisma
// NEW: Household infrastructure

model Household {
  id               String        @id @default(uuid())
  name             String
  type             HouseholdType @default(family)
  baseCurrency     Currency      @default(USD)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  members          HouseholdMember[]
  spaces           Space[]
  goals            Goal[]
  wills            Will[]

  @@index([createdAt])
}

model HouseholdMember {
  id               String           @id @default(uuid())
  householdId      String
  userId           String
  relationship     RelationshipType
  isMinor          Boolean          @default(false)
  dateOfBirth      DateTime?
  accessStartDate  DateTime?        // For minors aging into access
  createdAt        DateTime         @default(now())

  household        Household        @relation(fields: [householdId], references: [id])
  user             User             @relation(fields: [userId], references: [id])
  beneficiaryDesignations BeneficiaryDesignation[]

  @@unique([householdId, userId])
  @@index([householdId])
}

enum HouseholdType {
  family
  trust
  estate
  partnership
}

enum RelationshipType {
  spouse
  child
  parent
  sibling
  dependent
  trustee
  executor
  advisor
  beneficiary
}
```

**2.2 Goal Tracking System**
```prisma
model Goal {
  id               String        @id @default(uuid())
  spaceId          String?       // Individual goal
  householdId      String?       // Household goal
  name             String
  type             GoalType
  targetAmount     Decimal       @db.Decimal(20, 2)
  targetDate       DateTime
  priority         Int           @default(1)
  status           GoalStatus    @default(active)
  notes            String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  space            Space?        @relation(fields: [spaceId], references: [id])
  household        Household?    @relation(fields: [householdId], references: [id])
  allocations      GoalAllocation[]
  simulations      Simulation[]

  @@index([spaceId, status])
  @@index([householdId, status])
}

model GoalAllocation {
  id               String        @id @default(uuid())
  goalId           String
  accountId        String
  percentage       Decimal       @db.Decimal(5, 2)  // 0-100
  notes            String?
  createdAt        DateTime      @default(now())

  goal             Goal          @relation(fields: [goalId], references: [id], onDelete: Cascade)
  account          Account       @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@unique([goalId, accountId])
  @@index([goalId])
}

enum GoalType {
  retirement
  education
  house_purchase
  emergency_fund
  legacy
  travel
  business
  other
}

enum GoalStatus {
  active
  paused
  achieved
  abandoned
}
```

**2.3 User Schema Extensions**
```prisma
// MODIFY: Extend existing User model

model User {
  // ... existing fields
  dateOfBirth      DateTime?     // NEW: For age-based planning

  // ... existing relations
  householdMemberships HouseholdMember[]  // NEW
}
```

**2.4 Space Schema Extensions**
```prisma
// MODIFY: Extend existing Space model

model Space {
  // ... existing fields
  householdId      String?       // NEW: Optional household link

  // ... existing relations
  household        Household?    @relation(fields: [householdId], references: [id])
  goals            Goal[]        // NEW
  simulations      Simulation[]  // NEW
}
```

**2.5 Account Schema Extensions**
```prisma
// MODIFY: Extend existing Account model

model Account {
  // ... existing fields
  primaryOwnerId   String?       // NEW: Individual ownership

  // ... existing relations
  primaryOwner     User?         @relation("PrimaryOwner", fields: [primaryOwnerId], references: [id])
  goalAllocations  GoalAllocation[]  // NEW
}
```

**2.6 Goal Progress Service**
```typescript
// NEW: /apps/api/src/modules/goals/goals.service.ts

export class GoalsService {
  async calculateProgress(goalId: string): Promise<GoalProgress> {
    const goal = await this.findById(goalId);
    const allocations = await this.getAllocations(goalId);

    // Sum current value of allocated accounts
    const currentValue = allocations.reduce((sum, alloc) => {
      return sum + (alloc.account.balance * alloc.percentage / 100);
    }, 0);

    // Calculate time progress
    const now = new Date();
    const totalTime = goal.targetDate.getTime() - goal.createdAt.getTime();
    const elapsed = now.getTime() - goal.createdAt.getTime();
    const timeProgress = Math.min(elapsed / totalTime, 1);

    // Calculate value progress
    const valueProgress = currentValue / goal.targetAmount;

    return {
      currentValue,
      targetValue: goal.targetAmount,
      percentComplete: valueProgress * 100,
      timeProgress: timeProgress * 100,
      projectedCompletion: this.projectCompletion(goal, currentValue),
      onTrack: valueProgress >= timeProgress * 0.9,  // Within 10%
    };
  }

  async getHouseholdGoals(householdId: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { householdId },
      include: { allocations: { include: { account: true } } },
    });
  }
}
```

**2.7 Household Management Service**
```typescript
// NEW: /apps/api/src/modules/households/households.service.ts

export class HouseholdsService {
  async createHousehold(dto: CreateHouseholdDto, creatorId: string): Promise<Household> {
    return this.prisma.household.create({
      data: {
        name: dto.name,
        type: dto.type,
        baseCurrency: dto.baseCurrency,
        members: {
          create: {
            userId: creatorId,
            relationship: 'owner',
            accessStartDate: new Date(),
          },
        },
      },
      include: { members: { include: { user: true } } },
    });
  }

  async addMember(householdId: string, dto: AddMemberDto): Promise<HouseholdMember> {
    // Validate household exists
    // Validate user exists
    // Create member relationship
    return this.prisma.householdMember.create({
      data: {
        householdId,
        userId: dto.userId,
        relationship: dto.relationship,
        dateOfBirth: dto.dateOfBirth,
        isMinor: this.calculateIsMinor(dto.dateOfBirth),
      },
    });
  }

  async getNetWorth(householdId: string): Promise<NetWorthSummary> {
    // Aggregate across all household spaces
    const household = await this.findById(householdId, { include: { spaces: true } });

    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const space of household.spaces) {
      const spaceNetWorth = await this.analyticsService.getNetWorth(space.id);
      totalAssets += spaceNetWorth.assets;
      totalLiabilities += spaceNetWorth.liabilities;
    }

    return {
      assets: totalAssets,
      liabilities: totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      currency: household.baseCurrency,
    };
  }
}
```

**API Endpoints:**
```typescript
// NEW: /apps/api/src/modules/households/households.controller.ts

@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {

  @Post()
  async create(@Body() dto: CreateHouseholdDto, @User() user) {
    return this.householdsService.createHousehold(dto, user.id);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.householdsService.addMember(id, dto);
  }

  @Get(':id/net-worth')
  async getNetWorth(@Param('id') id: string) {
    return this.householdsService.getNetWorth(id);
  }

  @Get(':id/goals')
  async getGoals(@Param('id') id: string) {
    return this.goalsService.getHouseholdGoals(id);
  }
}

// NEW: /apps/api/src/modules/goals/goals.controller.ts

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {

  @Post()
  async create(@Body() dto: CreateGoalDto) {
    return this.goalsService.create(dto);
  }

  @Get(':id/progress')
  async getProgress(@Param('id') id: string) {
    return this.goalsService.calculateProgress(id);
  }

  @RequiresPremium()  // ← Tier-gated
  @Get(':id/probability')
  async getProbabilityOfSuccess(@Param('id') id: string) {
    // Calls simulation engine
    return this.simulationService.calculateGoalProbability(id);
  }

  @Post(':id/allocations')
  async addAllocation(@Param('id') id: string, @Body() dto: AddAllocationDto) {
    return this.goalsService.addAllocation(id, dto);
  }
}
```

**Migration Strategy:**
```typescript
// NEW: /apps/api/prisma/migrations/YYYYMMDD_add_households_and_goals.sql

-- Create households tables
CREATE TABLE "Household" ( ... );
CREATE TABLE "HouseholdMember" ( ... );
CREATE TABLE "Goal" ( ... );
CREATE TABLE "GoalAllocation" ( ... );

-- Extend existing tables
ALTER TABLE "User" ADD COLUMN "dateOfBirth" TIMESTAMP;
ALTER TABLE "Space" ADD COLUMN "householdId" TEXT;
ALTER TABLE "Account" ADD COLUMN "primaryOwnerId" TEXT;

-- Add foreign keys
ALTER TABLE "Space" ADD CONSTRAINT "Space_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id");

-- Create indexes
CREATE INDEX "Household_createdAt_idx" ON "Household"("createdAt");
CREATE INDEX "Goal_spaceId_status_idx" ON "Goal"("spaceId", "status");
CREATE INDEX "GoalAllocation_goalId_idx" ON "GoalAllocation"("goalId");
```

**Frontend Components:**
```typescript
// NEW: /apps/web/src/components/households/household-dashboard.tsx
// NEW: /apps/web/src/components/goals/goal-tracker.tsx
// NEW: /apps/web/src/components/goals/goal-allocation-editor.tsx
// NEW: /apps/mobile/app/(tabs)/goals.tsx
```

**Milestones:**
- Week 1-2: Schema design + migration + tests
- Week 3-4: Household management service + API
- Week 5-6: Goal tracking service + progress calculation
- Week 7-8: Goal allocation logic + validation
- Week 9-10: Frontend dashboard components
- Week 11-12: Mobile app integration + E2E tests

---

### **PILLAR 3: Subscription & Tiering Infrastructure (CRITICAL)**

**Priority:** HIGHEST (Blocks Revenue)
**Business Impact:** Enables freemium → premium conversion
**Estimated Effort:** 6-8 weeks

**Components to Build:**

**3.1 Subscription Schema**
```prisma
// NEW: Subscription infrastructure

model User {
  // ... existing fields
  subscriptionTier       SubscriptionTier @default(free)
  subscriptionStartedAt  DateTime?
  subscriptionExpiresAt  DateTime?
  stripeCustomerId       String?          @unique
  stripeSubscriptionId   String?          @unique

  // ... existing relations
  billingHistory         BillingEvent[]   // NEW
  usageMetrics           UsageMetric[]    // NEW
}

model BillingEvent {
  id               String        @id @default(uuid())
  userId           String
  type             BillingEventType
  amount           Decimal       @db.Decimal(10, 2)
  currency         Currency      @default(USD)
  status           BillingStatus
  stripeEventId    String?       @unique
  metadata         Json?
  createdAt        DateTime      @default(now())

  user             User          @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}

model UsageMetric {
  id               String        @id @default(uuid())
  userId           String
  metricType       UsageMetricType
  count            Int
  date             DateTime      @db.Date
  metadata         Json?

  user             User          @relation(fields: [userId], references: [id])

  @@unique([userId, metricType, date])
  @@index([userId, date])
}

enum SubscriptionTier {
  free
  premium
}

enum BillingEventType {
  subscription_created
  subscription_renewed
  subscription_cancelled
  payment_succeeded
  payment_failed
  refund_issued
}

enum BillingStatus {
  pending
  succeeded
  failed
  refunded
}

enum UsageMetricType {
  esg_calculation
  monte_carlo_simulation
  goal_probability
  scenario_analysis
  portfolio_rebalance
  api_request
}
```

**3.2 Subscription Guard**
```typescript
// NEW: /apps/api/src/core/auth/guards/subscription.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PaymentRequiredException, SubscriptionExpiredException } from '../exceptions';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.get<SubscriptionTier>(
      'tier',
      context.getHandler()
    );

    if (!requiredTier) {
      return true;  // No tier requirement
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has required tier
    if (user.subscriptionTier === 'free' && requiredTier === 'premium') {
      throw new PaymentRequiredException(
        'This feature requires a Premium subscription. Upgrade at /billing/upgrade'
      );
    }

    // Check subscription expiration
    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
      throw new SubscriptionExpiredException(
        'Your subscription has expired. Renew at /billing/renew'
      );
    }

    return true;
  }
}
```

**3.3 Tier Decorator**
```typescript
// NEW: /apps/api/src/core/auth/decorators/requires-tier.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';

export const TIER_KEY = 'tier';
export const RequiresTier = (tier: SubscriptionTier) => SetMetadata(TIER_KEY, tier);

// Convenience aliases
export const RequiresPremium = () => RequiresTier('premium');
```

**3.4 Stripe Integration Service**
```typescript
// NEW: /apps/api/src/modules/billing/stripe.service.ts

import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId },
    });
    return customer.id;
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
    return session.url;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  async constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
```

**3.5 Billing Service**
```typescript
// NEW: /apps/api/src/modules/billing/billing.service.ts

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private audit: AuditService
  ) {}

  async upgradeToPremium(userId: string): Promise<{ checkoutUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Create Stripe customer if doesn't exist
    if (!user.stripeCustomerId) {
      const customerId = await this.stripe.createCustomer(userId, user.email);
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
      user.stripeCustomerId = customerId;
    }

    // Create checkout session
    const checkoutUrl = await this.stripe.createCheckoutSession({
      customerId: user.stripeCustomerId,
      priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
      successUrl: `${process.env.WEB_URL}/billing/success`,
      cancelUrl: `${process.env.WEB_URL}/billing/cancel`,
    });

    await this.audit.log({
      userId,
      action: 'BILLING_UPGRADE_INITIATED',
      severity: 'medium',
    });

    return { checkoutUrl };
  }

  async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'premium',
        subscriptionStartedAt: new Date(subscription.current_period_start * 1000),
        subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
        stripeSubscriptionId: subscription.id,
      },
    });

    await this.prisma.billingEvent.create({
      data: {
        userId: user.id,
        type: 'subscription_created',
        amount: subscription.items.data[0].price.unit_amount / 100,
        currency: subscription.currency.toUpperCase() as Currency,
        status: 'succeeded',
        stripeEventId: event.id,
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'SUBSCRIPTION_ACTIVATED',
      severity: 'high',
      metadata: { tier: 'premium' },
    });
  }

  async recordUsage(userId: string, metricType: UsageMetricType): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.usageMetric.upsert({
      where: {
        userId_metricType_date: {
          userId,
          metricType,
          date: today,
        },
      },
      create: {
        userId,
        metricType,
        date: today,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });
  }

  async checkUsageLimit(userId: string, metricType: UsageMetricType): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Premium users have unlimited usage
    if (user.subscriptionTier === 'premium') {
      return true;
    }

    // Free tier limits
    const limits = {
      esg_calculation: 10,
      monte_carlo_simulation: 3,
      goal_probability: 3,
      scenario_analysis: 1,
      portfolio_rebalance: 0,  // Premium only
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.usageMetric.findUnique({
      where: {
        userId_metricType_date: {
          userId,
          metricType,
          date: today,
        },
      },
    });

    const currentCount = usage?.count || 0;
    return currentCount < limits[metricType];
  }
}
```

**3.6 Usage Tracking Interceptor**
```typescript
// NEW: /apps/api/src/core/interceptors/usage-tracking.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BillingService } from '../../modules/billing/billing.service';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private billing: BillingService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metricType = this.reflector.get<UsageMetricType>(
      'usage_metric',
      context.getHandler()
    );

    if (!metricType) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;

        if (userId) {
          await this.billing.recordUsage(userId, metricType);
        }
      })
    );
  }
}
```

**3.7 Webhook Handler**
```typescript
// NEW: /apps/api/src/modules/billing/billing.controller.ts

@Controller('billing')
export class BillingController {
  constructor(
    private billing: BillingService,
    private stripe: StripeService
  ) {}

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeToPremium(@User() user) {
    return this.billing.upgradeToPremium(user.id);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    const event = this.stripe.constructWebhookEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'customer.subscription.created':
        await this.billing.handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        await this.billing.handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await this.billing.handleSubscriptionCancelled(event);
        break;
      case 'invoice.payment_succeeded':
        await this.billing.handlePaymentSucceeded(event);
        break;
      case 'invoice.payment_failed':
        await this.billing.handlePaymentFailed(event);
        break;
    }

    return { received: true };
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@User() user) {
    return this.billing.getUserUsage(user.id);
  }
}
```

**3.8 Example Usage in Controllers**
```typescript
// MODIFY: /apps/api/src/modules/simulations/simulations.controller.ts

@Controller('simulations')
@UseGuards(JwtAuthGuard)
export class SimulationsController {

  @RequiresPremium()  // ← Tier gate
  @TrackUsage('monte_carlo_simulation')  // ← Usage tracking
  @Post('retirement')
  async simulateRetirement(@Body() dto: RetirementSimulationDto) {
    return this.simulationService.simulateRetirement(dto);
  }

  @RequiresPremium()
  @TrackUsage('goal_probability')
  @Post('goal/:goalId/probability')
  async calculateGoalProbability(@Param('goalId') goalId: string) {
    return this.simulationService.calculateGoalProbability(goalId);
  }
}

// MODIFY: /apps/api/src/modules/esg/esg.controller.ts

@Controller('esg')
@UseGuards(JwtAuthGuard)
export class ESGController {

  @UseGuards(UsageLimitGuard)  // ← Check free tier limit
  @TrackUsage('esg_calculation')
  @Get(':spaceId/portfolio')
  async getPortfolioESG(@Param('spaceId') spaceId: string) {
    return this.esgService.analyzePortfolio(spaceId);
  }
}
```

**Environment Variables:**
```env
# NEW: .env additions
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
WEB_URL=https://app.dhanam.com
```

**Frontend Components:**
```typescript
// NEW: /apps/web/src/components/billing/pricing-table.tsx
// NEW: /apps/web/src/components/billing/upgrade-modal.tsx
// NEW: /apps/web/src/components/billing/usage-dashboard.tsx
// NEW: /apps/web/src/pages/billing/success.tsx
// NEW: /apps/web/src/pages/billing/cancel.tsx
```

**Milestones:**
- Week 1: Schema design + migration
- Week 2: Stripe integration service + tests
- Week 3: Billing service + webhook handlers
- Week 4: Subscription guard + decorators
- Week 5: Usage tracking + limits
- Week 6: Frontend pricing page + checkout flow
- Week 7: Usage dashboard + analytics
- Week 8: E2E testing + production deployment

---

## Implementation Roadmap

### MVP Timeline: 24-32 Weeks (6-8 Months)

#### **Quarter 1: Foundation (Weeks 1-12)**

**Weeks 1-3: Subscription Infrastructure**
- ✅ Add subscription schema to Prisma
- ✅ Build Stripe integration service
- ✅ Implement subscription guard + decorators
- ✅ Create webhook handlers
- ✅ Frontend pricing page + checkout flow
- **Deliverable:** Users can upgrade to Premium

**Weeks 4-6: Goal Tracking System**
- ✅ Add Goal + GoalAllocation schemas
- ✅ Build goal management service
- ✅ Implement progress calculation
- ✅ Create goal API endpoints
- ✅ Frontend goal dashboard
- **Deliverable:** Users can create and track financial goals

**Weeks 7-9: Statistical Foundation**
- ✅ Add statistical library (jStat)
- ✅ Build statistical utility functions
- ✅ Implement basic Monte Carlo engine
- ✅ Unit tests for all statistical functions
- **Deliverable:** Stochastic simulation capability

**Weeks 10-12: Retirement Simulator (Premium Feature)**
- ✅ Build retirement projection service
- ✅ Integrate with Monte Carlo engine
- ✅ Create probability-of-success calculations
- ✅ Tier-gate endpoints (`@RequiresPremium()`)
- ✅ Frontend retirement calculator UI
- **Deliverable:** First premium differentiator live

---

#### **Quarter 2: Family Office Features (Weeks 13-24)**

**Weeks 13-16: Household Infrastructure**
- ✅ Add Household + HouseholdMember schemas
- ✅ Extend User model (dateOfBirth)
- ✅ Extend Space model (householdId)
- ✅ Build household management service
- ✅ Create household API endpoints
- ✅ Data migration for existing users
- **Deliverable:** Multi-generational household support

**Weeks 17-20: Advanced Goal Features**
- ✅ Household-level goals
- ✅ Goal-to-household member mapping
- ✅ Fractional asset allocation UI
- ✅ Goal prioritization
- ✅ Progress tracking with projections
- **Deliverable:** Family-wide goal planning

**Weeks 21-24: Scenario Analysis (Premium)**
- ✅ Build scenario analysis framework
- ✅ Implement predefined scenarios (job loss, market crash, etc.)
- ✅ Create stress testing API
- ✅ Frontend scenario comparison UI
- ✅ Tier-gate features
- **Deliverable:** Second premium differentiator

---

#### **Quarter 3: Income Smoothing & Estate Planning (Weeks 25-32)**

**Weeks 25-28: Income Irregularity Detection**
- ✅ Extend rules engine for pattern detection
- ✅ Build income regularity scoring
- ✅ Implement "safe-to-spend" algorithm
- ✅ Enhance cashflow forecast with confidence intervals
- ✅ Frontend income analysis dashboard
- **Deliverable:** Gig economy user support

**Weeks 29-32: Estate Planning MVP (Premium)**
- ✅ Add Will + BeneficiaryDesignation schemas
- ✅ Build estate planning service (legal disclaimer required)
- ✅ Create beneficiary assignment UI
- ✅ Implement document vault (client-side encryption)
- ✅ Tier-gate all estate features
- ✅ Legal review + compliance check
- **Deliverable:** Digital Will feature (beta)

---

## Success Metrics & KPIs

### Product Metrics
- **Free → Premium Conversion:** Target 5-10% (industry standard: 2-5%)
- **Goal Adoption:** 70% of users create at least 1 goal within 30 days
- **Simulation Usage:** 40% of premium users run Monte Carlo simulations
- **Household Adoption:** 25% of users create multi-member households

### Technical Metrics
- **Page Load Time:** <1.5s p95 (maintain current performance)
- **Simulation Speed:** Monte Carlo (10k iterations) <3s
- **API Response Time:** <200ms p95 for non-simulation endpoints
- **Uptime:** 99.9% (current target)

### Business Metrics
- **MRR Growth:** $10k MRR by Month 6
- **Churn Rate:** <5% monthly
- **LTV:CAC Ratio:** >3:1
- **Premium Feature Usage:** >60% of premium users use ≥2 premium features

---

## Risk Assessment

### HIGH RISK ⚠️

**1. Estate Planning Legal Compliance**
- **Risk:** Beneficiary designations may have legal implications
- **Mitigation:** Add disclaimer ("not legal advice"), require legal counsel review, beta test with limited users

**2. Stochastic Model Accuracy**
- **Risk:** Monte Carlo projections may be misleading if assumptions are wrong
- **Mitigation:** Transparent methodology page, show confidence intervals, disclaimer about historical data limitations

**3. Data Migration Complexity**
- **Risk:** Schema changes for Household model may corrupt existing data
- **Mitigation:** Staged rollout, comprehensive backup strategy, backward compatibility testing

### MEDIUM RISK ⚠️

**1. Stripe Integration Failures**
- **Risk:** Webhook delays or failures may desync subscription status
- **Mitigation:** Idempotent webhook handlers, retry logic, manual reconciliation tool

**2. Performance Degradation**
- **Risk:** Monte Carlo simulations may slow down API
- **Mitigation:** Background job processing (BullMQ), caching, progressive results

**3. Feature Complexity**
- **Risk:** Users may not understand probabilistic projections
- **Mitigation:** Educational content, tooltips, example scenarios, video tutorials

### LOW RISK ✅

**1. Schema Extensions**
- **Risk:** Minimal (additive changes only)
- **Mitigation:** Well-tested migrations

**2. Provider Integrations**
- **Risk:** Read-only integrations are stable
- **Mitigation:** No changes needed

---

## Go/No-Go Decision Criteria

### ✅ **GO IF:**

1. **Market Validation:**
   - 10+ UHNW families/mass affluent users validated the need
   - Willing to pay $20-50/month for autonomous features
   - Current personal/business focus shows limited traction

2. **Team Capacity:**
   - ≥5 engineers available for 6-8 months
   - Legal counsel available for estate planning review
   - Product manager to own feature prioritization

3. **Technical Readiness:**
   - Current test coverage >70%
   - CI/CD pipeline stable
   - Monitoring/alerting in place

4. **Business Model:**
   - Premium pricing validated ($29/mo benchmark: Monarch Money)
   - Unit economics work (LTV:CAC >3:1 projected)
   - Funding secured for 12+ months runway

### ❌ **NO-GO IF:**

1. **Market Uncertainty:**
   - <5 validated prospects for family office features
   - No willingness to pay for premium features
   - Current budget tracking product is growing steadily

2. **Resource Constraints:**
   - <3 engineers available
   - No legal counsel for compliance review
   - High technical debt in current codebase

3. **Legal Risk:**
   - Cannot secure legal review for estate planning
   - Regulatory compliance cost >20% of budget
   - No insurance for financial advice liability

4. **Technical Blockers:**
   - Current architecture cannot support schema changes
   - Performance issues with existing features
   - Test coverage <50%

---

## Alternative: Hybrid Approach

**If full pivot is too risky, consider phased rollout:**

### **Phase 1: Add Goal Tracking (Low Risk, Medium Value)**
- 6-8 weeks development
- No legal risk
- Validates user interest in planning features
- Can be offered free or freemium

### **Phase 2: Add Retirement Simulator (Medium Risk, High Value)**
- 4-6 weeks development
- Premium feature ($19/mo)
- Validates willingness to pay
- No legal compliance needed (disclaimer only)

### **Phase 3: Decide on Full Pivot**
- If Phases 1-2 show strong adoption + revenue → proceed with Household + Estate Planning
- If lukewarm response → stay focused on budget tracking + basic goals

---

## Conclusion

**Current Codebase State:**
- ✅ **Zero Red Ocean debt** (no day trading/paper trading to remove)
- ✅ **Strong Blue Ocean foundation** (multi-tenant, security, ESG scoring)
- ❌ **Missing critical pillars** (stochastic modeling, household support, tiering)

**Pivot Feasibility:**
- **Technical:** HIGH (architecture supports extensions)
- **Timeline:** 24-32 weeks for MVP
- **Risk:** MEDIUM-HIGH (legal compliance for estate planning)
- **Effort:** HIGH (8-10 new models, 3 major subsystems)

**Recommendation:**
1. **Validate demand first** (10+ prospect interviews)
2. **Start with low-risk Phase 1** (Goal Tracking + Subscription Infrastructure)
3. **Test monetization** (Retirement Simulator premium feature)
4. **Decision point at Month 3:** Full pivot or stay course based on user response

**The codebase is ready.** The question is whether the **market** is ready for an autonomous family office product targeted at mass affluent LATAM users.

---

**Files Created:**
- `/home/user/dhanam/docs/audits/BLUE_OCEAN_PIVOT_ROADMAP.md` (this file)

**Next Steps:**
1. Share with stakeholders for approval
2. Conduct 10+ user interviews to validate family office demand
3. If validated → Begin Quarter 1 implementation (Subscription + Goals)
4. If uncertain → Implement hybrid Phase 1 only (Goal Tracking)
