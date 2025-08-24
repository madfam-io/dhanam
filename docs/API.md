# Dhanam Ledger API Documentation

## Overview

The Dhanam Ledger API is a RESTful API built with NestJS and Fastify, providing comprehensive financial management capabilities with ESG crypto insights.

**Base URL**: `https://api.dhanam.io/v1` (Production) | `http://localhost:4000` (Development)

**API Version**: v1.0.0

## Authentication

### JWT Token Authentication

The API uses JWT tokens for authentication with rotating refresh tokens.

```http
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token**: 15 minutes lifetime
- **Refresh Token**: 30 days lifetime, rotates on use
- **2FA Required**: For admin operations and sensitive actions

### Authentication Endpoints

#### POST /auth/login
Login with email and password.

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "locale": "en",
    "twoFactorEnabled": false
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/logout
Logout and invalidate tokens.

#### POST /auth/register
Create new user account.

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securepassword",
  "locale": "en"
}
```

## Core Resources

### Spaces

Spaces represent isolated financial environments (Personal/Business).

#### GET /spaces
List user's spaces.

**Response:**
```json
[
  {
    "id": "space_123",
    "name": "Personal Finances",
    "type": "personal",
    "currency": "USD",
    "createdAt": "2024-01-01T00:00:00Z",
    "accounts": [
      {
        "id": "acc_123",
        "name": "Chase Checking",
        "balance": 2500.00,
        "provider": "plaid"
      }
    ]
  }
]
```

#### POST /spaces
Create a new space.

```json
{
  "name": "Business Accounts",
  "type": "business",
  "currency": "MXN"
}
```

#### PUT /spaces/:id
Update space details.

#### DELETE /spaces/:id
Delete space (admin only).

### Accounts

Financial accounts connected through various providers.

#### GET /accounts
List accounts for a space.

**Query Parameters:**
- `spaceId` (required): Space identifier
- `provider`: Filter by provider (plaid, belvo, bitso, manual)
- `type`: Filter by account type (checking, savings, credit, crypto, investment)

**Response:**
```json
[
  {
    "id": "acc_123",
    "name": "Chase Checking",
    "type": "checking",
    "provider": "plaid",
    "currency": "USD",
    "balance": 2500.00,
    "lastSyncedAt": "2024-01-01T12:00:00Z",
    "isActive": true,
    "metadata": {
      "institutionName": "Chase",
      "accountNumber": "****1234",
      "routingNumber": "****5678"
    }
  }
]
```

#### POST /accounts/sync
Trigger manual account synchronization.

```json
{
  "spaceId": "space_123",
  "accountIds": ["acc_123", "acc_456"]
}
```

#### PUT /accounts/:id
Update account settings.

```json
{
  "name": "My Checking Account",
  "isActive": false
}
```

#### DELETE /accounts/:id
Disconnect account.

### Transactions

Financial transactions with auto-categorization.

#### GET /transactions
List transactions for a space.

