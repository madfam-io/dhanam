# Dhanam Ledger

> Comprehensive budget and wealth tracking platform for personal and business financial management with ESG crypto insights.

## Features

- 💰 **Multi-Space Management** - Separate personal and business finances
- 🏦 **Bank Integration** - Connect with Belvo (Mexico), Plaid (US), and Bitso (crypto)
- 📊 **Budget Tracking** - Category-based budgets with alerts and rules
- 💎 **Wealth Management** - Net worth tracking and asset allocation
- 🌱 **ESG Scoring** - Environmental, Social, and Governance metrics for crypto
- 📱 **Multi-Platform** - Web dashboard and mobile app
- 🔒 **Security First** - JWT auth, 2FA, and encrypted data storage
- 🌎 **LATAM Focused** - Spanish/English support with MXN/USD currencies

## Tech Stack

- **Frontend**: Next.js 14, React Native + Expo
- **Backend**: NestJS (Fastify), PostgreSQL, Redis
- **Infrastructure**: Docker, AWS ECS/Fargate, Terraform
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

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start infrastructure**
   ```bash
   pnpm dev:infra
   ```
   This starts PostgreSQL, Redis, and Mailhog in Docker containers.

4. **Set up environment variables**
   ```bash
   # Copy example env files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

5. **Run database migrations**
   ```bash
   pnpm db:push
   ```

6. **Seed the database (optional)**
   ```bash
   pnpm db:seed
   ```
   This creates a demo user (demo@dhanam.app / demo123) with sample data.

7. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts:
   - API server at http://localhost:4000
   - Web dashboard at http://localhost:3000
   - API documentation at http://localhost:4000/docs

## Project Structure

```
dhanam/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── web/          # Next.js web dashboard
│   └── mobile/       # React Native mobile app
├── packages/
│   ├── shared/       # Shared types, utils, and constants
│   ├── ui/           # Reusable UI components
│   ├── esg/          # ESG scoring integration
│   └── config/       # Shared configuration
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
- **Next.js 14** with App Router
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
http://localhost:4000/docs

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

Built with ❤️ for the LATAM community