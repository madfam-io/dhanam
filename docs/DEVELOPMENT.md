# Development Guide

This guide will help you set up and run the Dhanam project locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker** and **Docker Compose**
- **Git**

### Optional but recommended:
- **AWS CLI** (for LocalStack interaction)
- **PostgreSQL client** (for database access)
- **Redis CLI** (for cache inspection)

### NPM Registry Configuration

Dhanam uses MADFAM's private npm registry (`npm.madfam.io`) for internal packages. Configure your `.npmrc` before running `pnpm install`:

```bash
# Add to your project's .npmrc or ~/.npmrc
@madfam:registry=https://npm.madfam.io
@dhanam:registry=https://npm.madfam.io
@janua:registry=https://npm.madfam.io
//npm.madfam.io/:_authToken=${NPM_MADFAM_TOKEN}
```

**Get your token:** Contact the MADFAM team or generate one from the registry admin panel.

**For CI/CD:** Add `NPM_MADFAM_TOKEN` as a secret in your GitHub Actions or CI platform.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/madfam-io/dhanam.git
cd dhanam

# Run the setup script
./scripts/dev-setup.sh

# Start the development servers
pnpm dev
```

This will:
1. Set up Docker containers (PostgreSQL, Redis, LocalStack, etc.)
2. Install all dependencies
3. Run database migrations
4. Seed the database with sample data
5. Build shared packages

## Project Structure

```
dhanam/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native mobile app
├── packages/
│   ├── shared/       # Shared types and utilities
│   ├── ui/           # Shared UI components
│   ├── esg/          # ESG scoring logic
│   └── config/       # Shared configuration
├── infra/
│   ├── docker/       # Docker configurations
│   └── terraform/    # AWS infrastructure as code
├── scripts/          # Development and deployment scripts
└── docs/            # Documentation
```

## Environment Setup

### 1. Environment Variables

Copy the example environment files:

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env.local

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

### 2. Docker Services

Start the required services:

```bash
# Start all services
docker-compose up -d

# Start with development tools (PgAdmin, Redis Commander)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Check service status
docker-compose ps
```

Available services:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **LocalStack**: `localhost:4566`
- **Mailhog**: `localhost:8025` (Web UI)
- **PgAdmin**: `localhost:5050` (admin@dhanam.local / admin)
- **Redis Commander**: `localhost:8081`

### 3. Database Setup

```bash
cd apps/api

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database
pnpm db:seed

# Open Prisma Studio (GUI)
pnpm prisma studio
```

## Development Workflow

### Running Applications

```bash
# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm dev:api    # Backend API (http://localhost:4000)
pnpm dev:web    # Web app (http://localhost:3000)
pnpm dev:mobile # Mobile app (Expo)

# Build packages
pnpm build:packages
```

### Code Quality

```bash
# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm typecheck

# Testing
pnpm test
pnpm test:watch
pnpm test:coverage

# Format code
pnpm format
```

### Database Management

```bash
cd apps/api

# Create a new migration
pnpm prisma migrate dev --name your_migration_name

# Reset database
pnpm prisma migrate reset

# View database in GUI
pnpm prisma studio
```

## API Development

### Swagger Documentation

The API documentation is available at:
- Local: http://localhost:4000/api
- Staging: https://api-staging.dhanam.io/api
- Production: https://api.dhanam.io/api

### Authentication

The API uses JWT authentication with refresh tokens:

```bash
# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use the access token in subsequent requests
curl http://localhost:4000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Provider Integrations

#### Belvo (Mexico)
- Sandbox credentials are pre-configured
- Test institutions: `sandbox_mx`
- Test user: `test_user` / `test_password`

#### Plaid (US)
- Sandbox credentials are pre-configured
- Test institutions: Chase, Bank of America
- Test user: `user_good` / `pass_good`

#### Bitso (Crypto)
- Requires API key configuration
- Sandbox mode available

## Frontend Development

### Web Application

The web app uses Next.js 14 with App Router:

```bash
cd apps/web

# Development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start
```

Key features:
- Server-side rendering
- API route handlers
- Tailwind CSS styling
- Radix UI components

### Mobile Application

The mobile app uses React Native with Expo:

```bash
cd apps/mobile

# Start Expo development server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Install Playwright
pnpm playwright install

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui
```

## Debugging

### API Debugging

1. Use VS Code debugger with the provided launch configuration
2. Set breakpoints in your code
3. Press F5 to start debugging

### Database Queries

Monitor database queries:

```bash
# Connect to PostgreSQL
docker exec -it dhanam-postgres psql -U dhanam -d dhanam_dev

# View recent queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Redis Monitoring

```bash
# Connect to Redis CLI
docker exec -it dhanam-redis redis-cli

# Monitor commands in real-time
MONITOR

# View all keys
KEYS *
```

## Troubleshooting

### Common Issues

#### Port already in use
```bash
# Find process using port
lsof -i :3000  # or :4000 for API

# Kill process
kill -9 <PID>
```

#### Docker issues
```bash
# Reset Docker environment
docker-compose down -v
docker system prune -a
./scripts/dev-setup.sh
```

#### Database connection issues
```bash
# Check PostgreSQL logs
docker logs dhanam-postgres

# Verify connection
psql postgresql://dhanam:dhanam_dev_password@localhost:5432/dhanam_dev
```

#### Dependency issues
```bash
# Clear all caches
pnpm store prune
rm -rf node_modules
rm -rf .turbo
pnpm install
```

## Git Workflow

### Branch Naming

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### Commit Messages

Follow conventional commits:

```
type(scope): description

feat(api): add transaction categorization
fix(web): resolve login redirect issue
docs(readme): update installation steps
```

### Pull Request Process

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Push to GitHub
5. Create a pull request
6. Wait for CI checks
7. Request review
8. Merge after approval

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_accounts_space_id ON accounts(space_id);
```

### API Performance

- Use DataLoader for N+1 query prevention
- Implement response caching with Redis
- Use pagination for large datasets
- Enable compression

### Frontend Performance

- Implement code splitting
- Use React.memo for expensive components
- Optimize images with next/image
- Enable ISR for static pages

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use class-validator DTOs
3. **Sanitize outputs** - Prevent XSS attacks
4. **Use HTTPS** - Even in development with mkcert
5. **Keep dependencies updated** - Run `pnpm audit` regularly

## Deployment

### Local Production Build

```bash
# Build all apps
pnpm build

# Run production builds locally
cd apps/api && pnpm start:prod
cd apps/web && pnpm start
```

### Docker Deployment

```bash
# Build Docker images
docker build -t dhanam-api apps/api
docker build -t dhanam-web apps/web

# Run containers
docker run -p 4000:4000 dhanam-api
docker run -p 3000:3000 dhanam-web
```

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Turborepo Documentation](https://turbo.build/repo/docs)

## Getting Help

- Check existing [GitHub Issues](https://github.com/madfam-io/dhanam/issues)
- Join our [Discord Server](https://discord.gg/dhanam)
- Read the [FAQ](./FAQ.md)
- Contact the team at dev@dhanam.io