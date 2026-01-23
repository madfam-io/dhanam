# Dhanam Admin Dashboard

> Administrative dashboard for Dhanam platform management, user operations, and system monitoring.

## Overview

The admin dashboard provides platform administrators with tools for:

- **User Management**: Search, view, and manage user accounts
- **Read-only Impersonation**: View user perspectives with audit trails
- **Feature Flags**: Control feature rollout across the platform
- **System Monitoring**: Health checks, provider status, and analytics
- **Audit Logs**: Comprehensive logging of all sensitive operations

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 18.3.1
- **Styling**: Tailwind CSS via `@dhanam/ui`
- **State**: React Server Components + Client Components as needed
- **Types**: TypeScript 5.9+

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- API server running (`pnpm dev:api` from monorepo root)

### Development

```bash
# From monorepo root
pnpm dev:admin

# Or from this directory
pnpm dev
```

The admin dashboard runs at **http://localhost:3400**

### Build

```bash
# Production build
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
apps/admin/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout with providers
│       ├── page.tsx        # Dashboard home page
│       └── api/
│           └── health/
│               └── route.ts # Health check endpoint
├── public/                  # Static assets
├── package.json
├── next.config.js
└── tsconfig.json
```

## Environment Variables

Create a `.env.local` file based on the template:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4010
NEXT_PUBLIC_ADMIN_URL=http://localhost:3400

# Authentication (via Janua SSO)
NEXT_PUBLIC_JANUA_ISSUER=https://auth.madfam.io
NEXT_PUBLIC_JANUA_CLIENT_ID=dhanam-admin

# Feature Flags
NEXT_PUBLIC_ENABLE_IMPERSONATION=true
NEXT_PUBLIC_ENABLE_AUDIT_LOGS=true

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## API Endpoints

### Health Check

```
GET /api/health
```

Returns admin service health status.

## Authentication

Admin access requires:

1. Valid Janua SSO session with admin role
2. TOTP 2FA verification (mandatory for all admin operations)
3. IP allowlist validation (in production)

## Security Considerations

- **Audit Logging**: All admin actions are logged with user ID, timestamp, and action details
- **Rate Limiting**: Admin API endpoints have stricter rate limits
- **Session Timeout**: Admin sessions expire after 15 minutes of inactivity
- **RBAC**: Role-based access control for different admin permission levels

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server on port 3400 |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |

## Deployment

Admin dashboard is deployed via Enclii PaaS:

- **Production**: `https://admin.dhanam.com`
- **Auto-deploy**: Triggered on push to `main` branch
- **Config**: See `.enclii.yml` in monorepo root

## Dependencies

### Runtime
- `@dhanam/shared` - Shared types, utils, i18n
- `@dhanam/ui` - UI component library

### Development
- `@dhanam/config` - Shared ESLint/TypeScript configuration

## Related Documentation

- [Main README](../../README.md) - Project overview
- [API Documentation](../api/README.md) - Backend API reference
- [Admin Dashboard Guide](../../docs/ADMIN_DASHBOARD.md) - Feature documentation
- [Deployment Guide](../../docs/DEPLOYMENT.md) - Deployment instructions

---

**Port**: 3400
**Status**: Active development
**Last Updated**: January 2025