**Query Parameters:**
- `spaceId` (required): Space identifier
- `accountId`: Filter by account
- `categoryId`: Filter by category
- `type`: Filter by type (income, expense, transfer)
- `startDate`: ISO date string
- `endDate`: ISO date string
- `limit`: Number of results (default: 50, max: 200)
- `offset`: Pagination offset
- `search`: Search in description and merchant name

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn_123",
      "amount": -45.67,
      "currency": "USD",
      "description": "Starbucks Coffee",
      "merchantName": "Starbucks",
      "date": "2024-01-01T10:00:00Z",
      "type": "expense",
      "status": "posted",
      "category": {
        "id": "cat_123",
        "name": "Coffee & Dining",
        "color": "#FF6B35"
      },
      "account": {
        "id": "acc_123",
        "name": "Chase Checking"
      },
      "location": {
        "address": "123 Main St, New York, NY",
        "coordinates": {
          "lat": 40.7128,
          "lon": -74.0060
        }
      },
      "tags": ["business-expense", "client-meeting"]
    }
  ],
  "pagination": {
    "total": 1250,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST /transactions
Create manual transaction.

```json
{
  "spaceId": "space_123",
  "accountId": "acc_123",
  "amount": -25.50,
  "description": "Coffee with client",
  "merchantName": "Local Café",
  "date": "2024-01-01T14:30:00Z",
  "categoryId": "cat_123",
  "tags": ["business", "client-meeting"]
}
```

#### PUT /transactions/:id
Update transaction (categorization, tags).

```json
{
  "categoryId": "cat_456",
  "tags": ["updated-category"],
  "notes": "Updated categorization"
}
```

#### POST /transactions/categorize
Bulk categorize transactions using rules.

```json
{
  "spaceId": "space_123",
  "transactionIds": ["txn_123", "txn_456"],
  "categoryId": "cat_789"
}
```

### Budgets

Budget management with category-based tracking.

#### GET /budgets
List budgets for a space.

**Query Parameters:**
- `spaceId` (required): Space identifier
- `period`: Filter by period (monthly, quarterly, yearly)
- `status`: Filter by status (active, exceeded, completed)

**Response:**
```json
[
  {
    "id": "budget_123",
    "name": "Monthly Food Budget",
    "amount": 800.00,
    "spent": 456.78,
    "remaining": 343.22,
    "currency": "USD",
    "period": "monthly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "status": "active",
    "categories": [
      {
        "id": "cat_123",
        "name": "Groceries",
        "allocated": 500.00,
        "spent": 278.45
      },
      {
        "id": "cat_124", 
        "name": "Restaurants",
        "allocated": 300.00,
        "spent": 178.33
      }
    ],
    "alerts": {
      "threshold": 80,
      "enabled": true
    }
  }
]
```

#### POST /budgets
Create new budget.

```json
{
  "spaceId": "space_123",
  "name": "Q1 Marketing Budget",
  "amount": 5000.00,
  "period": "quarterly",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "categoryIds": ["cat_123", "cat_124"],
  "alertThreshold": 75
}
```

#### PUT /budgets/:id
Update budget.

#### DELETE /budgets/:id
Delete budget.

### Categories

Transaction categories with auto-categorization rules.

#### GET /categories
List categories for a space.

**Response:**
```json
[
  {
    "id": "cat_123",
    "name": "Food & Dining",
    "color": "#FF6B35",
    "icon": "restaurant",
    "type": "expense",
    "parentId": null,
    "isSystem": false,
    "rules": [
      {
        "id": "rule_123",
        "condition": "merchant_contains",
        "value": "starbucks",
        "priority": 100
      }
    ],
    "subcategories": [
      {
        "id": "cat_124",
        "name": "Coffee",
        "parentId": "cat_123"
      }
    ]
  }
]
```

#### POST /categories
Create new category.

```json
{
  "spaceId": "space_123",
  "name": "Business Travel",
  "color": "#2196F3",
  "icon": "airplane",
  "type": "expense",
  "parentId": "cat_parent",
  "rules": [
    {
      "condition": "description_contains",
      "value": "uber",
      "priority": 90
    }
  ]
}
```

#### PUT /categories/:id
Update category.

#### DELETE /categories/:id
Delete category.

## Provider Integrations

### Plaid (US Banking)

#### POST /providers/plaid/create-link
Create Plaid Link token for account connection.

```json
{
  "spaceId": "space_123",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "linkToken": "link-sandbox-12345...",
  "expiration": "2024-01-01T01:00:00Z"
}
```

#### POST /providers/plaid/exchange-token
Exchange public token for access token after Plaid Link.

```json
{
  "spaceId": "space_123",
  "publicToken": "public-sandbox-12345...",
  "metadata": {
    "institution": {
      "name": "Chase",
      "institution_id": "ins_1"
    },
    "accounts": [
      {
        "id": "account_1",
        "name": "Chase Checking",
        "type": "depository",
        "subtype": "checking"
      }
    ]
  }
}
```

#### POST /providers/plaid/webhook
Plaid webhook handler (internal use).

### Belvo (Mexican Banking)

#### POST /providers/belvo/create-link
Create Belvo Link session.

```json
{
  "spaceId": "space_123",
  "institution": "banamex"
}
```

#### POST /providers/belvo/connect
Connect Belvo account with credentials.

```json
{
  "spaceId": "space_123",
  "institution": "banamex",
  "username": "user123",
  "password": "secure_password"
}
```

#### POST /providers/belvo/webhook
Belvo webhook handler (internal use).

### Bitso (Cryptocurrency)

#### POST /providers/bitso/connect
Connect Bitso account with API credentials.

```json
{
  "spaceId": "space_123",
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret"
}
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "bitso_btc",
      "name": "Bitcoin",
      "symbol": "BTC",
      "balance": 0.025,
      "balanceUSD": 1250.00
    }
  ],
  "message": "Successfully connected Bitso account"
}
```

#### POST /providers/bitso/sync
Sync Bitso account balances.

## ESG Scoring

Environmental, Social, and Governance scoring for cryptocurrency assets.

#### GET /esg/scores
Get ESG scores for a space's crypto assets.

**Query Parameters:**
- `spaceId` (required): Space identifier

**Response:**
```json
{
  "portfolioScore": {
    "environmental": 65,
    "social": 78,
    "governance": 82,
    "overall": 75,
    "grade": "B+"
  },
  "scores": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "environmental": 15,
      "social": 75,
      "governance": 85,
      "overall": 58,
      "grade": "C",
      "energyIntensity": 707000,
      "carbonFootprint": 345.6,
      "balance": 0.025,
      "balanceUSD": 1250.00,
      "weight": 0.6
    },
    {
      "symbol": "ETH", 
      "name": "Ethereum",
      "environmental": 75,
      "social": 80,
      "governance": 88,
      "overall": 81,
      "grade": "A-",
      "energyIntensity": 35,
      "carbonFootprint": 2.1,
      "balance": 5.5,
      "balanceUSD": 8250.00,
      "weight": 0.4
    }
  ],
  "trends": [
    {
      "date": "2024-01-01",
      "environmental": 63,
      "social": 76,
      "governance": 80,
      "overall": 73
    }
  ],
  "impactMetrics": {
    "totalCarbonFootprint": 347.7,
    "renewableEnergyScore": 45,
    "lowCarbonAllocation": 40
  }
}
```

#### GET /esg/methodology
Get ESG scoring methodology documentation.

**Response:**
```json
{
  "version": "2.0",
  "framework": "Dhanam ESG Framework",
  "components": {
    "environmental": {
      "weight": 0.4,
      "factors": [
        "Energy consumption per transaction",
        "Carbon footprint",
        "Renewable energy usage",
        "Consensus mechanism efficiency"
      ]
    },
    "social": {
      "weight": 0.3,
      "factors": [
        "Financial inclusion",
        "Community governance",
        "Developer activity",
        "Educational resources"
      ]
    },
    "governance": {
      "weight": 0.3,
      "factors": [
        "Protocol governance",
        "Transparency",
        "Regulatory compliance",
        "Risk management"
      ]
    }
  },
  "grading": {
    "A+": "90-100",
    "A": "80-89",
    "B": "70-79",
    "C": "60-69",
    "D": "40-59",
    "F": "0-39"
  }
}
```

## Analytics & Reporting

### GET /analytics/dashboard
Get dashboard analytics for a space.

**Query Parameters:**
- `spaceId` (required): Space identifier
- `period`: Time period (7d, 30d, 90d, 1y)

**Response:**
```json
{
  "netWorth": {
    "current": 125000.00,
    "change": 2500.00,
    "changePercent": 2.04,
    "trend": "up"
  },
  "cashFlow": {
    "income": 8500.00,
    "expenses": 6200.00,
    "net": 2300.00,
    "period": "30d"
  },
  "accounts": {
    "total": 8,
    "banking": 5,
    "crypto": 2,
    "investment": 1
  },
  "budgetCompliance": {
    "onTrack": 4,
    "atRisk": 2,
    "exceeded": 1
  },
  "topCategories": [
    {
      "category": "Food & Dining",
      "amount": 856.78,
      "percentage": 13.8
    },
    {
      "category": "Transportation",
      "amount": 654.32,
      "percentage": 10.6
    }
  ]
}
```

### GET /analytics/forecast
Get 60-day cashflow forecast.

**Response:**
```json
{
  "forecast": [
    {
      "week": "2024-01-01",
      "projectedIncome": 2125.00,
      "projectedExpenses": 1850.00,
      "netFlow": 275.00,
      "confidence": 0.85
    }
  ],
  "summary": {
    "totalProjectedIncome": 17000.00,
    "totalProjectedExpenses": 14800.00,
    "netCashFlow": 2200.00,
    "riskFactors": [
      "High seasonal spending variation",
      "Irregular income patterns"
    ]
  }
}
```

## Error Handling

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `204 No Content` - Successful request with no response body
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed for the provided data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "INVALID_EMAIL"
      }
    ],
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication token invalid or expired
- `FORBIDDEN` - Insufficient permissions for the operation
- `VALIDATION_FAILED` - Request validation errors
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `PROVIDER_ERROR` - External provider integration error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INSUFFICIENT_FUNDS` - Account balance insufficient
- `SYNC_IN_PROGRESS` - Account sync already in progress

## Rate Limiting

API requests are limited to prevent abuse:

- **General endpoints**: 1000 requests per hour per user
- **Authentication endpoints**: 10 requests per minute per IP
- **Provider sync endpoints**: 5 requests per minute per account
- **Bulk operations**: 100 requests per hour per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641024000
```

