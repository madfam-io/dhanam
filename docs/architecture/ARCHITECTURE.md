# Dhanam Ledger Architecture Design

## Executive Summary

Dhanam Ledger is a comprehensive financial management platform designed as a microservices-based monorepo application. This architecture prioritizes security, scalability, and maintainability while delivering a seamless experience for personal and business financial tracking across web and mobile platforms.

## 1. Monorepo Structure

### Directory Layout
```
dhanam/
├── apps/
│   ├── api/                    # NestJS backend service
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── core/           # Core infrastructure
│   │   │   ├── shared/         # Shared utilities
│   │   │   └── main.ts         # Application entry
│   │   ├── test/               # E2E tests
│   │   └── package.json
│   │
│   ├── web/                    # Next.js dashboard
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & hooks
│   │   ├── styles/             # Global styles
│   │   └── package.json
│   │
│   └── mobile/                 # React Native app
│       ├── src/
│       │   ├── screens/        # Screen components
│       │   ├── components/     # Shared components
│       │   ├── navigation/     # Navigation config
│       │   └── services/       # API clients
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared code
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Common utilities
│   │   ├── i18n/               # Translations
│   │   └── constants/          # Shared constants
│   │
│   ├── ui/                     # Component library
│   │   ├── components/         # Reusable UI components
│   │   ├── primitives/         # Base components
│   │   └── themes/             # Theme definitions
│   │
│   ├── esg/                    # ESG integration
│   │   ├── adapters/           # Provider adapters
│   │   ├── calculators/        # Score calculations
│   │   └── types/              # ESG types
│   │
│   └── config/                 # Build configs
│       ├── eslint/             # ESLint presets
│       ├── typescript/         # TypeScript configs
│       └── prettier/           # Prettier configs
│
├── infra/
│   ├── docker/                 # Docker configs
│   │   ├── docker-compose.yml  # Local development
│   │   └── Dockerfile.*        # Service dockerfiles
│   │
│   └── terraform/              # Infrastructure as code
│       ├── modules/            # Reusable modules
│       ├── environments/       # Environment configs
│       └── main.tf             # Root configuration
│
├── scripts/                    # Development scripts
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspace config
└── package.json                # Root package.json
```

### Monorepo Configuration

**turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": []
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

**pnpm-workspace.yaml**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

## 2. Domain-Driven Design (DDD)

### Bounded Contexts

#### User Management Context
- **Entities**: User, AuthToken, Session
- **Value Objects**: Email, Password, UserProfile
- **Aggregates**: User (root)
- **Services**: AuthService, UserService
- **Events**: UserCreated, UserAuthenticated, PasswordChanged

#### Financial Management Context
- **Entities**: Space, Account, Transaction, Budget, Category
- **Value Objects**: Money, TransactionRule, DateRange
- **Aggregates**: Space (root), Account (root)
- **Services**: TransactionService, BudgetService, CategoryService
- **Events**: TransactionCreated, BudgetExceeded, AccountSynced

#### Integration Context
- **Entities**: Provider, Connection, WebhookEvent
- **Value Objects**: ProviderCredentials, SyncStatus
- **Aggregates**: Connection (root)
- **Services**: BelvoService, PlaidService, BitsoService
- **Events**: ConnectionEstablished, SyncCompleted, WebhookReceived

#### Analytics Context
- **Entities**: Report, Forecast, Alert
- **Value Objects**: TimeSeriesData, Metric
- **Aggregates**: Report (root)
- **Services**: ForecastService, AlertService, ReportService
- **Events**: AlertTriggered, ReportGenerated

### Domain Model Example

