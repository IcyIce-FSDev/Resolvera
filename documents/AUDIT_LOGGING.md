# Audit Logging System

Complete guide to the comprehensive activity tracking and audit logging system.

## Overview

Resolvera includes a comprehensive audit logging system that tracks all security-relevant operations. The system provides searchable logs with keyword and date range filtering, automatic user name resolution, and efficient status change detection.

## Features

- **Comprehensive Tracking**: All security-relevant operations are logged
- **Searchable Logs**: Keyword search across actions, resources, IPs, and user agents
- **Date Range Filtering**: Filter logs by time period
- **Auto-Refresh**: Configurable real-time updates (5s, 10s, 30s, 60s)
- **User Tracking**: Automatic user name resolution from User table
- **Status Change Detection**: Only logs meaningful events (reduces noise)
- **Pagination**: Efficient handling of large log volumes
- **Export Ready**: JSON format for easy export/analysis

## What Gets Logged

### Authentication Events
- ✅ `auth.login.success` - Successful login
- ✅ `auth.login.failed` - Failed login attempt
- ✅ `auth.logout` - User logout

### User Management
- ✅ `user.created` - New user account created
- ✅ `user.updated` - User details updated
- ✅ `user.deleted` - User account deleted
- ✅ `user.password_changed` - Password changed

### DNS Operations
- ✅ `dns.record.created` - DNS record added
- ✅ `dns.record.updated` - DNS record modified
- ✅ `dns.record.deleted` - DNS record removed
- ✅ `dns.zone.added` - Zone added to system
- ✅ `dns.zone.removed` - Zone removed from system

### Watcher Operations
- ✅ `watcher.created` - Watcher created
- ✅ `watcher.updated` - Watcher modified
- ✅ `watcher.deleted` - Watcher removed
- ✅ `watcher.toggled` - Watcher enabled/disabled
- ✅ `watcher.check.triggered` - IP check performed (only on status change)
- ✅ `watcher.settings.updated` - Watcher settings changed

### Notification Operations
- ✅ `notifications.settings.updated` - Notification settings changed

### Cache Operations
- ✅ `cache.config.updated` - Cache TTL configuration changed
- ✅ `cache.cleared` - Cache manually cleared

### System Operations
- ✅ `system.settings.updated` - System settings changed
- ✅ `system.security.csrf_blocked` - CSRF attack blocked
- ✅ `system.security.rate_limited` - Rate limit enforced

## Accessing Audit Logs

### Via Admin Panel

1. Navigate to **Admin → Activity Logs**
2. View recent logs in reverse chronological order
3. Use filters to search:
   - **Keyword Search**: Search across multiple fields
   - **Date Range**: Filter by start/end date
   - **Clear Filters**: Reset all filters

### Via API

```bash
# Get recent logs
curl http://localhost:3000/api/admin/audit-logs?limit=50

# Search by keyword
curl http://localhost:3000/api/admin/audit-logs?keyword=login

# Filter by date range
curl "http://localhost:3000/api/admin/audit-logs?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"

# Combined filters
curl "http://localhost:3000/api/admin/audit-logs?action=user.created&severity=info&limit=100"
```

## Search Capabilities

### Keyword Search

The keyword search looks across these fields:
- **Action**: Event type (e.g., "user.created")
- **Resource**: Resource type (e.g., "user", "zone", "watcher")
- **Resource ID**: Specific resource identifier
- **IP Address**: Client IP address
- **User Agent**: Browser/client identifier

**Examples**:
- Search `"192.168"` to find all actions from that IP range
- Search `"watcher"` to find all watcher-related actions
- Search `"john"` to find actions related to user "john"

### Date Range Filtering

Filter logs by time period using start and end dates:

- **Start Date**: Show logs after this date/time
- **End Date**: Show logs before this date/time
- **Timezone**: Dates are handled in your local timezone

**Common Filters**:
- Last 24 hours: Set start date to yesterday
- Last week: Set start date to 7 days ago
- Specific month: Set start/end dates to month boundaries
- Custom range: Any start/end combination

### Combined Filters

You can combine multiple filters:
- Keyword + Date Range
- Keyword + Date Range + Action Type
- Any combination of available filters

## Log Entry Details

Each audit log entry contains:

| Field | Description | Example |
|-------|-------------|---------|
| **Timestamp** | When the event occurred | `2025-01-31 10:30:00` |
| **Action** | Type of operation | `user.created` |
| **Severity** | Log level | `info`, `warning`, `error`, `critical` |
| **User** | Who performed the action | `John Doe (john@example.com)` |
| **IP** | Client IP address | `192.168.1.1` |
| **Resource** | What was affected | `user` |
| **Resource ID** | Specific identifier | `user_abc123` |
| **Status** | Success or failure | `Success` / `Failed` |
| **Details** | Additional context | JSON object with specifics |

## Auto-Refresh

The Activity Logs page supports automatic refresh:

1. Click the **Refresh Settings** dropdown
2. Choose refresh interval:
   - Manual (disabled)
   - Every 5 seconds
   - Every 10 seconds
   - Every 30 seconds
   - Every 60 seconds (1 minute)
3. Logs will refresh automatically while active

**Use Cases**:
- **5-10 seconds**: Active monitoring during troubleshooting
- **30-60 seconds**: General monitoring during normal operation
- **Manual**: When analyzing specific historical events

## Filtering Examples

### Failed Login Attempts

1. Open filters
2. Enter keyword: `login.failed`
3. View all failed login attempts
4. Check IPs for patterns (brute force attempts)

