# Dhanam Tech Debt Log

> **Last Updated**: 2026-03-15
> **Context**: Production Readiness — Enterprise Hardening

---

## Critical (Blocking)

### TD-001: GHCR Container Build Workflow

**Status**: RESOLVED
**Severity**: CRITICAL

**Resolution**:
GHCR workflows now exist with pinned digests. `deploy-enclii.yml` and `deploy-web-k8s.yml` build and push to `ghcr.io/madfam-org/dhanam/*`. Images are signed with cosign.

**Ticket**: DHANAM-001

---

## High

### TD-002: Database Provisioning API

**Status**: RESOLVED
**Severity**: HIGH
**Violation**: Law 7 (API Mandate)

**Problem**:
Dhanam database and user were provisioned via `kubectl exec` into postgres pod instead of using a proper API. This violates Law 7: "All tenant operations MUST be performed via Enclii/Janua APIs."

**Resolution**:
The Enclii provisioning API already exists at `POST /v1/admin/provision/postgres` on the `switchyard-api` service. It is idempotent (checks `pg_database`/`pg_roles` before creating), handles PgBouncer config updates, and validates SQL identifiers. The `enclii onboard` CLI also supports `--db-name`/`--db-password` flags.

- Created `scripts/provision-db.sh` as a reproducible wrapper for the Enclii API call
- Rewrote `docs/DEPLOYMENT.md` to document the Enclii provisioning API as the required method (also removed ~600 lines of stale AWS ECS/Fargate content, related to TD-003)
- Updated `docs/LAUNCH_OPERATIONS.md` to reference the Enclii provisioning API

**Operational note**: The actual API call to formally re-register the existing database must be run by an operator with admin credentials. The call is idempotent and safe to run against the already-provisioned `dhanam` database.

**Ticket**: DHANAM-004

---

### TD-003: CI/CD Platform Migration

**Status**: RESOLVED
**Severity**: HIGH

**Resolution**:
AWS ECS/Fargate infrastructure has been fully removed. Deployment is exclusively via Enclii PaaS (bare metal K8s). Removed: `infra/terraform/`, `.github/workflows/deploy.yml`, `scripts/setup-aws.sh`, `scripts/deploy.sh`, `scripts/monitor.sh`, `scripts/backup.sh`, and the unused `KmsService`.

**Ticket**: DHANAM-002

---

## Medium

### TD-004: Billing Secrets Placeholder

**Status**: MITIGATED
**Severity**: MEDIUM

**Problem**:
Billing secrets (`dhanam-billing-secrets`) were created with placeholder values. Real Stripe/Paddle credentials need to be configured before billing features work.

**Current Values**:

- `STRIPE_MX_SECRET_KEY`: `sk_test_placeholder_update_before_billing`
- `PADDLE_*`: placeholder values

**Remediation**:

- Startup validation in `BillingService` now detects placeholder values (containing `placeholder`, starting with `your_` or `your-`) on application boot.
- In development, each detected placeholder logs a warning so developers know billing features may not work.
- In production (`NODE_ENV=production`), each detected placeholder logs a critical error and sets `billingDisabled = true`, preventing billing endpoints from operating with invalid credentials.
- `.env.example` updated to use format hints instead of `your_*` placeholder patterns.
- K8s secrets template (`infra/k8s/production/secrets-template.yaml`) added for billing credentials.
- Real credentials are still required before billing features can be used in production.

**Required Action**:

1. Obtain production Stripe MX credentials
2. Obtain production Paddle credentials
3. Update secrets: `kubectl -n dhanam edit secret dhanam-billing-secrets`
4. Follow the step-by-step runbook at `docs/CREDENTIAL_ONBOARDING.md`

**Ticket**: DHANAM-003

---

### TD-005: Enclii Port Mismatch

**Status**: RESOLVED
**Severity**: MEDIUM

**Resolution**:
`enclii.yaml` port changed from 8080 to 80 to match ClusterIP service internal port mapping.

---

### TD-006: JWT Secrets Missing from Template

**Status**: RESOLVED
**Severity**: MEDIUM

**Resolution**:
Added `JWT_SECRET` and `JWT_REFRESH_SECRET` to `infra/k8s/production/secrets-template.yaml`. These are referenced by `api-deployment.yaml`.

---

### TD-007: Monitoring Stack

**Status**: RESOLVED
**Severity**: MEDIUM

**Resolution**:
Created `infra/k8s/monitoring/` with ServiceMonitor, PrometheusRule CRDs, Alertmanager routing config, and Grafana dashboard ConfigMaps. Added metrics port to api-deployment.yaml Service spec. Alert routing uses placeholder receivers for Slack/PagerDuty.

---

### TD-008: Staging Environment

**Status**: RESOLVED
**Severity**: MEDIUM

**Resolution**:
Created `infra/k8s/staging/` with namespace, kustomization overlay (1 replica, `:main` tags, `NODE_ENV=staging`), and secrets template. Added `.github/workflows/deploy-staging.yml` for auto-deploy on push to main.

---

### TD-009: ArgoCD Documentation

**Status**: RESOLVED
**Severity**: LOW

**Resolution**:
Created `infra/k8s/argocd/application.yaml` (ArgoCD Application CRD for GitOps sync) and `infra/k8s/argocd/README.md` documenting the sync loop, UI access, and operational procedures.

---

### TD-010: React 18 Global Pin

**Status**: ACTIVE
**Severity**: LOW

**Problem**:
React Native (Expo 54) requires React 18.x. The monorepo uses a pnpm override to pin react to 18.3.1 globally, preventing apps/web and apps/admin from upgrading to React 19.

**Impact**:

- `apps/mobile/src/lib/react-native-compat.tsx` (92 lines) provides type compatibility shims
- pnpm `overrides` in root `package.json` pins `react` and `react-dom` to `18.3.1`
- Next.js 15 features requiring React 19 server components are unavailable

**Removal Criteria**:
When Expo officially supports React 19, remove the pnpm override and the compat shim.

**Ticket**: DHANAM-010

---

## Tracking

| ID     | Title                             | Severity | Status    | Assigned |
| ------ | --------------------------------- | -------- | --------- | -------- |
| TD-001 | GHCR Container Build Workflow     | CRITICAL | RESOLVED  | -        |
| TD-002 | Database Provisioning API         | HIGH     | RESOLVED  | -        |
| TD-003 | CI/CD Platform Migration          | HIGH     | RESOLVED  | -        |
| TD-004 | Billing Secrets Placeholder       | MEDIUM   | MITIGATED | -        |
| TD-005 | Enclii Port Mismatch              | MEDIUM   | RESOLVED  | -        |
| TD-006 | JWT Secrets Missing from Template | MEDIUM   | RESOLVED  | -        |
| TD-007 | Monitoring Stack                  | MEDIUM   | RESOLVED  | -        |
| TD-008 | Staging Environment               | MEDIUM   | RESOLVED  | -        |
| TD-009 | ArgoCD Documentation              | LOW      | RESOLVED  | -        |
| TD-010 | React 18 Global Pin               | LOW      | ACTIVE    | -        |

---

_This document is maintained per Law 7 (API Mandate) requirements. All bare-metal workarounds must be logged here._
