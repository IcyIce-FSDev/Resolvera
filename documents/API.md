# API Reference

Complete API documentation for Resolvera's REST endpoints.

## Table of Contents

- [Authentication](#authentication)
- [DNS Records](#dns-records)
- [Zones](#zones)
- [Watchers](#watchers)
- [Users](#users)
- [Audit Logs](#audit-logs)
- [Settings](#settings)
- [Response Format](#response-format)
- [Error Handling](#error-handling)

---

## Authentication

All API routes (except `/api/auth/login` and `/api/setup`) require JWT authentication via HTTP-only cookies.

### Login

**POST** `/api/auth/login`

Authenticate a user and receive a JWT cookie.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-id",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### Logout

**POST** `/api/auth/logout`

Clear authentication cookie.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User

**GET** `/api/auth/me`

Get currently authenticated user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-id",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "assignedZoneIds": ["zone-id-1", "zone-id-2"]
  }
}
```

---

## DNS Records

### List DNS Records

**GET** `/api/dns/records`

Get all DNS records for zones the user has access to.

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "record-id",
        "type": "A",
        "name": "example.com",
        "content": "192.0.2.1",
        "ttl": 3600,
        "proxied": true,
        "zone_name": "example.com"
      }
    ],
    "count": 1
  }
}
```

### Create DNS Record

**POST** `/api/dns/records`

Create a new DNS record.

**Request Body:**
```json
{
  "type": "A",
  "name": "subdomain.example.com",
  "content": "192.0.2.1",
  "ttl": 3600,
  "proxied": false,
  "zoneId": "cloudflare-zone-id",
  "comment": "Optional comment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-record-id",
    "type": "A",
    "name": "subdomain.example.com",
    "content": "192.0.2.1",
    "ttl": 3600,
    "proxied": false,
    "zone_name": "example.com"
  }
}
```

**Supported Record Types:** A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, PTR

### Update DNS Record

**PATCH** `/api/dns/records/[id]`

Update an existing DNS record.

**Request Body:**
```json
{
  "zone_name": "example.com",
  "type": "A",
  "name": "subdomain.example.com",
  "content": "192.0.2.2",
  "ttl": 7200,
  "proxied": true,
  "old_content": "192.0.2.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "record-id",
    "type": "A",
    "name": "subdomain.example.com",
    "content": "192.0.2.2",
    "ttl": 7200,
    "proxied": true
  }
}
```

### Delete DNS Record

**DELETE** `/api/dns/records/[id]`

Delete a DNS record.

**Request Body:**
```json
{
  "zone_name": "example.com",
  "name": "subdomain.example.com",
  "type": "A",
  "content": "192.0.2.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "DNS record deleted successfully"
  }
}
```

---

## Zones

### List Zones

**GET** `/api/zones`

Get all zones the user has access to.

**Response:**
```json
{
  "success": true,
  "data": {
    "zones": [
      {
        "id": "db-id",
        "zoneName": "example.com",
        "zoneId": "cloudflare-zone-id",
        "status": "active",
        "nameServers": ["ns1.cloudflare.com", "ns2.cloudflare.com"]
      }
    ],
    "count": 1
  }
}
```

### Add Zone

**POST** `/api/zones` (Admin only)

Add a new Cloudflare zone to Resolvera.

**Request Body:**
```json
{
  "zoneName": "example.com",
  "zoneId": "cloudflare-zone-id-32-chars",
  "apiToken": "cloudflare-api-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "db-id",
    "zoneName": "example.com",
    "zoneId": "cloudflare-zone-id"
  }
}
```

### Delete Zone

**DELETE** `/api/zones/[id]` (Admin only)

Remove a zone from Resolvera.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Zone deleted successfully"
  }
}
```

---

## Watchers

### List Watchers

**GET** `/api/watchers`

Get all IP watchers.

**Response:**
```json
{
  "success": true,
  "data": {
    "watchers": [
      {
        "id": "watcher-id",
        "recordName": "home.example.com",
        "recordType": "A",
        "zoneName": "example.com",
        "enabled": true,
        "status": "ok",
        "currentIP": "192.0.2.1",
        "expectedIP": "192.0.2.1",
        "lastChecked": "2025-01-15T12:00:00Z"
      }
    ],
    "count": 1
  }
}
```

### Create Watcher

**POST** `/api/watchers` (Admin only)

Create a new IP watcher.

**Request Body:**
```json
{
  "recordName": "home.example.com",
  "recordType": "A",
  "zoneName": "example.com",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "watcher-id",
    "recordName": "home.example.com",
    "recordType": "A",
    "zoneName": "example.com",
    "enabled": true,
    "status": null
  }
}
```

### Update Watcher

**PATCH** `/api/watchers/[id]` (Admin only)

Update watcher settings.

**Request Body:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "watcher-id",
    "enabled": false
  }
}
```

### Delete Watcher

**DELETE** `/api/watchers/[id]` (Admin only)

Delete a watcher.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Watcher deleted successfully"
  }
}
```

### Trigger Watcher Check

**POST** `/api/watchers/check` (Admin only)

Manually trigger IP check for all enabled watchers.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Watcher check triggered successfully"
  }
}
```

---

## Users

### List Users

**GET** `/api/admin/users` (Admin only)

Get all users.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "assignedZoneIds": ["zone-id-1"],
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "count": 1
  }
}
```

### Create User

**POST** `/api/admin/users` (Admin only)

Create a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "role": "user",
  "assignedZoneIds": ["zone-id-1", "zone-id-2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-user-id",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

### Update User

**PATCH** `/api/admin/users/[id]` (Admin only)

Update user details.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "role": "admin",
  "assignedZoneIds": ["zone-id-1"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "Jane Smith",
    "role": "admin"
  }
}
```

