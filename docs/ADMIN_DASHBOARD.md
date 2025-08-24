# Admin Dashboard Guide

## Overview

The Dhanam Admin Dashboard provides comprehensive tools for system administrators to manage users, monitor system health, analyze user behavior, and control feature releases.

## Access Requirements

- **Role**: User must have `admin` or `owner` role in at least one space
- **URL**: `/admin/dashboard`
- **Authentication**: Valid JWT token required

## Dashboard Sections

### 1. System Overview

The main dashboard displays real-time system statistics:

#### User Metrics
- **Total Users**: All registered users
- **Active Users**: Users who logged in within last 30 days
- **New Users**: Registrations in the last 7 days
- **Verified Users**: Users with verified email addresses
- **2FA Enabled**: Users with TOTP authentication active

#### System Health
- **Database Status**: PostgreSQL connection health
- **Redis Status**: Cache server availability
- **Queue Status**: Background job processing metrics
- **API Response Time**: Average response time (last 5 min)
- **Error Rate**: Failed requests percentage

#### Financial Overview
- **Total Spaces**: Personal + Business spaces
- **Connected Accounts**: By provider (Plaid, Belvo, Bitso, etc.)
- **Transaction Volume**: Last 30 days
- **Active Budgets**: Currently tracked budgets

### 2. User Management

Search and view user information (read-only):

#### Search Filters
- **Email**: Partial match search
- **Name**: Full or partial name search
- **Status**: Active/Inactive
- **Email Verified**: Yes/No
- **TOTP Enabled**: Yes/No
- **Onboarding**: Completed/In Progress
- **Date Range**: Registration date filter

#### User Details View
- Basic Information (name, email, locale, timezone)
- Account Status (active, verified, 2FA)
- Space Memberships (spaces and roles)
- Connected Providers
- Recent Activity
- Audit Trail (last 50 actions)

**Note**: User data is read-only. No modification capabilities are provided through the admin dashboard for security reasons.

### 3. Audit Logs

Comprehensive security audit trail:

#### Log Filters
- **User**: Filter by user email/ID
- **Action**: Specific action types
- **Resource**: Entity type affected
- **Severity**: low/medium/high
- **Date Range**: Custom date selection

#### Log Entry Details
- Timestamp
- User who performed action
- Action type
- Affected resource
- IP address (if available)
- User agent
- Detailed metadata

#### Common Audit Events
- User login/logout
- Password changes
- 2FA enable/disable
- Space creation/deletion
- Provider connections
- Budget modifications
- Admin dashboard access
- Feature flag changes

### 4. Analytics

#### Onboarding Funnel
Visual funnel showing conversion rates for each onboarding step:

1. **Welcome** → Email Verification
2. **Email Verification** → Preferences
3. **Preferences** → Space Setup
4. **Space Setup** → Connect Accounts
5. **Connect Accounts** → First Budget
6. **First Budget** → Feature Tour
7. **Feature Tour** → Completion

Metrics shown:
- Conversion rate per step
- Average time per step
- Abandonment points
- Completion rate by time period

#### Provider Adoption
- Percentage of users with connected accounts
- Breakdown by provider
- Average accounts per user
- Connection success rates

### 5. Feature Flags

Manage feature rollouts and A/B tests:

#### Flag Properties
- **Key**: Unique identifier
- **Name**: Human-readable name
- **Description**: What the feature does
- **Enabled**: Global on/off switch
- **Rollout Percentage**: 0-100% of users
- **Target Users**: Specific user IDs
- **Metadata**: Additional configuration

#### Available Flags (Default)
- `esg_scoring`: ESG features visibility
- `mobile_biometrics`: Mobile biometric auth
- `advanced_budgeting`: Advanced budget features
- `crypto_portfolios`: Crypto portfolio tracking
- `ai_categorization`: AI-powered categorization
- `real_time_sync`: Real-time account sync
- `export_reports`: Report generation
- `multi_currency`: Multi-currency support

#### Flag Management
- Toggle features on/off instantly
- Gradual rollout with percentage control
- User-specific targeting for beta testing
- Audit trail for all changes

## Admin Actions Audit Trail

All admin actions are logged with high severity:

```json
{
  "action": "admin_user_viewed",
  "severity": "medium",
  "entityType": "user",
  "entityId": "user-123",
  "adminId": "admin-456",
  "metadata": {
    "viewedSections": ["details", "spaces", "audit_logs"]
  }
}
```

## Best Practices

### Security
1. **Principle of Least Privilege**: Admin dashboard is read-only for user data
2. **Audit Everything**: All admin actions are logged
3. **Session Security**: Admin sessions expire after 1 hour of inactivity
4. **Two-Factor**: Admins should have 2FA enabled

### Performance
1. **Caching**: System stats are cached for 5 minutes
2. **Pagination**: User lists and logs are paginated (default: 20 items)
3. **Lazy Loading**: User details are fetched on-demand
4. **Background Jobs**: Heavy analytics are processed asynchronously

### Feature Flag Strategy
1. **Start Small**: Begin with 1-5% rollout
2. **Monitor Metrics**: Watch error rates during rollout
3. **Target Beta Users**: Use specific user targeting for testing
4. **Document Changes**: Update flag descriptions
5. **Clean Up**: Remove flags after full rollout

## Troubleshooting

### Common Issues

#### "Access Denied" Error
- Verify user has admin/owner role: `SELECT * FROM user_spaces WHERE user_id = ?`
- Check JWT token hasn't expired
- Confirm space membership is active

#### Statistics Not Updating
- Check Redis connection: `redis-cli ping`
- Clear cache: `redis-cli FLUSHDB`
- Verify background jobs are running

#### Feature Flags Not Working
- Ensure Redis is running
- Check flag key matches exactly
- Verify user ID format in targets
- Review audit logs for recent changes

### Debug Mode

Enable debug logging for admin operations:

```typescript
// In admin.service.ts
this.logger.setLogLevel('debug');
```

### Support Queries

```sql
-- Find all admin users
SELECT DISTINCT u.* 
FROM users u
JOIN user_spaces us ON u.id = us.user_id
WHERE us.role IN ('admin', 'owner');

-- Recent admin actions
SELECT * FROM audit_logs
WHERE severity = 'high'
AND action LIKE 'admin_%'
ORDER BY created_at DESC
LIMIT 50;

-- Feature flag access logs
SELECT * FROM audit_logs
WHERE entity_type = 'feature_flag'
ORDER BY created_at DESC;
```

## API Reference

### Endpoints

```
GET  /api/admin/stats
GET  /api/admin/users?page=1&limit=20&search=john
GET  /api/admin/users/:id
GET  /api/admin/audit-logs?page=1&severity=high
GET  /api/admin/analytics/onboarding?period=7d
GET  /api/admin/feature-flags
POST /api/admin/feature-flags/:key
```

### Response Formats

#### System Stats
```json
{
  "users": {
    "total": 1250,
    "active": 980,
    "new": 45
  },
  "system": {
    "database": "healthy",
    "redis": "healthy",
    "queues": {
      "default": { "active": 5, "waiting": 12 }
    }
  }
}
```

#### Feature Flag Update
```json
{
  "key": "esg_scoring",
  "enabled": true,
  "rolloutPercentage": 25,
  "targetUsers": ["user-123", "user-456"]
}
```

---

For technical implementation details, see:
- [Admin Module Code](../apps/api/src/modules/admin/)
- [Admin UI Components](../apps/web/src/components/admin/)
- [Infrastructure Guide](./INFRASTRUCTURE.md)