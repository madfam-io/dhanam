# Dhanam - System Context

**Version:** 1.0.0
**Last Updated:** 2026-01-21

## Overview

Dhanam is MADFAM's personal finance and wealth tracking application. It targets LATAM-first users with multilingual support and integrates with local financial providers.

## Architecture

| Component | Port | Domain | Description |
|-----------|------|--------|-------------|
| Dhanam API | 8500 (container) / 80 (K8s service) | api.dhan.am | Backend API |
| Dhanam Web | 3300 (container) / 80 (K8s service) | app.dhan.am, dhan.am | Next.js dashboard |
| Dhanam Admin | 3301 (container) / 80 (K8s service) | admin.dhan.am | Admin console |

## Authentication

Dhanam uses **Janua** for all authentication via OIDC:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_OIDC_ISSUER` | `https://auth.madfam.io` |
| `NEXT_PUBLIC_OIDC_CLIENT_ID` | `jnc_uE2zp9ume_Fd6jMl1elL6wqjiECM711t` |
| `NEXT_PUBLIC_JANUA_API_URL` | `https://api.janua.dev` |

### SSO Button Logic
The "Sign in with Janua SSO" button visibility is controlled by:
- File: `apps/web/src/lib/janua-oauth.ts:168-170`
- Requires: `NEXT_PUBLIC_JANUA_API_URL` to be set

## Kubernetes Resources

| Resource | Namespace | Purpose |
|----------|-----------|---------|
| `dhanam-api` | dhanam | Backend API |
| `dhanam-web` | dhanam | Frontend dashboard |
| `dhanam-admin` | dhanam | Admin interface |
| `dhanam-secrets` | dhanam | Credentials |
| `dhanam-billing-secrets` | dhanam | Stripe/Paddle keys |
| `ghcr-credentials` | dhanam | Container registry auth |

## Critical Configuration

### Web Deployment Environment Variables
Located in: `infra/k8s/production/web-deployment.yaml`

```yaml
# API Configuration
NEXT_PUBLIC_API_URL: "https://api.dhan.am/v1"
NEXT_PUBLIC_BASE_URL: "https://app.dhan.am"

# Janua OIDC
NEXT_PUBLIC_OIDC_ISSUER: "https://auth.madfam.io"
NEXT_PUBLIC_OIDC_CLIENT_ID: "jnc_uE2zp9ume_Fd6jMl1elL6wqjiECM711t"
NEXT_PUBLIC_JANUA_API_URL: "https://api.janua.dev"
```

### ImagePullSecrets
The deployment requires `ghcr-credentials` for pulling images from GitHub Container Registry.

## Troubleshooting

### Check Web health
```bash
curl -s https://app.dhan.am/api/health
```

### Verify SSO button should be visible
```bash
# If this returns a valid response, SSO button should appear
curl -s https://api.janua.dev/health
```

### View Web logs
```bash
kubectl logs -n dhanam -l app=dhanam-web -f
```

### Check deployment status
```bash
kubectl get pods -n dhanam -l app=dhanam-web
kubectl rollout status deployment/dhanam-web -n dhanam
```

### ImagePullBackOff troubleshooting
If pods show ImagePullBackOff:
1. Verify `ghcr-credentials` secret exists: `kubectl get secret ghcr-credentials -n dhanam`
2. Ensure deployment has `imagePullSecrets` configured
3. Verify image exists in registry

## Related Documentation
- [CLAUDE.md](./CLAUDE.md) - Full development guide
- [Janua System Context](/Users/aldoruizluna/labspace/janua/SYSTEM_CONTEXT.md)
- [Enclii System Context](/Users/aldoruizluna/labspace/enclii/SYSTEM_CONTEXT.md)