## Webhooks

### Webhook Security

All webhooks include HMAC signatures for verification:

```http
X-Dhanam-Signature: sha256=1234567890abcdef...
```

### Account Sync Webhook

Triggered when account synchronization completes:

```json
{
  "event": "account.sync.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "spaceId": "space_123",
    "accountId": "acc_123",
    "transactionsAdded": 15,
    "balanceUpdated": true,
    "syncDuration": 2345
  }
}
```

### Budget Alert Webhook

Triggered when budget thresholds are exceeded:

```json
{
  "event": "budget.alert.threshold_exceeded",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "budgetId": "budget_123",
    "spaceId": "space_123",
    "currentSpent": 850.00,
    "budgetAmount": 1000.00,
    "threshold": 80,
    "percentageSpent": 85
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @dhanam/sdk
```

```typescript
import { DhanamAPI } from '@dhanam/sdk';

const dhanam = new DhanamAPI({
  apiKey: 'your_api_key',
  baseURL: 'https://api.dhanam.io/v1'
});

// Get spaces
const spaces = await dhanam.spaces.list();

// Get transactions
const transactions = await dhanam.transactions.list({
  spaceId: 'space_123',
  limit: 50
});
```

### Python SDK

```bash
pip install dhanam-python
```

```python
from dhanam import DhanamAPI

dhanam = DhanamAPI(
    api_key='your_api_key',
    base_url='https://api.dhanam.io/v1'
)

# Get spaces
spaces = dhanam.spaces.list()

# Get transactions
transactions = dhanam.transactions.list(
    space_id='space_123',
    limit=50
)
```

## Testing

### Sandbox Environment

Test API endpoints in sandbox mode:

**Base URL**: `https://api-sandbox.dhanam.io/v1`

### Test Credentials

```json
{
  "email": "demo@dhanam.app",
  "password": "demo123"
}
```

### Mock Data

The sandbox environment includes:
- Sample transactions across multiple categories
- Pre-configured budgets and categories
- Mock ESG scoring data
- Simulated provider connections

## Support

- **API Status**: [status.dhanam.io](https://status.dhanam.io)
- **Documentation**: [docs.dhanam.io](https://docs.dhanam.io)
- **Developer Support**: [dev@dhanam.io](mailto:dev@dhanam.io)
- **Discord Community**: [discord.gg/dhanam](https://discord.gg/dhanam)

---

**Last Updated**: January 2024  
**API Version**: v1.0.0