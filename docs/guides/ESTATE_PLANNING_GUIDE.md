# Estate Planning Guide

> Comprehensive digital will and testament management within Dhanam.

## Overview

Dhanam's estate planning module allows users to create, manage, and maintain digital wills with:

- **Beneficiary Designations**: Allocate assets by type and percentage
- **Executor Management**: Assign primary and backup executors
- **Will Lifecycle**: Draft, activate, revoke workflow
- **Audit Trail**: Complete logging of all will modifications

## Features

### Will Management

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| `draft` | Initial creation, editable | Update, delete, activate |
| `active` | Currently in effect | Revoke only |
| `revoked` | No longer in effect | View only |
| `executed` | Finalized (post-death) | View only |

### Beneficiary Designations

Beneficiaries are designated per asset type with percentage allocations:

```typescript
interface BeneficiaryDesignation {
  willId: string;
  beneficiaryId: string;      // Household member ID
  assetType: AssetType;       // CASH, INVESTMENTS, REAL_ESTATE, etc.
  assetId?: string;           // Specific asset (optional)
  percentage: number;         // Must sum to 100% per asset type
  conditions?: string;        // Conditional inheritance
  notes?: string;
}
```

**Asset Types:**
- `CASH` - Bank accounts, liquid assets
- `INVESTMENTS` - Stocks, bonds, mutual funds
- `REAL_ESTATE` - Property, land
- `CRYPTO` - Cryptocurrency holdings
- `RETIREMENT` - 401k, IRA accounts
- `PERSONAL` - Vehicles, jewelry, other items
- `ALL` - General allocation across all assets

### Executor Assignment

```typescript
interface WillExecutor {
  willId: string;
  executorId: string;         // Household member ID
  isPrimary: boolean;         // Primary executor flag
  order: number;              // Backup order (1, 2, 3...)
  notes?: string;
}
```

## API Endpoints

### Wills

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/estate-planning/wills` | Create new will |
| `GET` | `/estate-planning/wills/:id` | Get will details |
| `GET` | `/estate-planning/households/:id/wills` | List household wills |
| `PATCH` | `/estate-planning/wills/:id` | Update will |
| `DELETE` | `/estate-planning/wills/:id` | Delete draft will |
| `POST` | `/estate-planning/wills/:id/activate` | Activate will |
| `POST` | `/estate-planning/wills/:id/revoke` | Revoke active will |

### Beneficiaries

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/estate-planning/wills/:id/beneficiaries` | Add beneficiary |
| `PATCH` | `/estate-planning/wills/:willId/beneficiaries/:id` | Update beneficiary |
| `DELETE` | `/estate-planning/wills/:willId/beneficiaries/:id` | Remove beneficiary |

### Executors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/estate-planning/wills/:id/executors` | Add executor |
| `PATCH` | `/estate-planning/wills/:willId/executors/:id` | Update executor |
| `DELETE` | `/estate-planning/wills/:willId/executors/:id` | Remove executor |

## Usage Examples

### Create a Will

```typescript
const will = await fetch('/api/estate-planning/wills', {
  method: 'POST',
  body: JSON.stringify({
    householdId: 'hh_123',
    name: 'Primary Will 2025',
    notes: 'Updated after property purchase',
    legalDisclaimer: false,  // Must be true before activation
  }),
});
```

### Add Beneficiaries

```typescript
// Split investments 60/40 between children
await fetch(`/api/estate-planning/wills/${willId}/beneficiaries`, {
  method: 'POST',
  body: JSON.stringify({
    beneficiaryId: 'member_child1',
    assetType: 'INVESTMENTS',
    percentage: 60,
    notes: 'Primary beneficiary for investment accounts',
  }),
});

await fetch(`/api/estate-planning/wills/${willId}/beneficiaries`, {
  method: 'POST',
  body: JSON.stringify({
    beneficiaryId: 'member_child2',
    assetType: 'INVESTMENTS',
    percentage: 40,
  }),
});
```

### Activate Will

```typescript
// Prerequisites:
// - Legal disclaimer accepted
// - At least one beneficiary
// - At least one executor
// - Beneficiary allocations sum to 100% per asset type

await fetch(`/api/estate-planning/wills/${willId}/activate`, {
  method: 'POST',
});
// Note: This automatically revokes any other active will for the household
```

## Validation Rules

### Activation Requirements

1. **Legal Disclaimer**: Must be accepted (`legalDisclaimer: true`)
2. **Beneficiaries**: At least one beneficiary required
3. **Executors**: At least one executor required
4. **Allocation Validation**: Percentages must sum to exactly 100% per asset type

### Modification Restrictions

| Status | Can Modify | Can Delete |
|--------|-----------|------------|
| draft | Yes | Yes |
| active | No (revoke first) | No |
| revoked | No | No |
| executed | No | No |

## Audit Logging

All estate planning operations are logged for compliance:

| Action | Severity | Details Logged |
|--------|----------|----------------|
| `WILL_CREATED` | Medium | Will name, household ID |
| `WILL_UPDATED` | Low | Changed fields |
| `WILL_ACTIVATED` | High | Will name, household ID |
| `WILL_REVOKED` | High | Will name |
| `WILL_DELETED` | Medium | Will name |
| `BENEFICIARY_ADDED` | Medium | Beneficiary ID, asset type, percentage |
| `BENEFICIARY_UPDATED` | Medium | Changed fields |
| `BENEFICIARY_REMOVED` | Medium | Beneficiary designation ID |
| `EXECUTOR_ADDED` | Medium | Executor ID, primary flag |
| `EXECUTOR_UPDATED` | Medium | Changed fields |
| `EXECUTOR_REMOVED` | Medium | Executor ID |

## Security Considerations

- **Access Control**: Only household members can view/modify wills
- **Audit Trail**: All changes are logged with user ID and timestamp
- **Encryption**: Sensitive notes and conditions are encrypted at rest
- **2FA Required**: Activation and revocation require 2FA verification

## Legal Disclaimer

The estate planning feature is intended for **informational and organizational purposes only**. Users should:

1. Consult with a qualified estate planning attorney
2. Ensure compliance with local jurisdiction requirements
3. Understand that digital wills may not be legally binding in all regions
4. Review and update designations regularly

## Related Documentation

- [API Reference](../API.md)
- [Household Management](./HOUSEHOLD_GUIDE.md)
- [Security & Compliance](./SECURITY_GUIDE.md)

---

**Module**: `apps/api/src/modules/estate-planning/`
**Status**: Production
**Last Updated**: January 2025
