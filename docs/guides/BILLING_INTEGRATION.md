# Billing Integration Guide

> Subscription management, payment processing, and usage tracking with multi-provider support.

## Overview

Dhanam's billing system supports:

- **Multi-Provider Payments**: Janua (Conekta MX, Polar international), Stripe (fallback)
- **Subscription Tiers**: Free and Premium with usage-based limits
- **Usage Tracking**: Per-feature metering with daily limits
- **Webhook Processing**: Real-time subscription and payment events

## Subscription Tiers

### Free Tier

| Feature | Daily Limit |
|---------|-------------|
| ESG Calculations | 10 |
| Monte Carlo Simulations | 3 |
| Goal Probability Analysis | 3 |
| Scenario Analysis | 1 |
| Portfolio Rebalancing | Not available |
| API Requests | 1,000 |

### Premium Tier

| Feature | Limit |
|---------|-------|
| All Features | Unlimited |

## Payment Providers

### Provider Selection by Region

| Region | Primary Provider | Fallback |
|--------|------------------|----------|
| Mexico (MX) | Conekta (via Janua) | Stripe MX |
| LATAM | Polar (via Janua) | Stripe |
| US/Canada | Polar (via Janua) | Stripe |
| Other | Stripe | - |

### Janua Integration

Janua is MADFAM's unified billing platform that routes to:
- **Conekta**: Mexican peso payments, local payment methods (OXXO, SPEI)
- **Polar**: International payments, multiple currencies

### Stripe Integration

Direct Stripe integration serves as fallback when Janua is unavailable.

## API Endpoints

### Subscription Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/billing/upgrade` | Initiate premium upgrade |
| `POST` | `/billing/portal` | Create billing portal session |
| `GET` | `/billing/usage` | Get current usage metrics |
| `GET` | `/billing/history` | Get billing event history |
| `GET` | `/billing/limits` | Get tier limits configuration |

### Webhooks

| Endpoint | Provider | Description |
|----------|----------|-------------|
| `POST` | `/billing/webhooks/stripe` | Stripe webhook handler |
| `POST` | `/billing/webhooks/janua` | Janua webhook handler |

## Usage Examples

### Upgrade to Premium

```typescript
const response = await fetch('/api/billing/upgrade', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    countryCode: 'MX',  // Optional, for provider selection
  }),
});

// Response
{
  "checkoutUrl": "https://checkout.janua.dev/session/xxx",
  "provider": "conekta"
}

// Redirect user to checkout URL
window.location.href = response.checkoutUrl;
```

### Check Usage Limits

```typescript
const usage = await fetch('/api/billing/usage', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
});

// Response
{
  "date": "2025-01-23T00:00:00.000Z",
  "tier": "free",
  "usage": {
    "esg_calculation": { "used": 7, "limit": 10 },
    "monte_carlo_simulation": { "used": 2, "limit": 3 },
    "goal_probability": { "used": 0, "limit": 3 },
    "scenario_analysis": { "used": 1, "limit": 1 },
    "portfolio_rebalance": { "used": 0, "limit": 0 },
    "api_request": { "used": 234, "limit": 1000 }
  }
}
```

### Access Billing Portal

```typescript
const response = await fetch('/api/billing/portal', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
});

// Response
{
  "portalUrl": "https://billing.stripe.com/session/xxx"
}

// Redirect user to manage subscription
window.location.href = response.portalUrl;
```

## Protecting Premium Features

### Using Decorators

```typescript
import { RequiresTier } from '@modules/billing/decorators';
import { TrackUsage } from '@modules/billing/decorators';

@Controller('simulations')
export class SimulationsController {

  // Requires premium tier
  @RequiresTier('premium')
  @Post('portfolio-rebalance')
  async rebalancePortfolio() {
    // Only premium users can access
  }

  // Track usage for free tier limits
  @TrackUsage('monte_carlo_simulation')
  @Post('monte-carlo')
  async runMonteCarlo() {
    // Usage is tracked, limit enforced
  }
}
```

### Using Guards

```typescript
import { SubscriptionGuard } from '@modules/billing/guards';
import { UsageLimitGuard } from '@modules/billing/guards';

@UseGuards(AuthGuard, SubscriptionGuard)
@Controller('premium')
export class PremiumController {
  // All routes require active subscription
}

@UseGuards(AuthGuard, UsageLimitGuard)
@Controller('metered')
export class MeteredController {
  // All routes check usage limits
}
```

