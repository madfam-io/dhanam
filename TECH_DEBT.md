# Dhanam Tech Debt Log

> **Last Updated**: 2026-01-18
> **Context**: Operation GOVERNOR - API-First Migration

---

## Critical (Blocking)

### TD-001: GHCR Container Build Workflow

**Status**: MISSING
**Severity**: CRITICAL
**Blocking**: Dhanam K8s deployment

**Problem**:
K8s manifests reference `ghcr.io/madfam-org/dhanam-*` images, but CI/CD workflow (`deploy.yml`) is configured for AWS ECR. No workflow exists to build and push to GHCR.

**Current State**:
- Pods in `ImagePullBackOff` state
- `ghcr.io/madfam-org/dhanam-api:latest` - DOES NOT EXIST
- `ghcr.io/madfam-org/dhanam-web:latest` - DOES NOT EXIST

**Required Action**:
Create `.github/workflows/docker-build.yml` that:
1. Builds `apps/api/Dockerfile` → `ghcr.io/madfam-org/dhanam-api`
2. Builds `apps/web/Dockerfile` → `ghcr.io/madfam-org/dhanam-web`
3. Pushes to GHCR on main branch merge

**Workaround**: Manual build and push (one-time bootstrap)
```bash
# From dhanam repo root
docker build -t ghcr.io/madfam-org/dhanam-api:latest apps/api
docker build -t ghcr.io/madfam-org/dhanam-web:latest apps/web
docker push ghcr.io/madfam-org/dhanam-api:latest
docker push ghcr.io/madfam-org/dhanam-web:latest
```

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

**Status**: IN_PROGRESS
**Severity**: HIGH

**Problem**:
Dhanam was originally designed for AWS ECS/Fargate but is being deployed to the Galaxy ecosystem (K8s on Hetzner). The infrastructure code needs alignment.

**Current State**:
- `infra/terraform/` - AWS ECS configuration (OBSOLETE)
- `infra/k8s/production/` - Galaxy K8s manifests (CURRENT)
- `.github/workflows/deploy.yml` - AWS ECR deployment (OBSOLETE)

**Required Action**:
1. Create new GHCR workflow (see TD-001)
2. Mark AWS Terraform as deprecated
3. Update documentation to reflect Galaxy deployment

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

## Tracking

| ID | Title | Severity | Status | Assigned |
|----|-------|----------|--------|----------|
| TD-001 | GHCR Container Build Workflow | CRITICAL | MISSING | - |
| TD-002 | Database Provisioning API | HIGH | MISSING | - |
| TD-003 | CI/CD Platform Migration | HIGH | IN_PROGRESS | - |
| TD-004 | Billing Secrets Placeholder | MEDIUM | PLACEHOLDER | - |

---

*This document is maintained per Law 7 (API Mandate) requirements. All bare-metal workarounds must be logged here.*
