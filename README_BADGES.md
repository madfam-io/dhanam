# Status Badges for README

Copy and paste these badges into your main README.md file.

## CI/CD Status

```markdown
[![Test Coverage](https://github.com/madfam-io/dhanam/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/madfam-io/dhanam/actions/workflows/test-coverage.yml)

[![Lint](https://github.com/madfam-io/dhanam/actions/workflows/lint.yml/badge.svg)](https://github.com/madfam-io/dhanam/actions/workflows/lint.yml)

[![codecov](https://codecov.io/gh/madfam-io/dhanam/branch/main/graph/badge.svg)](https://codecov.io/gh/madfam-io/dhanam)
```

## Technology Stack

```markdown
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)

[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org/)

[![pnpm](https://img.shields.io/badge/pnpm-8-orange?logo=pnpm)](https://pnpm.io/)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)

[![NestJS](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)](https://nestjs.com/)

[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)

[![React Native](https://img.shields.io/badge/React_Native-0.73-61DAFB?logo=react)](https://reactnative.dev/)
```

## Coverage Badges

```markdown
[![Coverage Lines](https://codecov.io/gh/madfam-io/dhanam/branch/main/graph/badge.svg?token=YOUR_TOKEN&flag=api)](https://codecov.io/gh/madfam-io/dhanam)

[![Coverage Branches](https://img.shields.io/codecov/c/github/madfam-io/dhanam/main?flag=api&label=branches)](https://codecov.io/gh/madfam-io/dhanam)
```

## License & Version

```markdown
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![Version](https://img.shields.io/badge/Version-0.1.0-blue.svg)](package.json)
```

## Example Combined

```markdown
# Dhanam Ledger

[![Test Coverage](https://github.com/madfam-io/dhanam/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/madfam-io/dhanam/actions/workflows/test-coverage.yml)
[![Lint](https://github.com/madfam-io/dhanam/actions/workflows/lint.yml/badge.svg)](https://github.com/madfam-io/dhanam/actions/workflows/lint.yml)
[![codecov](https://codecov.io/gh/madfam-io/dhanam/branch/main/graph/badge.svg)](https://codecov.io/gh/madfam-io/dhanam)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Comprehensive budget and wealth tracking for LATAM with ESG crypto insights.

## Features

- 💰 Personal & business budgeting
- 📊 Wealth tracking with net worth calculations
- 🌿 ESG scoring for crypto assets
- 🔐 TOTP 2FA security
- 🌎 LATAM-first with multilingual support (ES/EN)
- 📈 60-day cashflow forecasting

## Tech Stack

- **Frontend:** Next.js, React Native + Expo
- **Backend:** NestJS (Fastify), Prisma + PostgreSQL
- **Infrastructure:** AWS ECS/Fargate, Terraform
- **Analytics:** PostHog
- **Monitoring:** Sentry

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Start local infrastructure
pnpm dev:infra

# Run database migrations
pnpm db:migrate:dev

# Start development servers
pnpm dev
\`\`\`

## Testing

\`\`\`bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run CI simulation locally
./scripts/test-ci.sh
\`\`\`

## Documentation

- [Test Coverage Guide](apps/api/TEST_COVERAGE_GUIDE.md)
- [CI/CD Setup](.github/CICD_SETUP.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- [Audit Report](COMPREHENSIVE_AUDIT_REPORT_2025.md)

## License

MIT © Dhanam Team
\`\`\`

---

## Rendered Preview

# Dhanam Ledger

![Test Coverage](https://img.shields.io/badge/tests-passing-brightgreen)
![Lint](https://img.shields.io/badge/lint-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-85%25-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Comprehensive budget and wealth tracking for LATAM with ESG crypto insights.

---

**Note:** Replace `madfam-io/dhanam` with your actual GitHub organization/repository path, and `YOUR_TOKEN` with your actual Codecov token if using private repositories.