## Webhook Events

### Stripe Events

| Event | Handler | Action |
|-------|---------|--------|
| `customer.subscription.created` | `handleSubscriptionCreated` | Upgrade to premium |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Update expiration |
| `customer.subscription.deleted` | `handleSubscriptionCancelled` | Downgrade to free |
| `invoice.payment_succeeded` | `handlePaymentSucceeded` | Log payment |
| `invoice.payment_failed` | `handlePaymentFailed` | Log failure, alert user |

### Janua Events

| Event | Handler | Action |
|-------|---------|--------|
| `subscription.created` | `handleJanuaSubscriptionCreated` | Upgrade to premium |
| `subscription.updated` | `handleJanuaSubscriptionUpdated` | Update tier |
| `subscription.cancelled` | `handleJanuaSubscriptionCancelled` | Downgrade to free |
| `subscription.paused` | `handleJanuaSubscriptionPaused` | Mark as paused |
| `subscription.resumed` | `handleJanuaSubscriptionResumed` | Reactivate premium |
| `payment.succeeded` | `handleJanuaPaymentSucceeded` | Log payment |
| `payment.failed` | `handleJanuaPaymentFailed` | Log failure |
| `payment.refunded` | `handleJanuaPaymentRefunded` | Log refund |

## Database Schema

### User Billing Fields

```prisma
model User {
  subscriptionTier      SubscriptionTier @default(free)
  subscriptionStartedAt DateTime?
  subscriptionExpiresAt DateTime?

  // Provider-specific IDs
  stripeCustomerId      String?
  stripeSubscriptionId  String?
  januaCustomerId       String?
  billingProvider       String?   // 'stripe', 'conekta', 'polar'
}
```

### Usage Tracking

```prisma
model UsageMetric {
  id         String         @id @default(cuid())
  userId     String
  metricType UsageMetricType
  date       DateTime       @db.Date
  count      Int            @default(0)

  @@unique([userId, metricType, date])
}

enum UsageMetricType {
  esg_calculation
  monte_carlo_simulation
  goal_probability
  scenario_analysis
  portfolio_rebalance
  api_request
}
```

### Billing Events

```prisma
model BillingEvent {
  id              String   @id @default(cuid())
  userId          String
  eventType       String   // subscription_created, payment_succeeded, etc.
  status          String   // succeeded, failed
  provider        String?  // stripe, conekta, polar
  providerEventId String?
  amount          Decimal
  currency        Currency
  metadata        Json?
  createdAt       DateTime @default(now())
}
```

## Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx

# Janua Configuration
JANUA_API_URL=https://api.janua.dev
JANUA_API_KEY=jan_xxx
JANUA_WEBHOOK_SECRET=jwh_xxx
JANUA_ENABLED=true

# URLs
WEB_URL=https://app.dhanam.com
```

## Error Handling

### Custom Exceptions

```typescript
import {
  PaymentRequiredException,
  SubscriptionExpiredException,
  UsageLimitExceededException
} from '@modules/billing/exceptions';

// Returns 402 Payment Required
throw new PaymentRequiredException('Premium subscription required');

// Returns 403 Forbidden
throw new SubscriptionExpiredException('Subscription has expired');

// Returns 429 Too Many Requests
throw new UsageLimitExceededException('Daily limit reached for ESG calculations');
```

## Testing

### Test Mode

```typescript
// Use test API keys
STRIPE_SECRET_KEY=sk_test_xxx

// Test card numbers
4242424242424242  // Successful payment
4000000000000002  // Declined payment
4000000000000341  // Attaches but fails payment
```

### Webhook Testing

```bash
# Stripe CLI for local webhook testing
stripe listen --forward-to localhost:4010/billing/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
```

## Audit Logging

All billing operations are logged:

| Action | Severity | Details |
|--------|----------|---------|
| `BILLING_UPGRADE_INITIATED` | Medium | Session ID, provider |
| `SUBSCRIPTION_ACTIVATED` | High | Tier, subscription ID |
| `SUBSCRIPTION_CANCELLED` | Medium | Subscription ID |
| `PAYMENT_FAILED` | High | Amount, invoice ID |

## Related Documentation

- [API Reference](../API.md)
- [Authentication Guide](./AUTH_GUIDE.md)
- [Janua SSO Integration](./JANUA_INTEGRATION.md)

---

**Module**: `apps/api/src/modules/billing/`
**Status**: Production
**Last Updated**: January 2025
