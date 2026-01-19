# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Dhanam Ledger project - a comprehensive budget and wealth tracking application that unifies personal and business financial management with ESG crypto insights. It targets LATAM-first users with multilingual support (English/Spanish).

**Core Features:**
- Personal and business budgeting with category caps and rules-based auto-categorization
- Wealth tracking with net worth calculations and asset allocation views
- ESG scoring for crypto assets using the Dhanam package
- Read-only financial data integration (Belvo for MX, Plaid for US, Bitso for crypto)
- 60-day cashflow forecasting with weekly granularity
- TOTP 2FA security with JWT + rotating refresh tokens

## Architecture

**Monorepo Structure (Turborepo + pnpm):**
```
apps/
├─ web/           # Next.js dashboard app
├─ mobile/        # React Native + Expo app  
└─ api/           # NestJS (Fastify) backend
packages/
├─ shared/        # Shared TS utils, types, i18n
├─ esg/           # Dhanam ESG adapters
├─ ui/            # Reusable UI components (shadcn-ui)
└─ config/        # ESLint, tsconfig, prettier presets
infra/
├─ docker/        # Local dev docker-compose
└─ terraform/     # AWS ECS/Fargate infrastructure
```

**Tech Stack:**
- Frontend: Next.js (React), React Native + Expo
- Backend: NestJS (Fastify), Prisma + PostgreSQL, Redis (BullMQ)
- Infrastructure: AWS ECS/Fargate, Terraform
- Analytics: PostHog
- ESG: Dhanam package integration

## Development Commands

When the codebase is implemented, use these commands:

```bash
# Local infrastructure
pnpm dev:infra    # Start docker compose (postgres, redis, mailhog)
pnpm db:push      # Prisma schema sync
pnpm db:seed      # Seed demo data

# Development servers
pnpm dev:api      # Backend at http://localhost:4000
pnpm dev:web      # Frontend at http://localhost:3000  
pnpm dev:mobile   # Expo dev client

# Quality checks
pnpm lint         # ESLint across monorepo
pnpm test         # Run test suites
turbo lint        # Turborepo lint
turbo test        # Turborepo test
```

## Key Implementation Guidelines

**Security First:**
- All provider tokens (Belvo, Plaid, Bitso) must be encrypted at rest using AWS KMS
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
- Default Spanish (ES) for Mexico region, English elsewhere
- Currency formatting for MXN/USD/EUR with Banxico FX rates
- All user-facing text must support i18n via packages/shared/i18n

**Performance Requirements:**
- Page loads <1.5s p95
- Manual account refresh <15s
- Bulk transaction operations (100+ items) <2s p95  
- Background sync every hour via BullMQ queues

**Provider Integration Patterns:**
- Belvo (Mexico): OAuth flow → encrypted token storage → 90+ day transaction history
- Plaid (US): Link flow → webhook updates → balance/transaction sync
- Bitso (crypto): API integration → real-time crypto positions
- Non-custodial: ETH/BTC/xPub address tracking (no secrets needed)

## Testing Strategy

- Unit tests for auth, rules engine, and provider adapters
- Contract tests for all webhook handlers
- Snapshot tests for ESG score calculations
- Synthetic monitors for provider connection health
- Seeded demo Space for manual QA flows

## Database Schema Highlights

Key entities and relationships:
- Users → Spaces (1:many) → Accounts → Transactions
- Spaces → Budgets → Categories (with rules)
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

**PostHog Events:** sign_up, onboarding_complete, connect_initiated, connect_success, sync_success, budget_created, rule_created, txn_categorized, alert_fired, view_net_worth, export_data

**Admin Features:** User search, read-only impersonation with audit trails, feature flags, comprehensive audit logging

## Environment Setup

Each app requires environment configuration:
- API: Database, Redis, JWT keys, provider credentials (Belvo/Plaid/Bitso), Banxico API
- Web: API URL, PostHog key, default locale
- Mobile: Same as web for Expo public variables

The application targets 99.9% availability with RTO 4h and daily backups.# Build trigger 1768794242
# Build retry 1768794847
# Build trigger 1768796202
# Build trigger 1768796866
