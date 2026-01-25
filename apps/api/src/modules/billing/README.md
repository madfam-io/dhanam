# Billing Module

> Subscription management, usage tracking, and payment processing with multi-provider support via Janua.

## Purpose

The Billing module handles all payment and subscription operations:

- **Subscription Management**: Free/Premium tier transitions
- **Multi-Provider Billing**: Janua integration for Conekta (MX) and Polar (international)
- **Stripe Fallback**: Direct Stripe integration as backup
- **Usage Tracking**: Monitor feature usage per tier
- **Webhook Handling**: Process payment events from all providers
- **MADFAM Integration**: Enclii → Dhanam → Janua payment loop

## Key Entities

| Entity | Description |
|--------|-------------|
| `BillingService` | Main billing orchestration |
| `StripeService` | Stripe API wrapper |
| `JanuaBillingService` | Janua multi-provider integration |
| `BillingEvent` | Payment history records |
| `UsageMetric` | Daily feature usage tracking |

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Billing Service                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   upgradeToPremium()                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│              ┌─────────────┼─────────────┐                      │
│              ▼             │             ▼                      │
│  ┌───────────────────┐    │   ┌───────────────────┐            │
│  │       Janua       │    │   │   Stripe Direct   │            │
│  │  (Multi-provider) │◄───┘   │    (Fallback)     │            │
│  └─────────┬─────────┘        └─────────┬─────────┘            │
│            │                            │                       │
│     ┌──────┼──────┐                     │                       │
│     ▼      ▼      ▼                     ▼                       │
│  ┌──────┐ ┌────┐ ┌─────┐          ┌──────────┐                 │
│  │Conekta│ │Polar│ │More│         │  Stripe  │                 │
│  │ (MX) │ │(Intl)│ │... │          │   API   │                 │
│  └──────┘ └────┘ └─────┘          └──────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Limited usage (see limits below) |
| **Premium** | $9.99/mo | Unlimited usage |

### Usage Limits (Free Tier)

| Feature | Daily Limit |
|---------|-------------|
| ESG Calculations | 10 |
| Monte Carlo Simulations | 3 |
| Goal Probability | 3 |
| Scenario Analysis | 1 |
| Portfolio Rebalance | 0 (Premium only) |
| API Requests | 1,000 |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/billing/upgrade` | POST | Initiate premium upgrade |
| `/billing/portal` | POST | Create billing portal session |
| `/billing/usage` | GET | Get current usage statistics |
| `/billing/history` | GET | Get payment history |
| `/billing/limits` | GET | Get usage limits configuration |
| `/billing/webhook/stripe` | POST | Stripe webhook handler |
| `/billing/webhook/janua` | POST | Janua webhook handler |

## Upgrade Flow

### With Janua (Primary)

```
1. User initiates upgrade
2. Detect country code → select provider (Conekta/Polar)
3. Create/get Janua customer
4. Create checkout session via Janua
5. Redirect to provider checkout
6. Webhook confirms payment
7. Upgrade user to premium
8. Notify Janua identity system (if org-linked)
```

### With Stripe (Fallback)

```
1. User initiates upgrade
2. Create/get Stripe customer
3. Create checkout session
4. Redirect to Stripe checkout
5. Webhook confirms payment
6. Upgrade user to premium
```

## Provider Selection

| Country | Provider | Payment Methods |
|---------|----------|-----------------|
| Mexico (MX) | Conekta | Cards, OXXO, SPEI |
| International | Polar | Cards |
| Fallback | Stripe | Cards |

## Webhook Events

### Stripe Events

| Event | Handler |
|-------|---------|
| `customer.subscription.created` | `handleSubscriptionCreated` |
| `customer.subscription.updated` | `handleSubscriptionUpdated` |
| `customer.subscription.deleted` | `handleSubscriptionCancelled` |
| `invoice.payment_succeeded` | `handlePaymentSucceeded` |
| `invoice.payment_failed` | `handlePaymentFailed` |

### Janua Events

| Event | Handler |
|-------|---------|
| `subscription.created` | `handleJanuaSubscriptionCreated` |
| `subscription.updated` | `handleJanuaSubscriptionUpdated` |
| `subscription.cancelled` | `handleJanuaSubscriptionCancelled` |
| `subscription.paused` | `handleJanuaSubscriptionPaused` |
| `subscription.resumed` | `handleJanuaSubscriptionResumed` |
| `payment.succeeded` | `handleJanuaPaymentSucceeded` |
| `payment.failed` | `handleJanuaPaymentFailed` |
| `payment.refunded` | `handleJanuaPaymentRefunded` |

## MADFAM Integration

The billing module supports the Enclii → Dhanam → Janua payment loop:

```
┌────────┐     ┌────────┐     ┌────────┐
│ Enclii │ ──► │ Dhanam │ ──► │ Janua  │
└────────┘     └────────┘     └────────┘
    │              │              │
    │  orgId       │  upgrade     │  customer
    └──────────────┼──────────────┘
                   │
                   ▼
              ┌──────────┐
              │ Provider │
              │(Conekta/ │
              │  Polar)  │
              └──────────┘
```

### Organization Linking

When upgrading with an `orgId`:
1. Payment processed through provider
2. Dhanam notifies Janua of tier change
3. Janua updates organization's `subscription_tier`
4. Enables premium features across MADFAM apps

## Usage Tracking

```typescript
// Record usage
await billing.recordUsage(userId, UsageMetricType.ESG_CALCULATION);

// Check limit before operation
const allowed = await billing.checkUsageLimit(userId, UsageMetricType.MONTE_CARLO);
if (!allowed) {
  throw new Error('Usage limit exceeded');
}
```

## Configuration

```bash
# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx

# Janua
JANUA_API_URL=https://api.janua.dev
JANUA_API_KEY=xxx
JANUA_WEBHOOK_SECRET=xxx
DHANAM_WEBHOOK_SECRET=xxx  # For notifying Janua

# General
WEB_URL=https://app.dhan.am
```

## Security

- **Webhook Verification**: All webhooks verified with HMAC signatures
- **Audit Logging**: All billing actions logged with severity levels
- **PCI Compliance**: No card data stored; handled by Stripe/Conekta
- **Idempotency**: Webhook handlers are idempotent

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Payment failed | Log event, don't downgrade (retry expected) |
| Webhook verification failed | Reject with 401 |
| User not found | Log error, acknowledge webhook |
| Already premium | Throw error (400) |

## Related Modules

| Module | Relationship |
|--------|--------------|
| [`users`](../users/README.md) | User subscription tier stored |
| [`simulations`](../simulations/README.md) | Uses usage limits for Monte Carlo |
| [`esg`](../esg/README.md) | Uses usage limits for ESG calculations |
| [`analytics`](../analytics/README.md) | Uses usage limits for reports |

## Testing

```bash
# Run billing tests
pnpm test -- billing

# Test webhooks locally with Stripe CLI
stripe listen --forward-to localhost:4010/billing/webhook/stripe
```

---

**Module**: `billing`
**Last Updated**: January 2025