```typescript
// Domain Entity
export class Transaction {
  private constructor(
    private readonly id: TransactionId,
    private readonly accountId: AccountId,
    private amount: Money,
    private category: Category,
    private description: string,
    private date: Date,
    private metadata: TransactionMetadata
  ) {}

  static create(props: CreateTransactionProps): Result<Transaction> {
    // Validation and business rules
    if (!props.amount || props.amount.isZero()) {
      return Result.fail('Transaction amount cannot be zero');
    }
    
    const transaction = new Transaction(
      TransactionId.create(),
      props.accountId,
      props.amount,
      props.category || Category.uncategorized(),
      props.description,
      props.date,
      props.metadata || {}
    );
    
    transaction.addDomainEvent(new TransactionCreatedEvent(transaction));
    return Result.ok(transaction);
  }

  categorize(category: Category, rule?: TransactionRule): Result<void> {
    this.category = category;
    if (rule) {
      this.metadata.ruleId = rule.id.value;
    }
    this.addDomainEvent(new TransactionCategorizedEvent(this.id, category.id));
    return Result.ok();
  }
}
```

## 3. API Architecture

### RESTful API Design

**Base URL Structure**
```
https://api.dhanam.app/v1
```

**Resource Endpoints**
```yaml
Authentication:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout
  POST   /auth/2fa/setup
  POST   /auth/2fa/verify

Users:
  GET    /users/me
  PATCH  /users/me
  DELETE /users/me
  POST   /users/me/password

Spaces:
  GET    /spaces
  POST   /spaces
  GET    /spaces/:id
  PATCH  /spaces/:id
  DELETE /spaces/:id

Accounts:
  GET    /spaces/:spaceId/accounts
  POST   /spaces/:spaceId/accounts
  GET    /spaces/:spaceId/accounts/:id
  PATCH  /spaces/:spaceId/accounts/:id
  DELETE /spaces/:spaceId/accounts/:id
  POST   /spaces/:spaceId/accounts/:id/sync

Transactions:
  GET    /spaces/:spaceId/transactions
  POST   /spaces/:spaceId/transactions
  GET    /spaces/:spaceId/transactions/:id
  PATCH  /spaces/:spaceId/transactions/:id
  DELETE /spaces/:spaceId/transactions/:id
  POST   /spaces/:spaceId/transactions/bulk

Budgets:
  GET    /spaces/:spaceId/budgets
  POST   /spaces/:spaceId/budgets
  GET    /spaces/:spaceId/budgets/:id
  PATCH  /spaces/:spaceId/budgets/:id
  DELETE /spaces/:spaceId/budgets/:id

Categories:
  GET    /spaces/:spaceId/categories
  POST   /spaces/:spaceId/categories
  PATCH  /spaces/:spaceId/categories/:id
  DELETE /spaces/:spaceId/categories/:id

Integrations:
  POST   /integrations/belvo/connect
  POST   /integrations/plaid/connect
  POST   /integrations/bitso/connect
  POST   /integrations/webhook/:provider

Analytics:
  GET    /spaces/:spaceId/analytics/cashflow
  GET    /spaces/:spaceId/analytics/networth
  GET    /spaces/:spaceId/analytics/expenses
  GET    /spaces/:spaceId/analytics/esg

Exports:
  POST   /spaces/:spaceId/exports
  GET    /spaces/:spaceId/exports/:id
```

### API Response Format

**Success Response**
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00Z",
    "version": "1.0.0"
  }
}
```

**Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than zero"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 4. Database Schema

### Core Tables

```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  locale VARCHAR(10) DEFAULT 'es',
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-tenancy
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'business')),
  currency VARCHAR(3) DEFAULT 'MXN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_spaces (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, space_id)
);

-- Financial Accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subtype VARCHAR(50),
  currency VARCHAR(3) NOT NULL,
  balance DECIMAL(19,4) DEFAULT 0,
  encrypted_credentials JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, provider, provider_account_id)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  provider_transaction_id VARCHAR(255),
  amount DECIMAL(19,4) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  date DATE NOT NULL,
  pending BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, provider_transaction_id)
);

-- Categories and Rules
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, name)
);

CREATE TABLE transaction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  conditions JSONB NOT NULL,
  category_id UUID REFERENCES categories(id),
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budget_categories (
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(19,4) NOT NULL,
  alert_threshold DECIMAL(5,2) DEFAULT 80.00,
  PRIMARY KEY (budget_id, category_id)
);

-- Wealth Tracking
CREATE TABLE asset_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value DECIMAL(19,4) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, date)
);