### User Account Changes

1. Open filters
2. Enter keyword: `user`
3. Set date range: Last 7 days
4. View all user-related activities

### Watcher Status Changes

1. Open filters
2. Enter keyword: `watcher.check`
3. View all IP check results
4. Look for frequent status changes (IP instability)

### DNS Record Updates

1. Open filters  
2. Enter keyword: `dns.record`
3. Set date range: Today
4. View all DNS changes made today

## Severity Levels

| Level | Usage | Color |
|-------|-------|-------|
| **Info** | Normal operations | Blue |
| **Warning** | Non-critical issues | Yellow |
| **Error** | Failed operations | Red |
| **Critical** | Security events | Red (bold) |

**Examples**:
- `info`: User created, DNS record updated
- `warning`: IP mismatch detected
- `error`: DNS update failed, API error
- `critical`: CSRF blocked, rate limit hit

## Performance & Retention

### Database Indexes

Audit logs are indexed for fast queries:
- `userId`: User-specific queries
- `timestamp`: Date range queries
- `action`: Action type filtering
- `severity`: Severity filtering

### Pagination

Logs are paginated to handle large volumes:
- Default limit: 50 logs per page
- Maximum limit: 100 logs per page
- Total count shown in subtitle
- API supports offset-based pagination

### Log Retention

**Current**: No automatic pruning (manual only)

**Future**: Planned automatic retention policies
- Default: 90 days
- Configurable via admin settings
- Archive old logs to external storage

**Manual Pruning** (via Prisma Console):
```typescript
// Delete logs older than 90 days
await pruneOldAuditLogs(90);
```

## Security Considerations

### What's Logged Safely

✅ Usernames and emails  
✅ IP addresses  
✅ User agents  
✅ Resource IDs  
✅ Timestamps  
✅ Action types  

### What's NEVER Logged

❌ Passwords (even hashed)  
❌ API tokens  
❌ Encryption keys  
❌ Session tokens  
❌ Credit card numbers  

### Access Control

- Only admins can view audit logs
- API requires authentication
- Logs cannot be deleted via UI/API
- Database-level retention only

### IP Privacy

- IPv4-mapped IPv6 addresses normalized
- Example: `::ffff:192.168.1.1` → `192.168.1.1`
- Consistent format for easier searching

## Troubleshooting

### No Logs Appearing

**Causes**:
1. No actions performed yet
2. Filters too restrictive
3. Database connection issue

**Solutions**:
1. Perform some actions (login, create user, etc.)
2. Clear all filters
3. Check database connectivity

### Search Not Finding Results

**Causes**:
1. Keyword doesn't match any fields
2. Date range doesn't include events
3. Typo in search term

**Solutions**:
1. Try broader keywords (e.g., "user" instead of "user.created")
2. Expand date range
3. Use partial matches (e.g., "192" instead of "192.168.1.1")

### Missing User Names

**Symptom**: Logs show "Unknown" for user name

**Causes**:
1. User was deleted (onDelete: SetNull)
2. System action (no user)
3. Background task (scheduler)

**Expected**:
- Deleted users show as "Unknown"
- System actions have no user
- Watcher checks have no user (background)

### Slow Log Loading

**Causes**:
1. Large number of logs
2. Complex keyword search
3. Missing database indexes

**Solutions**:
1. Use date range filters to limit results
2. Use more specific keywords
3. Ensure database indexes exist (auto-created by Prisma)

## Best Practices

### Regular Review

- Check logs daily for unusual activity
- Look for failed login attempts
- Monitor IP addresses for patterns
- Review error-level logs

### Search Strategy

1. **Start Broad**: Use general keywords first
2. **Narrow Down**: Add filters progressively
3. **Date Range**: Always set reasonable date ranges
4. **Export Data**: Use API for detailed analysis

### Monitoring Patterns

**Security Monitoring**:
- Multiple failed logins from same IP
- Login attempts outside business hours
- Unexpected user account changes
- DNS record modifications

**Operational Monitoring**:
- Watcher status changes
- API errors
- Cache performance
- System settings changes

## API Reference

### Get Audit Logs

```
GET /api/admin/audit-logs
```

**Query Parameters**:
- `limit`: Number of logs (1-100)
- `offset`: Pagination offset
- `keyword`: Search term
- `startDate`: ISO 8601 date string
- `endDate`: ISO 8601 date string
- `userId`: Filter by user ID
- `action`: Filter by action type
- `severity`: Filter by severity

**Response**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log123",
        "timestamp": "2025-01-31T10:30:00.000Z",
        "action": "user.created",
        "severity": "info",
        "userId": "user123",
        "userName": "John Doe",
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "resource": "user",
        "resourceId": "newuser123",
        "details": {
          "email": "newuser@example.com",
          "role": "user"
        },
        "success": true,
        "status": "success"
      }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

## Future Enhancements

Planned improvements for audit logging:

- **Export**: CSV/JSON export functionality
- **Retention Policies**: Automatic log pruning
- **Advanced Filters**: More filter options (user agent, resource type)
- **Real-time Alerts**: Webhook notifications for critical events
- **Dashboard**: Visual analytics and charts
- **Archive**: Long-term storage for compliance

## Compliance Notes

The audit logging system supports compliance requirements:

- **SOC 2**: Comprehensive activity logging
- **GDPR**: User action tracking (with privacy considerations)
- **HIPAA**: Audit trail requirements
- **PCI DSS**: Access control logging

**Remember**: Configure appropriate retention policies for your compliance needs.
