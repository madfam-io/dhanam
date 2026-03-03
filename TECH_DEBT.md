# Dhanam Tech Debt Log

> **Last Updated**: 2026-03-02
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

**Status**: MISSING
**Severity**: HIGH
**Violation**: Law 7 (API Mandate)

**Problem**:
Dhanam database and user were provisioned via `kubectl exec` into postgres pod instead of using a proper API. This violates Law 7: "All tenant operations MUST be performed via Enclii/Janua APIs."

**Evidence**:
```bash
# Commands executed during Operation GOVERNOR (2026-01-18)
kubectl exec -n data postgres-0 -- psql -U enclii -c "CREATE DATABASE dhanam;"
kubectl exec -n data postgres-0 -- psql -U enclii -c "CREATE USER dhanam_user..."
```

**Required Action**:
Implement Enclii Database Provisioning API:
- `POST /api/v1/databases` - Create database
- `POST /api/v1/databases/{db}/users` - Create user with permissions
- `DELETE /api/v1/databases/{db}` - Drop database (with safety checks)

**Ticket**: ENCLII-XXX

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

**Status**: PLACEHOLDER
**Severity**: MEDIUM

**Problem**:
Billing secrets (`dhanam-billing-secrets`) were created with placeholder values. Real Stripe/Paddle credentials need to be configured before billing features work.

**Current Values**:
- `STRIPE_MX_SECRET_KEY`: `sk_test_placeholder_update_before_billing`
- `PADDLE_*`: placeholder values

**Required Action**:
1. Obtain production Stripe MX credentials
2. Obtain production Paddle credentials
3. Update secrets: `kubectl -n dhanam edit secret dhanam-billing-secrets`

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

## Tracking

| ID | Title | Severity | Status | Assigned |
|----|-------|----------|--------|----------|
| TD-001 | GHCR Container Build Workflow | CRITICAL | RESOLVED | - |
| TD-002 | Database Provisioning API | HIGH | MISSING | - |
| TD-003 | CI/CD Platform Migration | HIGH | RESOLVED | - |
| TD-004 | Billing Secrets Placeholder | MEDIUM | PLACEHOLDER | - |
| TD-005 | Enclii Port Mismatch | MEDIUM | RESOLVED | - |
| TD-006 | JWT Secrets Missing from Template | MEDIUM | RESOLVED | - |
| TD-007 | Monitoring Stack | MEDIUM | RESOLVED | - |
| TD-008 | Staging Environment | MEDIUM | RESOLVED | - |
| TD-009 | ArgoCD Documentation | LOW | RESOLVED | - |

---

*This document is maintained per Law 7 (API Mandate) requirements. All bare-metal workarounds must be logged here.*
