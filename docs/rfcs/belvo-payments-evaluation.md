# RFC: Belvo Payments vs Stripe MX SPEI Evaluation

**Status:** Proposed
**Date:** 2026-04-07
**Author:** Engineering Team
**Stakeholders:** Payments, Compliance, Product

## Summary

This document evaluates Belvo Payments and Stripe MX (SPEI) as payment processing options for Dhanam in the Mexican market. The decision determines how Dhanam collects subscription payments and processes financial transactions for LATAM-first users.

## Background

Dhanam currently uses Stripe as its primary billing provider (see ADR-003 for the multi-provider strategy and the billing module at `apps/api/src/modules/billing/`). As Dhanam expands its Mexico-first offering, we need to support SPEI (Sistema de Pagos Electronicos Interbancarios), the dominant real-time interbank transfer system in Mexico. Two viable paths exist: adding Belvo Payments as a dedicated Mexico payments layer, or using Stripe's native SPEI support through Stripe MX.

## Feature Comparison

| Capability             | Belvo Payments                                 | Stripe MX SPEI                                              |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| SPEI transfers         | Yes (native)                                   | Yes (via payment methods API)                               |
| Card payments          | No (data-only for cards)                       | Yes (Visa, Mastercard, Amex)                                |
| OXXO cash payments     | No                                             | Yes (via voucher payment method)                            |
| Recurring billing      | Limited (manual re-initiation)                 | Yes (Stripe Billing, subscriptions, invoices)               |
| Webhook notifications  | Yes                                            | Yes (mature, well-documented)                               |
| Refund handling        | Manual via SPEI return                         | Automated via Stripe dashboard and API                      |
| Multi-currency         | MXN only                                       | MXN, USD, and 135+ currencies                               |
| Payout management      | Not applicable (payment initiation only)       | Yes (Stripe Connect, automated payouts)                     |
| Dispute resolution     | Handled outside Belvo                          | Built-in dispute management                                 |
| Open banking data      | Yes (account balances, transactions, identity) | No (payments only)                                          |
| Subscription lifecycle | Not supported                                  | Full lifecycle (trials, upgrades, cancellations, proration) |
| Invoice generation     | Not supported                                  | Built-in invoicing with tax support                         |
| Customer portal        | Not available                                  | Stripe Customer Portal (self-serve)                         |
| Mobile SDK             | Limited                                        | Stripe Mobile SDK (iOS, Android, React Native)              |

## Pricing Model Comparison

| Cost Component       | Belvo Payments                               | Stripe MX SPEI               |
| -------------------- | -------------------------------------------- | ---------------------------- |
| SPEI transaction fee | ~0.5-1.0% per transaction (volume-dependent) | 0.80% per transaction        |
| Card transaction fee | Not available                                | 3.6% + MXN $3.00             |
| OXXO transaction fee | Not available                                | 3.0% + MXN $5.00             |
| Monthly platform fee | Custom enterprise pricing                    | None (pay per transaction)   |
| Setup fee            | Negotiable                                   | None                         |
| Chargeback fee       | Not applicable                               | MXN $150 per dispute         |
| Payout fee           | Not applicable                               | Included (T+3 business days) |
| API call pricing     | Included in transaction fee                  | Included in transaction fee  |

### Total Cost of Ownership Analysis

For a subscription business processing 10,000 MXN transactions per month at an average of MXN $299:

| Scenario                     | Belvo Payments (est.)           | Stripe MX                         |
| ---------------------------- | ------------------------------- | --------------------------------- |
| SPEI only                    | ~MXN $14,950-$29,900            | MXN $23,920                       |
| SPEI + Cards (70/30 split)   | Not possible with Belvo alone   | MXN $39,062                       |
| Engineering integration cost | High (custom billing logic)     | Low (existing Stripe integration) |
| Ongoing maintenance          | Two payment systems to maintain | Single system                     |

## Integration Complexity

### Belvo Payments

Adding Belvo Payments requires building a parallel payment processing path alongside the existing Stripe integration:

- **New service layer.** A `BelvoPaymentService` must handle payment initiation, status polling or webhook processing, and reconciliation against Dhanam's internal ledger.
- **No subscription primitives.** Belvo does not manage subscription state. Dhanam would need to build retry logic, dunning (failed payment recovery), grace periods, and plan change proration from scratch.
- **Separate reconciliation.** Payments from Belvo and Stripe would need to be unified into a single billing view, adding complexity to the admin dashboard and reporting.
- **Limited SDK maturity.** Belvo's payment APIs are newer than their data APIs. Documentation coverage and community examples are thinner.

