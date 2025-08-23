# MADFAM Budget & Wealth Tracker (Codename: **Dhanam Ledger**)

> Unifies personal & business budgeting with wealth tracking and crypto ESG insights — LATAM-first, privacy-first.

<p align="center">
  <em>Status: MVP in development • Platforms: Web + iOS/Android • Regions: MX/US/EU</em>
</p>

---

## ✨ What is this?

Dhanam Ledger is a monorepo powering a **personal + business budgeting** app and a **wealth tracker** with an **ESG overlay for crypto**.

* **Two Spaces:** Personal & Business (up to 3 business spaces at MVP)
* **Connections (read‑only):** Belvo (MX), Plaid (US), Bitso + non‑custodial wallets (ETH/BTC/xPub)
* **Budgeting:** Monthly category caps, rules-based auto‑categorization, 60‑day cash‑flow forecast (weekly)
* **Wealth:** Net worth, allocation by asset class/currency, daily snapshots
* **ESG (Crypto):** Composite scores + environmental metric using the [Dhanam](https://github.com/aldoruizluna/Dhanam) package
* **Security:** Email+password, TOTP 2FA, JWT (short‑lived) + rotating refresh, backup codes
* **Localization:** English & Spanish (ES default in MX, EN elsewhere)

---

## 🧱 Monorepo Structure (Turborepo/pnpm)

```
.
├─ apps/
│  ├─ web/           # Next.js app (user dashboard)
│  ├─ mobile/        # React Native + Expo app
│  └─ api/           # NestJS (Fastify) backend
├─ packages/
│  ├─ shared/        # Shared TS utils, types, i18n messages
│  ├─ esg/           # Dhanam ESG adapters (as pkg or proxy to service)
│  ├─ ui/            # Reusable UI components (shadcn-ui, design tokens)
│  └─ config/        # ESLint, tsconfig, prettier, commitlint presets
├─ infra/
│  ├─ docker/        # docker-compose, local dev images
│  └─ terraform/     # IaC for AWS (ECS/Fargate, RDS, ElastiCache)
└─ scripts/          # DX helpers (setup, db, seed, lint-staged)
```

**Stack**

* Web: **Next.js (React)**
* Mobile: **React Native + Expo**
* Backend: **NestJS (Fastify)**, **Prisma + Postgres**, **Redis** (caching/queues with BullMQ)
* Infra: **AWS ECS/Fargate**, **Terraform**, Secrets via **AWS Secrets Manager/KMS**
* Analytics: **PostHog**

---

## 🗺️ Architecture

```mermaid
flowchart LR
  A["Web (Next.js)"] -->|"REST + JWT"| B["API (NestJS)"]
  M["Mobile (React Native)"] -->|"REST + JWT"| B
  B -->|"SQL"| D[(Postgres)]
  B -->|"Cache/Queues"| R[(Redis)]
  B <-->|"Link"| C["Belvo and Plaid"]
  B <-->|"API"| X["Bitso and Exchanges"]
  B <-->|"ESG"| E["Dhanam ESG"]
  C <--> W["Provider Webhooks"]
  W --> B
```

**Key flows**

1. Link accounts via Belvo/Plaid → store tokens encrypted (KMS) → fetch balances/txns (90d+).
2. Bitso/exchanges and non‑custodial wallets (ETH/BTC/xPub) for crypto positions.
3. Daily snapshots + ESG scores → net‑worth and allocation charts.

---

## 🚀 Getting Started (Local Dev)

### Prerequisites

* Node.js ≥ 18, pnpm ≥ 9
* Docker Desktop (for Postgres/Redis)
* OpenSSL (for JWT keys) and Git
* Expo CLI (for mobile): `npm i -g expo-cli`

### 1) Clone & install

```bash
git clone <your-repo-url> madfam-ledger
cd madfam-ledger
pnpm install
```

### 2) Environment

Create `.env` files from examples:

```
apps/api/.env            # backend
apps/web/.env.local      # web
apps/mobile/.env         # mobile
```

#### `.env` — API (example)

```ini
# Core
NODE_ENV=development
PORT=4000
LOG_LEVEL=info

# Database & Cache
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/madfam
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
JWT_PRIVATE_KEY_PATH=./keys/jwtRS256.key
JWT_PUBLIC_KEY_PATH=./keys/jwtRS256.key.pub
TOTP_ISSUER=DhanamLedger

# Analytics
POSTHOG_KEY=
POSTHOG_HOST=https://app.posthog.com

# Connectors
BELVO_CLIENT_ID=
BELVO_CLIENT_SECRET=
BELVO_ENV=sandbox

PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox

# Crypto
BITSO_API_KEY=
BITSO_API_SECRET=
# Non-custodial: no secret needed; we track public addresses / xpub

# FX
BANXICO_API_KEY=
DEFAULT_CURRENCY=MXN
DEFAULT_LOCALE=es-MX
```

#### `.env.local` — Web (example)

```ini
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_DEFAULT_LOCALE=es-MX
```

#### `.env` — Mobile (example)

```ini
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_DEFAULT_LOCALE=es-MX
```

### 3) Start local infra

```bash
pnpm dev:infra   # docker compose up -d for postgres, redis, mailhog
pnpm db:push     # prisma migrate or db sync
pnpm db:seed     # optional demo data
```

### 4) Run apps

```bash
pnpm dev:api     # http://localhost:4000/health
pnpm dev:web     # http://localhost:3000
pnpm dev:mobile  # Expo dev client
```

> OpenAPI spec is served at `http://localhost:4000/docs` (Swagger UI) once the API is running.

---

## 🔐 Security

* Password hashing: **Argon2id**; password strength + breach checks
* 2FA: **TOTP** (QR setup, backup codes)
* Tokens: short‑lived access JWT (≤15m) + rotating refresh (≤30d) with revoke list (Redis)
* Secrets: stored in **AWS Secrets Manager**; all tokens encrypted at rest (**KMS**)
* Webhooks: HMAC signature verification per provider
* PII minimization; export/delete flows (GDPR/LFPDPPP readiness)

---

## 💸 Budgeting & Transactions (MVP)

* Monthly category caps with base taxonomy + custom categories
* Rules engine: `description/merchant contains → category`
* Recurring flag drives **bill due** and **forecast**
* Forecast horizon: **60 days**, weekly granularity

---

## 📈 Wealth & ESG

* **Net Worth** = Σ assets − Σ liabilities
* Allocation by **asset class** and **currency**; daily snapshots
* **ESG (Crypto)**: composite score + environmental metric via `packages/esg` (Dhanam logic)
* ESG methodology page included in the app (transparent sources, cadence, limitations)

---

## 🌐 Internationalization & FX

* EN/ES localization (default ES in MX, EN elsewhere) via `packages/shared/i18n`
* Currency & date formatting per locale
* Banxico rates for MXN↔USD/EUR conversions (stored with valuation snapshots)

---

## 📊 Analytics

* PostHog events (MVP): `sign_up`, `onboarding_complete`, `connect_initiated`, `connect_success`, `sync_success`, `sync_fail`, `budget_created`, `rule_created`, `txn_categorized`, `alert_fired`, `view_net_worth`, `export_data`.

---

## 🧪 Testing & QA

* Unit & integration tests for auth, rules, connectors
* Contract tests for provider webhooks
* Synthetic monitors for connector health
* Seeded demo Space for manual QA

---

## 🛣️ Roadmap

**MVP (P0):** Connections (Belvo/Plaid/Bitso + wallet), budgets & rules, net worth & allocations, crypto ESG + methodology, alerts (overspend/bill due/large txn), EN/ES, admin basics, analytics, Banxico FX.

**vNext (first 90 days):** Envelopes, ML auto‑categorization, receipt OCR, accountant seat, EU data region, equities/ETF ESG, simple rebalancing suggestions, SAT/CFDI ingestion, low balance & ESG alerts.

---

## 🤝 Contributing

1. Fork & clone.
2. Create a feature branch: `feat/<short-name>`
3. Ensure lint/tests pass: `pnpm lint && pnpm test`
4. Open PR with a concise description and screenshots (if UI).

**Conventions**

* Conventional commits (`feat:`, `fix:`, `chore:` …)
* Prettier + ESLint enforced on commit (lint-staged)
* Type‑safe APIs and DTOs (NestJS + Zod/Swagger decorators)

---

## 📜 License

TBD (private during MVP). Add a license before GA.

---

## 👥 Maintainers

**Innovaciones MADFAM S.A.S. de C.V.** — Owner: **Aldo Ruiz Luna**
Primary contact: \<add email/Slack/Matrix>

---

## 📝 Appendix A — Base Categories (Draft)

**Personal:** Housing, Utilities, Groceries, Dining, Transport, Health, Subscriptions, Education, Entertainment, Savings/Investments, Taxes, Misc.
**Business:** Revenue, COGS, Payroll, Contractors, Software/SaaS, Marketing, Travel, Office, Utilities, Taxes, Fees, Misc.

---

## 📝 Appendix B — API Endpoints (MVP Sketch)

**Auth**

* `POST /auth/register`, `POST /auth/login`, `POST /auth/totp/setup`, `POST /auth/totp/verify`, `POST /auth/token/refresh`

**Spaces**

* `GET/POST /spaces`, `PATCH /spaces/:id`

**Connectors**

* `POST /connectors/:provider/link_token`, `POST /connectors/:provider/exchange_public_token`, `GET /connectors`, `DELETE /connectors/:id`, `POST /webhooks/:provider`

**Accounts & Txns**

* `GET /accounts`, `GET /accounts/:id`, `POST /accounts/:id/refresh`, `GET /transactions`, `POST /transactions/bulk`

**Budgeting**

* `GET/POST /categories`, `GET/POST /budgets`, `GET/POST /rules`, `POST /rules/reapply`

**Wealth & ESG**

* `GET /net-worth/snapshots`, `GET /allocations`, `GET /esg/scores?asset=`

---

## 🧰 Scripts (suggested)

Add these to the root `package.json` as the codebase materializes:

```json
{
  "scripts": {
    "dev:infra": "docker compose -f infra/docker/compose.yml up -d",
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "dev:mobile": "pnpm --filter mobile start",
    "db:push": "pnpm --filter api prisma db push",
    "db:seed": "pnpm --filter api prisma db seed",
    "lint": "turbo lint",
    "test": "turbo test"
  }
}
```

---

## 🔗 References

* Dhanam (ESG/auth baseline): [https://github.com/aldoruizluna/Dhanam](https://github.com/aldoruizluna/Dhanam)
* Belvo/Plaid/Bitso sandbox docs (provider dashboards)
* Banxico FX rates (official daily series)
