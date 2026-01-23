# Dhanam Ledger

> **A comprehensive budget and wealth tracking application with ESG crypto insights, targeting LATAM-first users with multilingual support.**

[![Test Coverage](https://github.com/madfam-io/dhanam/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/madfam-io/dhanam/actions/workflows/test-coverage.yml)
[![Lint](https://github.com/madfam-io/dhanam/actions/workflows/lint.yml/badge.svg)](https://github.com/madfam-io/dhanam/actions/workflows/lint.yml)
[![codecov](https://codecov.io/gh/madfam-io/dhanam/branch/main/graph/badge.svg)](https://codecov.io/gh/madfam-io/dhanam)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)

## Features

- 💰 **Multi-Space Management** - Separate personal and business finances
- 🏦 **Bank Integration** - Connect with Belvo (Mexico), Plaid (US), and Bitso (crypto)
- 📊 **Budget Tracking** - Category-based budgets with alerts and rules
- 💎 **Wealth Management** - Net worth tracking and asset allocation
- 🌱 **ESG Scoring** - Environmental, Social, and Governance metrics for crypto
- 📱 **Multi-Platform** - Web dashboard and mobile app
- 🔒 **Security First** - Janua SSO (OIDC/PKCE), 2FA, and encrypted data storage
- 🌎 **LATAM Focused** - Spanish/English support with MXN/USD currencies

## Production Status

| Service | Domain | Status |
|---------|--------|--------|
| Web Dashboard | `dhanam.com` | ✅ Running on Enclii |
| API Backend | Internal | ✅ Running on Enclii |
| Admin Panel | `admin.dhanam.com` | ✅ Running on Enclii |

**Authentication**: Janua SSO with OAuth 2.0/OIDC (PKCE flow enforced)
- Client ID: `dhanam-ledger`
- Issuer: `https://auth.madfam.io`
- Social logins: GitHub, Google via Janua

**Infrastructure**: 2-Node Hetzner Cluster via [Enclii PaaS](https://github.com/madfam-org/enclii)
- Production workloads on "The Sanctuary" (AX41-NVMe)
- CI/CD builds on "The Forge" (CPX11)
- Zero-trust ingress via Cloudflare Tunnel

## Tech Stack

- **Frontend**: Next.js 15/16, React Native + Expo
- **Backend**: NestJS (Fastify), PostgreSQL, Redis
- **Infrastructure**: Docker, AWS ECS/Fargate, Terraform, Enclii PaaS
- **Build**: Turborepo, pnpm monorepo

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15 (via Docker)
- Redis 7 (via Docker)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dhanam.git
   cd dhanam
   ```

2. **Configure NPM Registry**
   
   Dhanam uses MADFAM's private npm registry for internal packages. Create or update your `.npmrc`:
   ```bash
   # Add to your project's .npmrc or ~/.npmrc
   @madfam:registry=https://npm.madfam.io
   @dhanam:registry=https://npm.madfam.io
   @janua:registry=https://npm.madfam.io
   //npm.madfam.io/:_authToken=${NPM_MADFAM_TOKEN}
   ```
   
   Set the `NPM_MADFAM_TOKEN` environment variable with your registry token.

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Start infrastructure**
   ```bash
   pnpm dev:infra
   ```
   This starts PostgreSQL, Redis, and Mailhog in Docker containers.

5. **Set up environment variables**
   ```bash
   # Copy example env files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

6. **Run database migrations**
   ```bash
   pnpm db:push
   ```

7. **Seed the database (optional)**
   ```bash
   pnpm db:seed
   ```
   This creates a demo user (demo@dhanam.app / demo123) with sample data.

8. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts:
   - API server at http://localhost:4010
   - Web dashboard at http://localhost:3040
   - API documentation at http://localhost:4010/docs

## Project Structure

```
dhanam/
├── apps/
│   ├── admin/        # Next.js 16 admin dashboard (port 3400)
│   ├── api/          # NestJS backend API (port 4010)
│   ├── mobile/       # React Native mobile app (Expo)
│   └── web/          # Next.js 15 web dashboard (port 3040)
├── packages/
│   ├── config/       # Shared configuration (ESLint, tsconfig, prettier)
│   ├── esg/          # ESG scoring integration
│   ├── shared/       # Shared types, utils, and constants
│   ├── simulations/  # Monte Carlo & scenario analysis engines
│   └── ui/           # Reusable UI components (shadcn-ui)
├── infra/
│   ├── docker/       # Docker configurations
│   └── terraform/    # Infrastructure as code
└── scripts/          # Development scripts
```

## Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps and packages
- `pnpm test` - Run tests across the monorepo
- `pnpm lint` - Lint all code
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean all build artifacts
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:seed` - Seed database with sample data
- `pnpm dev:infra` - Start local infrastructure
- `pnpm dev:infra:down` - Stop local infrastructure

## Development Workflow

### Creating a new feature

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the existing patterns

3. Run tests and linting
   ```bash
   pnpm test
   pnpm lint
   ```

4. Commit with conventional commits
   ```bash
   git commit -m "feat: add new feature"
   ```

### Working with the API

The API uses a modular architecture with:
- **Core modules**: Infrastructure (Prisma, Redis, Crypto, Logger)
- **Feature modules**: Auth, Users, Spaces, Accounts, etc.
- **Shared code**: DTOs, guards, decorators

Example API endpoint:
```typescript
@Post('login')
@ApiOperation({ summary: 'Login user' })
async login(@Body() dto: LoginDto): Promise<AuthResponse> {
  return this.authService.login(dto);
}
```

### Working with the Frontend

The web app uses:
- **Next.js 15** with App Router (admin uses Next.js 16)
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Zustand** for state management
- **React Query** for server state

Example component:
```typescript
export function LoginForm() {
  const { setAuth } = useAuth();
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens);
      router.push('/dashboard');
    },
  });
  // ...
}
```

## Security

- **Authentication**: JWT with refresh token rotation
- **2FA**: TOTP-based two-factor authentication
- **Encryption**: AES-256-GCM for sensitive data
- **Password**: Argon2id hashing
- **API Security**: Rate limiting, CORS, helmet
- **Audit Logging**: All sensitive operations logged

## API Documentation

When running in development, Swagger documentation is available at:
http://localhost:4010/docs

## Testing

We maintain 80%+ test coverage across the codebase with comprehensive unit, integration, and E2E tests.

```bash
# Run all tests
pnpm test

# Run tests with coverage report
pnpm test:cov

# Run E2E tests
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch

# Simulate CI environment locally
./scripts/test-ci.sh
```

### Test Infrastructure

- **Test Helpers**: Database management, authentication utilities, data factories
- **Coverage Target**: 80%+ across branches, functions, lines, and statements
- **CI/CD**: Automated testing on every push and PR via GitHub Actions
- **Coverage Reporting**: Integrated with Codecov for trend tracking

For detailed testing documentation, see:
- [Test Coverage Guide](apps/api/TEST_COVERAGE_GUIDE.md) - Comprehensive testing guide
- [Test Summary](docs/testing/TEST_SUMMARY.md) - Testing approach overview
- [Test Results](docs/testing/TEST_RESULTS.md) - Latest test results

## Deployment

The application is designed to run on AWS ECS/Fargate:

1. Build Docker images
   ```bash
   docker build -f infra/docker/Dockerfile.api -t dhanam-api .
   docker build -f infra/docker/Dockerfile.web -t dhanam-web .
   ```

2. Deploy with Terraform
   ```bash
   cd infra/terraform
   terraform init
   terraform plan
   terraform apply
   ```

For complete deployment instructions, see [Deployment Guide](docs/DEPLOYMENT.md).

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

### Getting Started
- [Development Guide](docs/DEVELOPMENT.md) - Local development setup
- [API Documentation](docs/API.md) - Backend API reference
- [Mobile App Guide](docs/MOBILE.md) - React Native development

### Architecture & Design
- [Architecture Overview](ARCHITECTURE.md) - High-level system design
- [Full Architecture Details](docs/architecture/ARCHITECTURE.md) - Complete architecture
- [Software Specification](docs/architecture/SOFTWARE_SPEC.md) - Technical specs
- [Infrastructure Guide](docs/INFRASTRUCTURE.md) - Infrastructure setup
- [API Specification](API_SPECIFICATION.yaml) - OpenAPI spec

### Operations & Deployment
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Admin Dashboard](docs/ADMIN_DASHBOARD.md) - Admin features
- [Sentry Setup](docs/SENTRY_SETUP.md) - Error tracking
- [CI/CD Setup](docs/guides/CICD_IMPLEMENTATION_SUMMARY.md) - Build pipeline

### Reports & Audits
- [Documentation Index](docs/README.md) - Complete documentation index
- [Comprehensive Audit 2025](docs/audits/COMPREHENSIVE_AUDIT_REPORT_2025.md) - Latest audit
- [Implementation Roadmap](docs/guides/IMPLEMENTATION_ROADMAP.md) - Project roadmap

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

AGPL-3.0 License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

Built with ❤️ for the LATAM community