### Delete User

**DELETE** `/api/admin/users/[id]` (Admin only)

Delete a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

---

## Audit Logs

### Query Audit Logs

**GET** `/api/admin/audit` (Admin only)

Get audit logs with filtering.

**Query Parameters:**
- `keyword` (optional): Search across actions, resources, IPs
- `startDate` (optional): Filter logs after this date (ISO 8601)
- `endDate` (optional): Filter logs before this date (ISO 8601)
- `severity` (optional): Filter by severity (info, warning, error, critical)
- `limit` (optional): Number of logs to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-id",
        "timestamp": "2025-01-15T12:00:00Z",
        "action": "dns.record.created",
        "severity": "info",
        "userId": "user-id",
        "userName": "John Doe",
        "ip": "192.0.2.1",
        "userAgent": "Mozilla/5.0...",
        "resource": "dns_record",
        "resourceId": "record-id",
        "success": true,
        "details": {}
      }
    ],
    "total": 1
  }
}
```

---

## Settings

### Get Account Settings

**GET** `/api/settings/account`

Get current user's account settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Update Account

**PATCH** `/api/settings/account`

Update account information.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Account updated successfully"
  }
}
```

### Update Password

**PATCH** `/api/settings/password`

Change user password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password updated successfully"
  }
}
```

### Get Notification Settings

**GET** `/api/admin/notifications` (Admin only)

Get notification configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "discordWebhookEnabled": true,
    "discordWebhookUrl": "https://discord.com/api/webhooks/...",
    "dnsRecordAdd": true,
    "dnsRecordEdit": true,
    "dnsRecordDelete": true,
    "watcherIpUpdateAuto": true,
    "watcherIpUpdateManual": true
  }
}
```

### Update Notification Settings

**PATCH** `/api/admin/notifications` (Admin only)

Update notification configuration.

**Request Body:**
```json
{
  "discordWebhookEnabled": true,
  "discordWebhookUrl": "https://discord.com/api/webhooks/...",
  "dnsRecordAdd": true,
  "dnsRecordEdit": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Notification settings updated successfully"
  }
}
```

---

## Response Format

### Success Response

All successful API calls return:

```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response

All errors return:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Validation Error Response

Validation failures return:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Common Errors

**Authentication Required:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Access denied: You do not have permission to modify this zone"
}
```

**Zone Not Found:**
```json
{
  "success": false,
  "error": "Zone not found"
}
```

**Cloudflare API Error:**
```json
{
  "success": false,
  "error": "Failed to create DNS record",
  "details": [
    {
      "code": 81053,
      "message": "Record already exists"
    }
  ]
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Future versions will include:
- Per-user rate limits
- IP-based rate limiting
- Configurable thresholds

---

## Webhooks

### Discord Webhook Format

Resolvera sends rich embed notifications to Discord:

```json
{
  "embeds": [{
    "title": "➕ DNS Record Added",
    "color": 3447670,
    "fields": [
      {"name": "Domain", "value": "example.com", "inline": true},
      {"name": "Type", "value": "A", "inline": true},
      {"name": "Content", "value": "192.0.2.1", "inline": false}
    ],
    "timestamp": "2025-01-15T12:00:00Z"
  }]
}
```

**Event Types:**
- `dns_record_add` - DNS record created (Blue)
- `dns_record_edit` - DNS record updated (Amber)
- `dns_record_delete` - DNS record deleted (Red)
- `watcher_ip_update_auto` - IP auto-updated by watcher (Amber)
- `watcher_ip_update_manual` - IP manually updated (Emerald)

---

## Security Considerations

1. **Authentication**: All routes require JWT authentication via HTTP-only cookies
2. **Authorization**: Role-based access control (admin vs user)
3. **Input Validation**: All inputs validated with Zod schemas
4. **Encryption**: API tokens encrypted with AES-256-GCM
5. **Password Hashing**: bcrypt with 10 rounds + salt
6. **Audit Logging**: All operations logged for security tracking

---

## Examples

### JavaScript/TypeScript (fetch)

```typescript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'SecurePassword123!'
  })
});

// Create DNS Record
const recordResponse = await fetch('/api/dns/records', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    type: 'A',
    name: 'subdomain.example.com',
    content: '192.0.2.1',
    ttl: 3600,
    proxied: false,
    zoneId: 'cloudflare-zone-id'
  })
});
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@example.com","password":"SecurePassword123!"}'

# Create DNS Record
curl -X POST http://localhost:3000/api/dns/records \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "A",
    "name": "subdomain.example.com",
    "content": "192.0.2.1",
    "ttl": 3600,
    "proxied": false,
    "zoneId": "cloudflare-zone-id"
  }'
```

---

**For more information, see:**
- [Main Documentation](README.md)
- [Architecture Guide](ARCHITECTURE.md)
- [Development Guide](DEVELOPMENT.md)