-- ESG Scores
CREATE TABLE esg_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  asset_symbol VARCHAR(50) NOT NULL,
  environmental_score DECIMAL(5,2),
  social_score DECIMAL(5,2),
  governance_score DECIMAL(5,2),
  composite_score DECIMAL(5,2),
  calculated_at TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_accounts_space ON accounts(space_id);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX idx_asset_valuations_date ON asset_valuations(account_id, date DESC);
```

## 5. Authentication & Security

### JWT Token Architecture

```typescript
// Access Token Payload
interface AccessTokenPayload {
  sub: string;        // User ID
  email: string;      // User email
  spaces: Array<{     // User's spaces
    id: string;
    role: string;
  }>;
  iat: number;        // Issued at
  exp: number;        // Expires (15 minutes)
  jti: string;        // Token ID
}

// Refresh Token Payload
interface RefreshTokenPayload {
  sub: string;        // User ID
  family: string;     // Token family ID
  iat: number;        // Issued at
  exp: number;        // Expires (30 days)
  jti: string;        // Token ID
}
```

### Security Middleware Stack

```typescript
// Security configuration
export class SecurityConfig {
  static middleware = [
    helmet(),                           // Security headers
    rateLimit({                        // Rate limiting
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    compression(),                      // Response compression
    cors({                             // CORS configuration
      origin: process.env.ALLOWED_ORIGINS?.split(','),
      credentials: true,
    }),
  ];

  static authMiddleware = [
    passport.authenticate('jwt'),       // JWT validation
    checkTokenRevocation,              // Token blacklist check
    validateUserActive,                // User status check
    enforcePasswordPolicy,             // Password age check
  ];

  static sensitiveOperations = [
    requireTwoFactor,                  // 2FA for sensitive ops
    auditLog,                          // Audit logging
    checkSecurityAlerts,               // Fraud detection
  ];
}
```

### Encryption Strategy

```typescript
// KMS Integration for Sensitive Data
export class EncryptionService {
  constructor(
    private kms: AWS.KMS,
    private config: EncryptionConfig
  ) {}

  async encryptProviderToken(token: string): Promise<EncryptedData> {
    const dataKey = await this.generateDataKey();
    const encrypted = await this.encrypt(token, dataKey.plaintext);
    
    return {
      ciphertext: encrypted,
      encryptedKey: dataKey.encryptedKey,
      algorithm: 'AES-256-GCM',
      version: 1,
    };
  }

  async decryptProviderToken(data: EncryptedData): Promise<string> {
    const dataKey = await this.decryptDataKey(data.encryptedKey);
    return this.decrypt(data.ciphertext, dataKey);
  }
}
```

## 6. Integration Patterns

### Provider Adapter Pattern

```typescript
// Base provider interface
export interface FinancialProvider {
  connect(credentials: ProviderCredentials): Promise<Connection>;
  getAccounts(connection: Connection): Promise<Account[]>;
  getTransactions(
    connection: Connection,
    accountId: string,
    dateRange: DateRange
  ): Promise<Transaction[]>;
  refreshConnection(connection: Connection): Promise<void>;
  handleWebhook(payload: any, signature: string): Promise<WebhookResult>;
}

// Belvo implementation
export class BelvoProvider implements FinancialProvider {
  constructor(
    private client: BelvoClient,
    private encryptionService: EncryptionService
  ) {}

  async connect(credentials: ProviderCredentials): Promise<Connection> {
    const link = await this.client.links.create({
      institution: credentials.institution,
      username: credentials.username,
      password: credentials.password,
    });

    const encryptedToken = await this.encryptionService.encryptProviderToken(
      link.access_token
    );

    return {
      provider: 'belvo',
      providerId: link.id,
      encryptedCredentials: encryptedToken,
      status: 'active',
    };
  }

  // Additional methods implementation...
}
```

### Webhook Processing

```typescript
export class WebhookProcessor {
  constructor(
    private providers: Map<string, FinancialProvider>,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async processWebhook(
    provider: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<void> {
    // Verify webhook signature
    const isValid = await this.verifySignature(provider, payload, headers);
    if (!isValid) {
      throw new UnauthorizedError('Invalid webhook signature');
    }

    // Process webhook
    const adapter = this.providers.get(provider);
    const result = await adapter.handleWebhook(payload, headers['x-signature']);

    // Emit domain events
    for (const event of result.events) {
      await this.eventBus.publish(event);
    }

    // Log for audit
    this.logger.info('Webhook processed', {
      provider,
      eventType: result.eventType,
      affectedResources: result.affectedResources,
    });
  }
}
```

## 7. Frontend Architecture

### Component Structure

```typescript
// Atomic Design Pattern
src/
├── components/
│   ├── atoms/          // Basic building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Text/
│   ├── molecules/      // Simple component groups
│   │   ├── FormField/
│   │   ├── Card/
│   │   └── Modal/
│   ├── organisms/      // Complex components
│   │   ├── TransactionList/
│   │   ├── BudgetChart/
│   │   └── AccountCard/
│   ├── templates/      // Page templates
│   │   ├── DashboardLayout/
│   │   ├── AuthLayout/
│   │   └── SettingsLayout/
│   └── pages/          // Page components
│       ├── Dashboard/
│       ├── Transactions/
│       └── Settings/
```

### State Management

```typescript
// Zustand store for global state
export const useFinancialStore = create<FinancialStore>((set, get) => ({
  // State
  spaces: [],
  activeSpace: null,
  accounts: [],
  transactions: [],
  
  // Actions
  setActiveSpace: (spaceId: string) => {
    const space = get().spaces.find(s => s.id === spaceId);
    set({ activeSpace: space });
  },
  
  // Async actions
  fetchAccounts: async () => {
    const { activeSpace } = get();
    if (!activeSpace) return;
    
    const accounts = await api.accounts.list(activeSpace.id);
    set({ accounts });
  },
  
  // Computed values
  get totalBalance() {
    return get().accounts.reduce((sum, acc) => sum + acc.balance, 0);
  },
}));

// React Query for server state
export function useTransactions(filters?: TransactionFilters) {
  const { activeSpace } = useFinancialStore();
  
  return useQuery({
    queryKey: ['transactions', activeSpace?.id, filters],
    queryFn: () => api.transactions.list(activeSpace!.id, filters),
    enabled: !!activeSpace,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Mobile Architecture

```typescript
// Navigation structure
export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
            <Stack.Screen name="AddAccount" component={AddAccountScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Shared hooks for cross-platform logic
export const useAccountSync = () => {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();
  
  const sync = useCallback(async (accountId: string) => {
    setSyncing(true);
    try {
      await api.accounts.sync(accountId);
      await queryClient.invalidateQueries(['accounts', accountId]);
      await queryClient.invalidateQueries(['transactions']);
      showNotification('Account synced successfully');
    } catch (error) {
      showNotification('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  }, [queryClient]);
  
  return { sync, syncing };
};
```

## 8. Infrastructure & Deployment

### Container Architecture

```yaml
# docker-compose.yml for local development
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: dhanam
      POSTGRES_USER: dhanam
      POSTGRES_PASSWORD: localdev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

  api:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.api
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://dhanam:localdev@postgres:5432/dhanam
      REDIS_URL: redis://redis:6379
      JWT_SECRET: local-dev-secret
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages

volumes:
  postgres_data:
  redis_data:
```

### AWS Infrastructure (Terraform)

```hcl
# Main application infrastructure
module "ecs_cluster" {
  source = "./modules/ecs"
  
  cluster_name = "dhanam-${var.environment}"
  vpc_id       = module.networking.vpc_id
  subnets      = module.networking.private_subnets
}

module "api_service" {
  source = "./modules/ecs-service"
  
  service_name     = "dhanam-api"
  cluster_id       = module.ecs_cluster.cluster_id
  task_definition  = module.api_task.task_definition_arn
  desired_count    = var.api_instance_count
  
  load_balancer = {
    target_group_arn = module.alb.api_target_group_arn
    container_name   = "api"
    container_port   = 4000
  }
  
  autoscaling = {
    min_capacity = 2
    max_capacity = 10
    
    cpu_threshold    = 70
    memory_threshold = 80
  }
}

module "rds" {
  source = "./modules/rds"
  
  identifier     = "dhanam-${var.environment}"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = var.environment == "production"
  deletion_protection    = var.environment == "production"
}

module "elasticache" {
  source = "./modules/elasticache"
  
  cluster_id           = "dhanam-${var.environment}"
  node_type           = var.redis_node_type
  number_cache_nodes  = var.environment == "production" ? 2 : 1
  
  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm turbo run lint test build
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./apps/*/coverage/lcov.info

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Build and push API image
        run: |
          docker build -f infra/docker/Dockerfile.api -t dhanam-api .
          docker tag dhanam-api:latest $ECR_REGISTRY/dhanam-api:$GITHUB_SHA
          docker push $ECR_REGISTRY/dhanam-api:$GITHUB_SHA
          
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster dhanam-production \
            --service dhanam-api \
            --force-new-deployment
```

## 9. Performance & Monitoring

### Caching Strategy

```typescript
// Multi-layer caching
export class CacheService {
  constructor(
    private redis: Redis,
    private config: CacheConfig
  ) {}

  // L1: In-memory cache for hot data
  private memoryCache = new LRUCache<string, any>({
    max: 1000,
    ttl: 60 * 1000, // 1 minute
  });

  // L2: Redis cache for distributed caching
  async get<T>(key: string): Promise<T | null> {
    // Check L1
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult) return memoryResult;

    // Check L2
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      this.memoryCache.set(key, parsed);
      return parsed;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    
    // Set in both layers
    this.memoryCache.set(key, value);
    await this.redis.setex(key, ttl || this.config.defaultTTL, serialized);
  }

  // Cache patterns
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }
}
```

### Monitoring & Observability

```typescript
// OpenTelemetry setup
export class TelemetryService {
  private tracer: Tracer;
  private meter: Meter;

  constructor() {
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'dhanam-api',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VERSION,
      }),
    });

    provider.addSpanProcessor(
      new BatchSpanProcessor(new OTLPTraceExporter())
    );

    this.tracer = provider.getTracer('dhanam-api');
    this.meter = new MeterProvider().getMeter('dhanam-api');

    this.setupMetrics();
  }

  private setupMetrics() {
    // Request metrics
    this.meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    });

    this.meter.createHistogram('http_request_duration_seconds', {
      description: 'HTTP request latencies',
    });

    // Business metrics
    this.meter.createCounter('transactions_processed_total', {
      description: 'Total number of transactions processed',
    });

    this.meter.createGauge('active_connections', {
      description: 'Number of active provider connections',
    });

    // System metrics
    this.meter.createObservableGauge('memory_usage_bytes', {
      description: 'Memory usage in bytes',
    }, async (observableResult) => {
      const usage = process.memoryUsage();
      observableResult.observe(usage.heapUsed, { type: 'heap' });
      observableResult.observe(usage.rss, { type: 'rss' });
    });
  }
}
```

### Performance Optimizations

```typescript
// Query optimization with DataLoader
export class TransactionLoader extends DataLoader<string, Transaction[]> {
  constructor(private prisma: PrismaClient) {
    super(async (accountIds: string[]) => {
      const transactions = await this.prisma.transaction.findMany({
        where: { accountId: { in: accountIds } },
        orderBy: { date: 'desc' },
      });

      // Group by account ID
      const grouped = accountIds.map(id =>
        transactions.filter(t => t.accountId === id)
      );

      return grouped;
    });
  }
}

// Database query optimization
export class OptimizedQueries {
  // Use database views for complex aggregations
  async getNetWorthHistory(spaceId: string): Promise<NetWorthPoint[]> {
    return this.prisma.$queryRaw`
      SELECT 
        date,
        SUM(value) as total_value,
        currency
      FROM asset_valuations av
      JOIN accounts a ON av.account_id = a.id
      WHERE a.space_id = ${spaceId}
      GROUP BY date, currency
      ORDER BY date DESC
      LIMIT 365
    `;
  }

  // Batch operations for efficiency
  async bulkCategorizeTransactions(
    updates: Array<{ id: string; categoryId: string }>
  ): Promise<void> {
    const sql = Prisma.sql`
      UPDATE transactions AS t
      SET category_id = u.category_id
      FROM (VALUES ${Prisma.join(
        updates.map(u => Prisma.sql`(${u.id}::uuid, ${u.categoryId}::uuid)`)
      )}) AS u(id, category_id)
      WHERE t.id = u.id
    `;

    await this.prisma.$executeRaw(sql);
  }
}
```

## 10. Testing Strategy

### Test Structure

```typescript
// Unit test example
describe('TransactionService', () => {
  let service: TransactionService;
  let mockRepo: MockRepository<Transaction>;

  beforeEach(() => {
    mockRepo = createMockRepository<Transaction>();
    service = new TransactionService(mockRepo);
  });

  describe('categorizeTransaction', () => {
    it('should apply matching rule with highest priority', async () => {
      const transaction = createTransaction({
        description: 'Netflix Subscription',
        amount: -15.99,
      });

      const rules = [
        createRule({ 
          pattern: 'Netflix', 
          category: 'Entertainment',
          priority: 10 
        }),
        createRule({ 
          pattern: 'Subscription', 
          category: 'Subscriptions',
          priority: 5 
        }),
      ];

      const result = await service.categorizeTransaction(transaction, rules);
      
      expect(result.category.name).toBe('Entertainment');
    });
  });
});

// Integration test example
describe('Accounts API', () => {
  let app: INestApplication;
  let jwt: string;

  beforeAll(async () => {
    app = await createTestApp();
    jwt = await authenticateTestUser(app);
  });

  describe('POST /spaces/:spaceId/accounts/:id/sync', () => {
    it('should sync account and return updated balance', async () => {
      const { space, account } = await seedTestData();

      const response = await request(app.getHttpServer())
        .post(`/spaces/${space.id}/accounts/${account.id}/sync`)
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: account.id,
          balance: expect.any(Number),
          lastSyncedAt: expect.any(String),
        },
      });

      // Verify side effects
      const transactions = await getTransactionsByAccount(account.id);
      expect(transactions.length).toBeGreaterThan(0);
    });
  });
});

// E2E test example
describe('Onboarding Flow', () => {
  it('should complete full onboarding process', async () => {
    // Register user
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('[type="submit"]');

    // Verify email
    await page.waitForURL('/verify-email');
    const verificationCode = await getTestEmailCode();
    await page.fill('[name="code"]', verificationCode);
    await page.click('[type="submit"]');

    // Create first space
    await page.waitForURL('/onboarding/space');
    await page.fill('[name="spaceName"]', 'Personal Finances');
    await page.click('[value="personal"]');
    await page.click('[type="submit"]');

    // Connect first account
    await page.waitForURL('/onboarding/connect');
    await page.click('[data-provider="belvo"]');
    // ... complete connection flow

    // Verify dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Personal Finances');
  });
});
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Initialize monorepo structure
- Set up development environment
- Implement authentication system
- Create base UI components
- Set up CI/CD pipeline

### Phase 2: Core Features (Weeks 3-6)
- Implement space management
- Build account connectivity
- Create transaction management
- Develop categorization engine
- Implement budget tracking

### Phase 3: Integrations (Weeks 7-8)
- Integrate Belvo for Mexico
- Integrate Plaid for US
- Add Bitso integration
- Implement webhook handlers
- Add encryption layer

### Phase 4: Analytics & Polish (Weeks 9-10)
- Build analytics dashboards
- Implement forecasting
- Add ESG scoring
- Create mobile app
- Performance optimization

### Phase 5: Launch Preparation (Weeks 11-12)
- Security audit
- Load testing
- Documentation
- Beta testing
- Production deployment

This architecture provides a solid foundation for building a scalable, secure, and maintainable financial management platform that can grow with your users' needs.