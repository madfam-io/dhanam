# CLAUDE.md

> **See also:** [`llms.txt`](llms.txt) for a concise project overview with links, and [`llms-full.txt`](llms-full.txt) for expanded inlined content. For machine-readable metadata, see [`tools/agent-manifest.json`](tools/agent-manifest.json).

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL: MADFAM Ecosystem Dependencies

**READ THIS FIRST before any auth, deployment, or infrastructure work.**

### Authentication & Authorization: JANUA

Dhanam uses **Janua** (MADFAM's own SSO platform) for ALL authentication.

- **OIDC Issuer**: `https://auth.madfam.io`
- **Janua API**: `https://api.janua.dev`
- **DO NOT** implement custom auth, use third-party providers (Auth0, Clerk, etc.), or bypass Janua.

### Deployment & DevOps: ENCLII

Dhanam uses **Enclii** (MADFAM's own deployment platform) for ALL production deployments.

- **Config file**: `.enclii.yml` (project root)
- **Domain manifest**: `enclii.yaml` (project root) — declares domains for auto-provisioning
- **Auto-deploy**: Enabled on `main` branch
- **Flow**: Push to main → Enclii detects → Builds → Deploys to bare metal K8s
- On push to main, Enclii's webhook reads `enclii.yaml` and auto-provisions DNS + tunnel routes
- Only dhanam-web domains listed (dhan.am, www, app); api/admin domains managed via static tunnel config

**To deploy**: Simply push to main. Enclii handles everything automatically.

**GitHub Actions Workflows** (`.github/workflows/`):

- `ci.yml`, `lint.yml`, `test-coverage.yml` - CI/CD quality gates (run on all PRs)
- `check-migrations.yml` - Database migration validation
- `publish-packages.yml` - Tag-triggered npm publish to npm.madfam.io (manual dispatch with dry-run)
- `deploy-enclii.yml`, `deploy-k8s.yml`, `deploy-web-k8s.yml` - Manual/fallback deployment options
- `deploy-staging.yml` - Auto-deploy staging on push to main
- Primary production deployment is via **Enclii auto-deploy**, not GitHub Actions

### Production URLs

- Web: `https://app.dhan.am`
- Admin: `https://admin.dhan.am` (standalone admin app)
- API: `https://api.dhan.am`

---

## Project Overview

This is the Dhanam Ledger project - a comprehensive budget and wealth tracking application that unifies personal and business financial management with ESG crypto insights. It targets LATAM-first users with multilingual support (English/Spanish/Portuguese).

**Core Features:**

- Personal and business budgeting with category caps and rules-based auto-categorization
- AI-powered transaction categorization with machine learning and user correction loop
- Wealth tracking with net worth calculations and asset allocation views
- DeFi/Web3 portfolio tracking via Zapper API (Uniswap, Aave, Compound, Curve, Lido, and more)
- ESG scoring for crypto assets using the Dhanam package
- Read-only financial data integration (Belvo for MX, Plaid for US, Bitso for crypto)
- 60-day cashflow forecasting with weekly granularity
- 10-30 year long-term projections with Monte Carlo simulation
- Life Beat dead man's switch for estate planning with executor access
- Zillow integration for automated real estate valuations
- Yours/Mine/Ours household ownership views
- Document storage via Cloudflare R2 for manual asset attachments
- Transaction tagging with bulk assign/remove operations
- Transaction review status tracking (reviewed/unreviewed workflow)
- Merchant management with rename and merge operations
- Advanced analytics: statistics, annual trends, calendar view, flexible ad-hoc query engine (all with optional `budgetId` filter for multi-budget isolation)
- LunchMoney data migration with idempotent multi-budget import (one run per LM API token, shared accounts deduplicated)
- TOTP 2FA security with JWT + rotating refresh tokens

## Architecture

**Monorepo Structure (Turborepo + pnpm):**

```
apps/
├─ admin/         # Next.js 15 standalone admin dashboard (port 3400)
├─ api/           # NestJS (Fastify) backend (port 4010)
├─ mobile/        # React Native + Expo app
└─ web/           # Next.js 15 user dashboard (port 3040)
packages/
├─ billing-sdk/   # Typed client for Dhanam billing API (@dhanam/billing-sdk)
├─ config/        # ESLint, tsconfig, prettier presets
├─ esg/           # Dhanam ESG adapters
├─ shared/        # Shared TS utils, types, i18n
├─ simulations/   # Monte Carlo & scenario analysis engines
└─ ui/            # Reusable UI components (shadcn-ui)
infra/
├─ docker/        # Local dev docker-compose
├─ k8s/production/  # K8s manifests (kustomize)
├─ k8s/staging/     # Staging overlay (1 replica, :main tags)
├─ k8s/monitoring/  # ServiceMonitor, PrometheusRule, Alertmanager, Grafana dashboards
└─ k8s/argocd/      # ArgoCD Application CRD for GitOps
```

**Tech Stack:**

- Frontend: Next.js (React), React Native + Expo
- Backend: NestJS (Fastify), Prisma + PostgreSQL, Redis (BullMQ)
- Infrastructure: Enclii (bare metal K8s)
- Analytics: PostHog
- ESG: Dhanam package integration

### Billing Module (`apps/api/src/modules/billing/`)

The billing module uses a facade pattern with focused sub-services:

```
billing/
├─ billing.service.ts              # Facade — thin delegation layer (preserves all public method signatures)
├─ billing.module.ts               # Registers all services, guards, interceptors
├─ billing.controller.ts           # REST endpoints
├─ stripe.service.ts               # Low-level Stripe SDK wrapper
├─ janua-billing.service.ts        # Janua multi-provider billing integration
├─ services/
│  ├─ usage-tracking.service.ts    # Daily usage metering, tier-based feature/resource limits
│  ├─ subscription-lifecycle.service.ts  # Checkout creation, portal, plan changes, Janua role sync
│  ├─ webhook-processor.service.ts # Inbound Stripe + Janua webhook event handlers
│  ├─ payment-router.service.ts    # Hybrid routing (Stripe MX + Paddle)
│  ├─ stripe-mx.service.ts         # Stripe Mexico (MXN, OXXO, SPEI)
│  ├─ paddle.service.ts            # Paddle MoR (global tax compliance)
│  ├─ customer-federation.service.ts # PhyneCRM federation
│  ├─ price-resolver.service.ts    # Price ID resolution
│  ├─ pricing-engine.service.ts    # Dynamic pricing logic
│  └─ trial.service.ts             # Trial lifecycle management
├─ jobs/
│  ├─ reconciliation.job.ts        # Nightly Stripe-vs-local-DB reconciliation (3 AM UTC cron)
│  └─ subscription-lifecycle.job.ts # Hourly trial/promo expiration handler
├─ guards/                         # SubscriptionGuard, UsageLimitGuard, SpaceLimitGuard, FeatureGateGuard, etc.
└─ interceptors/                   # UsageTrackingInterceptor
```

**Key design decisions:**

- `BillingService` is a backward-compatible facade: all existing callers (controllers, guards, interceptors, external services like SimulationsService) continue to work without changes
- The facade constructor accepts `@Optional()` sub-service params for DI but can construct them from raw dependencies for test compatibility
- `ReconciliationJob` creates `BillingEvent` records with type `reconciliation_mismatch` and status `flagged` for manual review
- `PLAN_TIER_MAP` in `subscription-lifecycle.service.ts` maps plan slugs (e.g. `pro_yearly`) to tier names (e.g. `pro`)

**Ecosystem payment receiver (`madfam-events.controller.ts`):**

- `POST /v1/billing/madfam-events` — inbound for `@routecraft/payments::emitPaymentSucceeded` and any future signed MADFAM event producer
- Signature: `x-madfam-signature: t=<unix-seconds>,v1=<hex-hmac-sha256>` over `"${ts}.${raw-body}"`, secret `MADFAM_EVENTS_WEBHOOK_SECRET`, 5-minute replay window. Verifier is pure + unit-tested at `madfam-events.sig.ts` / `madfam-events.sig.spec.ts` (18 tests)
- Idempotent — dedup via `BillingEvent.stripeEventId` unique constraint on the incoming `event_id`
- `organization_id` → Dhanam user resolution is best-effort via `Space.ownerId`; unknown orgs return `status: "accepted_unlinked"` so first-touch events don't fail
- Probe lookup: `GET /v1/probe/billing-events/:eventId` — used by `madfam-revenue-loop-probe` to confirm the ledger row landed (per `autoswarm-office/packages/revenue-loop-probe/README.md`)

### Referral Module (`apps/api/src/modules/referral/`)

Ecosystem-wide referral system. Dhanam is the source of truth for referral codes, lifecycle tracking, and reward management across all MADFAM products.

```
referral/
├─ referral.module.ts           # NestJS module registration
├─ referral.controller.ts       # 9 endpoints (2 public, 6 JWT, 1 HMAC)
├─ referral.service.ts          # Core: code generation, validation, application, event reporting
├─ referral-reward.service.ts   # Reward calculation + application (Stripe + credits)
├─ ambassador.service.ts        # Tier management (none→bronze→silver→gold→platinum)
├─ dto/                         # create-code, apply-referral, referral-event DTOs
├─ guards/referral-hmac.guard.ts # HMAC-SHA256 for service-to-service events
└─ jobs/
   ├─ referral-reward.job.ts    # Every 15 min: process pending rewards
   └─ referral-expiry.job.ts    # Daily 4 AM: expire 90-day unused codes
```

**Prisma models**: `ReferralCode`, `Referral`, `ReferralReward`, `AmbassadorProfile`

**Code format**: `{PREFIX}-{8 hex chars}` — KRF (Karafiel), DHN (Dhanam), SLV (Selva), MADFAM (generic)

**Rewards on conversion**: Referrer gets 1 free month + 50 credits; referred user gets 50 credits

**Ambassador tiers**: 3→bronze (5% off), 5→silver (10%), 10→gold (15%), 25→platinum (20%)

**Anti-abuse**: Self-referral prevention, same-org check, disposable email blocklist, 90-day code expiry

**SDK**: `@dhanam/billing-sdk` exports `DhanamReferralClient` (JWT) and `DhanamReferralReporter` (HMAC) for consumer products

## Development Commands

When the codebase is implemented, use these commands:

```bash
# Local infrastructure
pnpm dev:infra    # Start docker compose (postgres, redis, mailhog)
pnpm db:push      # Prisma schema sync
pnpm db:seed      # Seed demo data (requires DEMO_USER_PASSWORD, ADMIN_PASSWORD env vars)

# Development servers
pnpm dev:api      # Backend at http://localhost:4010
pnpm dev:web      # Web dashboard at http://localhost:3040
pnpm dev:admin    # Admin dashboard at http://localhost:3400
pnpm dev:mobile   # Expo dev client

# Quality checks
pnpm lint         # ESLint across monorepo
pnpm test         # Run test suites
turbo lint        # Turborepo lint
turbo test        # Turborepo test
```

## Key Implementation Guidelines

**Security First:**

- All provider tokens (Belvo, Plaid, Bitso) must be encrypted at rest using AES-256-GCM
- Implement Argon2id for password hashing with breach checks
- Use short-lived JWT (≤15m) with rotating refresh tokens (≤30d)
- TOTP 2FA required for admin operations, optional for users
- Webhook HMAC verification for all provider integrations

**Data Architecture:**

- Multi-tenant via Spaces (Personal + Business entities)
- Normalize all financial data into common schema regardless of provider
- Daily valuation snapshots for wealth tracking trends
- Rules engine for transaction auto-categorization
- ESG scores computed via Dhanam package and cached

**Localization:**

- Default Spanish (ES) for Mexico region, English elsewhere, Portuguese (pt-BR) available
- Currency formatting for MXN/USD/EUR/CAD with Banxico FX rates
- All user-facing text must support i18n via packages/shared/i18n

**Performance Requirements:**

- Page loads <1.5s p95
- Manual account refresh <15s
- Bulk transaction operations (100+ items) <2s p95
- Background sync every hour via BullMQ queues

**Provider Integration Patterns:**

- **Belvo** (Mexico): OAuth flow → encrypted token storage → 90+ day transaction history
- **Plaid** (US): Link flow → webhook updates → balance/transaction sync
- **MX** (US/Canada): Aggregation API → multi-institution support
- **Finicity** (US): Open Banking API → Mastercard-backed data access
- **Bitso** (crypto exchange): API integration → real-time crypto positions
- **Blockchain** (on-chain): ETH/BTC/xPub address tracking (non-custodial, no secrets)
- **Zapper** (DeFi): API integration → protocol positions across 7 networks (Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC)
- **Zillow** (Real Estate): Property valuation API → automated Zestimate updates for manual assets
- **Collectibles** (sneakers/watches/art/wine/coins/cards/cars): Adapter-based valuation → sneaks-api (free, sneakers), Artsy (art, OAuth2), Hagerty (classic cars, API key), KicksDB (sneakers); scaffolded for WatchCharts, Wine-Searcher, PCGS, PSA

The provider orchestrator (`apps/api/src/modules/providers/orchestrator/`) handles failover and multi-provider redundancy.

## Testing Strategy

**API (NestJS):**

- 4100+ unit tests across 165+ test suites (98%+ coverage)
- Billing module tests cover the facade (`billing.service.spec.ts`) and all three extracted sub-services (`usage-tracking.service.spec.ts`, `subscription-lifecycle.service.spec.ts`, `webhook-processor.service.spec.ts`) plus the reconciliation job (`reconciliation.job.spec.ts`)
- E2E journey tests: core value loop, subscription upgrade, admin operations, provider sync, billing webhooks, estate planning, households
- Contract tests for Stripe, Plaid, and Belvo webhook schemas (Zod validation)
- Drip campaign task tests (15 cases: send/skip/idempotency/batch/error-resilience)

**Web (Next.js):**

- 46+ page-level smoke tests covering all dashboard, legal, auth, billing, analytics, and feature pages
- 25+ component tests for forms, layouts, billing, ESG, and onboarding
- Playwright E2E: auth flows, dashboard navigation, core user journey, upgrade journey, billing, subscription pricing
- Accessibility tests (WCAG AA) via @axe-core/playwright on all key pages
- Visual regression tests via Playwright screenshot comparison

**Admin (Next.js):**

- 11 component tests + 11 page tests covering all admin dashboard pages
- Jest + jsdom with same patterns as web app
- Playwright E2E: 34 test cases across dashboard, compliance/GDPR, queue management, system health

**Mobile (React Native):**

- 6 existing test suites with jest-expo

**CI Pipeline (`.github/workflows/ci.yml`):**

- 7 parallel test jobs: API unit, web unit, mobile unit, admin unit, contract tests, Playwright E2E (web), Playwright E2E (admin)
- Playwright runs on main branch and `run-e2e` labeled PRs
- Contract tests run on all PRs (no services needed)

## Database Schema Highlights

Key entities and relationships:

- Users → Spaces (1:many) → Accounts → Transactions
- Transactions ↔ Tags (many:many via TransactionTag)
- Spaces → Tags (1:many)
- Spaces → Budgets → Categories (with rules)
- Categories have `isIncome`, `excludeFromBudget`, `excludeFromTotals` flags and `groupName`/`sortOrder` for hierarchy
- Transactions have `excludeFromTotals` flag for per-transaction exclusion from analytics
- Analytics queries respect exclusion flags at both category and transaction level
- Budget periods: MONTHLY, QUARTERLY, ANNUAL; Budget has optional `metadata` JSON (used for LunchMoney origin tracking)
- Daily valuation snapshots for wealth trends
- ESG asset scores linked to crypto accounts
- Audit logs for all sensitive operations

## ESG Integration

Uses the Dhanam package (https://github.com/aldoruizluna/Dhanam) for:

- Crypto asset ESG composite scoring (E/S/G components)
- Environmental impact metrics (energy intensity estimates)
- Transparent methodology page with sources and limitations
- Future expansion to equities/ETF ESG scoring

## Admin & Analytics

**PostHog Events:** sign_up, onboarding_complete, connect_initiated, connect_success, sync_success, budget_created, rule_created, txn_categorized, alert_fired, view_net_worth, export_data, drip_email_sent, onboarding_step_completed, onboarding_step_skipped, connect_failed, upgrade_initiated, subscription_created, subscription_cancelled, subscription_renewed, payment_failed, cotiza_payment_succeeded, cotiza_subscription_created, cotiza_subscription_updated, cotiza_subscription_cancelled

**Admin Panel (SRE Ops Center):** Standalone app at `apps/admin/` (production: `admin.dhan.am`). Also accessible via `apps/web/(admin)/admin/` in development (redirects to standalone app in production). Includes system health, queue management, provider dashboards, compliance (GDPR export/delete, retention), deployment status, billing events, user/space management with audit trails.

## Monitoring & Observability

- **Prometheus**: ServiceMonitor scrapes `/metrics` on port 4300; PrometheusRule CRD wraps alert rules
- **Alertmanager**: Critical alerts (1h repeat), warnings (12h repeat); receivers for Slack/PagerDuty
- **Grafana**: Auto-provisioned dashboards for request rate, error rate, p95 latency, auth failures, queue depth, DB/Redis health, pod restarts
- **Staging**: `infra/k8s/staging/` — 1 replica, `:main` image tags, auto-deployed on push to main
- **ArgoCD**: GitOps sync from `infra/k8s/production/` with auto-sync, prune, and self-heal

## Environment Setup

Each app requires environment configuration:

- API: Database, Redis, JWT keys, provider credentials (Belvo/Plaid/Bitso), Banxico API
- Web: API URL, PostHog key, default locale
- Mobile: Same as web for Expo public variables

**Seed script env vars (required — no fallbacks):**

- `DEMO_USER_PASSWORD`: Password for demo users (carlos, patricia, diego)
- `ADMIN_PASSWORD`: Password for platform admin
- `MADFAM_ADMIN_PASSWORD`: Password for MADFAM internal finance admin (seed-madfam.ts)

Seed scripts will throw an error if these are not set. Generate with `openssl rand -base64 24`.

The application targets 99.9% availability with RTO 4h and daily backups.

## Stripe MX + SPEI (T1.1 — MXN flywheel roadmap)

Dhanam is the billing boundary for the MADFAM ecosystem. T1.1 adds a native
Mexico payment path backed by Stripe's Mexican entity: MXN-denominated card
charges + SPEI bank transfers via the `customer_balance` payment method.
Refunds propagate to Karafiel as CFDI egresos (T1.2, already merged).

### Scope

- `POST /v1/billing/stripe-mx/spei-payment-intent` (auth required) creates
  an MXN PaymentIntent with SPEI bank-transfer instructions (CLABE,
  reference, expiry). Idempotent on caller-supplied `paymentRequestId`.
- `POST /v1/billing/webhooks/stripe` is the Stripe-facing webhook URL.
  Signature-verified (`STRIPE_MX_WEBHOOK_SECRET`), feature-flagged, and
  idempotent on Stripe event id. Handles `payment_intent.succeeded`,
  `payment_intent.payment_failed`, `charge.refunded`.
- Inbound Stripe events are transformed to Dhanam's canonical outbound
  envelope (`payment.succeeded` / `payment.failed` / `payment.refunded`)
  and fanned out to `PRODUCT_WEBHOOK_URLS` (HMAC-SHA256 via
  `DHANAM_WEBHOOK_SECRET`, matches the existing `notifyProductWebhooks`
  contract).

### Envelope contract (matches Karafiel `DhanamPaymentDataSerializer`)

```json
{
  "type": "payment.succeeded" | "payment.failed" | "payment.refunded",
  "id": "<uuid v4>",
  "timestamp": "ISO 8601",
  "data": {
    "customer_id":     "<dhanam user id, resolved from metadata.dhanam_user_id → User.stripeCustomerId → fallback to stripe customer id>",
    "subscription_id": "<stripe sub id from metadata.subscription_id, may be empty>",
    "payment_id":      "<stripe PaymentIntent id (or refund id for payment.refunded)>",
    "amount":          "199.00",
    "amount_minor":    19900,
    "currency":        "MXN",
    "failure_reason":  "...",           // payment.failed only
    "failure_code":    "...",           // payment.failed only
    "refunded_payment_id": "pi_...",    // payment.refunded only
    "original_payment_id": "pi_..."     // payment.refunded only
  }
}
```

### Environment variables

| Variable                    | Required             | Description                                                                                                                                                         |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_MX_SECRET_KEY`      | Yes                  | Stripe secret key (live or test). Injected from `dhanam-secrets`.                                                                                                   |
| `STRIPE_MX_WEBHOOK_SECRET`  | Yes                  | Stripe webhook signing secret. Injected from `dhanam-secrets`.                                                                                                      |
| `STRIPE_MX_PUBLISHABLE_KEY` | Yes (client)         | For frontend Elements / Checkout.                                                                                                                                   |
| `FEATURE_STRIPE_MXN_LIVE`   | No (default `false`) | When `false`, livemode Stripe events are rejected 200-ACK with a warning log. Test-mode events always flow. Flip to `true` only after a staging smoke on live keys. |
| `PRODUCT_WEBHOOK_URLS`      | Yes for relay        | CSV: `karafiel:https://api.karafiel.mx/api/v1/webhooks/dhanam,tezca:...`. Re-used from `notifyProductWebhooks`.                                                     |
| `DHANAM_WEBHOOK_SECRET`     | Yes for relay        | HMAC-SHA256 signing secret. Same value as Karafiel's `DHANAM_BILLING_WEBHOOK_SECRET`.                                                                               |

### Operator runbook

1. Confirm Mexico is enabled on the existing Stripe account at
   `innovacionesmadfam@madfam.io` and SPEI is available as a payment
   method (Dashboard → Payments → Payment methods).
2. Set `STRIPE_MX_SECRET_KEY` (test first), `STRIPE_MX_WEBHOOK_SECRET`, and
   `STRIPE_MX_PUBLISHABLE_KEY` in `dhanam-secrets` (K8s Secret).
3. In the Stripe Dashboard, register the webhook endpoint at
   `https://api.dhan.am/v1/billing/webhooks/stripe` subscribed to
   `payment_intent.succeeded`, `payment_intent.payment_failed`, and
   `charge.refunded`. Copy the signing secret into
   `STRIPE_MX_WEBHOOK_SECRET`.
4. Set `FEATURE_STRIPE_MXN_LIVE=true` in the prod ConfigMap only after
   the test-key end-to-end flow has been validated (Stripe test SPEI →
   Dhanam webhook → Karafiel CFDI emitted).
5. RFC 0003 Gotcha #1: first MXN 10K of live receipts settle T+3 via
   Citibanamex → BBVA. Plan working capital accordingly.

See `apps/api/src/modules/billing/services/stripe-mx-spei-relay.service.ts`
for the transform implementation and
`apps/api/src/modules/billing/__tests__/stripe-mx-spei-relay.service.spec.ts`
for the 22-test suite covering signature, transforms, idempotency,
currency guard, and feature-flag gate.

## Known Local Dev Issues

- **Janua SDK**: Using `@janua/react-sdk@0.1.4`. PKCE exports and `useMFA`/`MFAChallenge` are now available. Auth state fix: `signIn()` parses JWT for immediate user state instead of blocking on `getCurrentUser()`. SSR safety: components loaded via `next/dynamic` + `JanuaErrorBoundary`; `SSRSafeJanuaProvider` in `providers.tsx` handles the dynamic import.
- **API CORS for local dev**: `.env` `CORS_ORIGINS` must include the web dev port (e.g. `http://localhost:3040`).
- **API PORT**: Local API runs on port from `.env` (`PORT=8500`), not 4010. Set `NEXT_PUBLIC_API_URL=http://localhost:8500/v1` for the web app.
- **Prisma migration**: After schema changes, run `npx prisma db push` against a running database before the API starts.
- **SMTP env var**: The canonical name is `SMTP_PASSWORD` (not `SMTP_PASS`). K8s mounts `SMTP_PASSWORD`, and `email.service.ts` reads it directly via `configService.get('SMTP_PASSWORD')`.