Estimated integration effort: 4-6 weeks for a production-ready implementation, plus ongoing maintenance of a second payment code path.

### Stripe MX SPEI

SPEI via Stripe uses the existing `PaymentIntent` API with `payment_method_types: ["customer_balance"]` and bank transfer instructions:

- **Existing infrastructure.** Dhanam already integrates Stripe for billing (see `apps/api/src/modules/billing/`). Adding SPEI is a configuration change, not an architectural change.
- **Subscription support.** Stripe Billing handles the full subscription lifecycle. SPEI can be added as an additional payment method on existing subscriptions.
- **Unified webhooks.** SPEI payment events arrive through the same Stripe webhook endpoint that Dhanam already processes.
- **Dashboard and reporting.** All payments (card, SPEI, OXXO) appear in a single Stripe dashboard and flow through the same reconciliation logic.

Estimated integration effort: 1-2 weeks to enable SPEI as a payment method and update the frontend to display bank transfer instructions.

## Regulatory Compliance (CNBV)

Both providers operate within Mexico's regulatory framework, but their compliance postures differ:

| Requirement                                                 | Belvo Payments                                                                        | Stripe MX                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| CNBV (Comision Nacional Bancaria y de Valores) registration | Operates as an IFPE (Institucion de Fondos de Pago Electronico) under the Fintech Law | Operates through a local acquiring entity licensed in Mexico             |
| PCI DSS compliance                                          | Level 1 (for data APIs); payment APIs inherit bank-level compliance                   | Level 1 Service Provider                                                 |
| Data residency                                              | Data processed in Mexico and Colombia infrastructure                                  | Data processed in Stripe's global infrastructure with MX payment routing |
| AML/KYC                                                     | Delegated to originating banks                                                        | Built-in Radar fraud detection; KYC via Stripe Identity                  |
| SAT (tax authority) integration                             | Not provided                                                                          | CFDI invoice support via Stripe Tax                                      |
| Ley Fintech compliance                                      | Yes (core to their operating model)                                                   | Yes (through local entity structure)                                     |

### Key regulatory consideration

Under Mexico's Ley Fintech, payment initiators must be registered as IFPEs or operate through a licensed partner. Both Belvo and Stripe satisfy this requirement. However, Stripe's local acquiring entity provides a more straightforward compliance story for Dhanam because Dhanam does not need to manage a direct regulatory relationship with CNBV -- Stripe absorbs that responsibility.

## Recommendation

**Use Stripe MX for SPEI payments. Do not add Belvo Payments at this time.**

### Rationale

1. **Integration cost.** Dhanam already has a working Stripe integration. Adding SPEI through Stripe requires minimal new code. Adding Belvo Payments requires a parallel payment system with custom subscription logic.

2. **Feature coverage.** Stripe provides cards, SPEI, and OXXO through a single API. Belvo provides SPEI only. For a subscription business, card payments remain the primary method; SPEI is an additional option for users who prefer bank transfers.

3. **Subscription management.** Stripe handles the complete subscription lifecycle (trials, upgrades, downgrades, dunning, proration). With Belvo, Dhanam would need to build these capabilities, which is a significant engineering investment with no product differentiation.

4. **Operational simplicity.** A single payment provider means one webhook endpoint, one reconciliation path, one admin dashboard, and one set of compliance documentation. Dual providers double the operational surface area.

5. **Regulatory simplicity.** Stripe's local entity absorbs CNBV compliance obligations. With Belvo Payments, Dhanam would need to understand and potentially share compliance responsibilities as a payment initiator.

### When Belvo Payments would make sense

Belvo Payments becomes a stronger candidate if any of the following conditions change:

- Dhanam needs to initiate payments from user bank accounts (pull payments / direct debit), which Stripe does not support in Mexico.
- Belvo adds subscription billing primitives, reducing the custom engineering required.
- Dhanam's transaction volume makes Belvo's negotiated pricing materially cheaper than Stripe's fixed rates.
- Regulatory requirements mandate using a Mexican-domiciled IFPE for payment initiation.

### Belvo Data APIs remain valuable

This recommendation applies to **Belvo Payments** only. Belvo's **data APIs** (account aggregation, transaction history, identity verification) remain part of Dhanam's provider strategy for read-only financial data access in Mexico (see the provider integration patterns in the project overview). The data and payment products are evaluated independently.

## Related Documents

- [ADR-003: Multi-Provider Strategy](../adr/003-multi-provider-strategy.md)
- [ADR-004: Janua Auth Integration](../adr/004-janua-auth-integration.md)
- [ADR-005: Enclii Deployment](../adr/005-enclii-deployment.md)
