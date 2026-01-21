# Dhanam Infrastructure Dependencies

**CRITICAL: Read this before ANY deployment, auth, or infrastructure work on Dhanam.**

## Authentication & Authorization: Janua

Dhanam uses **Janua** (MADFAM's own SSO platform) for all authentication and authorization.

- **OIDC Issuer**: `https://auth.madfam.io`
- **Janua API**: `https://api.janua.dev`
- **Client ID**: `jnc_uE2zp9ume_Fd6jMl1elL6wqjiECM711t`

**DO NOT:**
- Implement custom auth systems
- Use third-party auth providers (Auth0, Clerk, etc.)
- Bypass Janua for any auth flows

**Configuration location**: `.enclii.yml` and `apps/web/.env*` files

---

## Deployment & DevOps: Enclii

Dhanam uses **Enclii** (MADFAM's own deployment platform) for all production deployments.

### How Enclii Deployment Works

1. **Configuration file**: `.enclii.yml` in project root
2. **Auto-deploy**: Enabled on `main` branch (`autoDeploy: true`)
3. **Trigger**: Push to main → Enclii detects → Builds → Deploys to bare metal K8s

### Deployment Flow

```
Push to main
    ↓
Enclii detects change (autoDeploy: true)
    ↓
Enclii builds Docker image using .enclii.yml config
    ↓
Enclii deploys to K8s cluster (foundry-core)
    ↓
App live at configured domains
```

**DO NOT:**
- Use GitHub Actions for production deployments
- Manually deploy via kubectl (except for debugging)
- Push directly to container registries for deployment purposes
- Modify `.github/workflows/deploy-*.yml` for production deployment changes

**The GitHub Actions workflows (deploy-web-k8s.yml, deploy-k8s.yml) are NOT the primary deployment mechanism.**

### Key Files

- **Enclii config**: `.enclii.yml`
- **Manual deploy script** (debugging only): `scripts/deploy-dhanam.sh`
- **K8s manifests**: `infra/k8s/production/`

### Production URLs

- **Web App**: `https://app.dhan.am`
- **API**: `https://api.dhan.am`
- **Internal**: `https://dhanam.madfam.io`

---

## To Deploy Changes to Production

1. Make code changes
2. Commit to main branch
3. Push to GitHub (`madfam-io/dhanam`)
4. **Done** - Enclii handles the rest automatically

---

## MADFAM Ecosystem Context

Dhanam is part of the MADFAM ecosystem which includes:
- **Janua**: Authentication/SSO (SOIL layer)
- **Enclii**: Deployment/DevOps CLI (SOIL layer)
- **Other MADFAM products**: sim4d, Primavera3D, Fortuna, etc.

Always consider ecosystem integration when making infrastructure decisions.

---

*Last updated: January 2026*
