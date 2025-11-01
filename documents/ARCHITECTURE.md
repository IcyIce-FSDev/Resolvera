# System Architecture

Complete architecture documentation for Resolvera DNS Manager.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Data Flow](#data-flow)
- [Authentication & Authorization](#authentication--authorization)
- [Database Schema](#database-schema)
- [Background Services](#background-services)
- [Caching Strategy](#caching-strategy)
- [Security Architecture](#security-architecture)
- [API Integration](#api-integration)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

Resolvera is a full-stack Next.js application built with the App Router architecture. It provides a comprehensive DNS management interface for Cloudflare with features including automated IP monitoring, audit logging, and webhook notifications.

### Architecture Principles

1. **Server-First**: Leverages Next.js App Router for server-side rendering and API routes
2. **Type Safety**: TypeScript throughout with strict type checking
3. **Security by Default**: JWT authentication, encrypted secrets, comprehensive validation
4. **Modular Design**: Separation of concerns with dedicated utilities and services
5. **Scalability**: PostgreSQL with efficient indexes, in-memory caching, background jobs

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.1 | React framework with App Router |
| **React** | 19.2.0 | UI library with modern hooks |
| **Tailwind CSS** | v4 | Utility-first styling |
| **TypeScript** | 5.x | Type safety and IDE support |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.0.1 | RESTful API endpoints |
| **PostgreSQL** | 16 | Primary database |
| **Prisma ORM** | 6.18.0 | Database access and migrations |
| **node-cron** | 4.2.1 | Background job scheduling |

### Security & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **jose** | 6.1.0 | JWT creation and verification |
| **bcrypt** | 6.0.0 | Password hashing |
| **Node.js crypto** | Built-in | AES-256-GCM encryption |
| **Zod** | 4.1.12 | Runtime schema validation |

---

## Application Structure

```
resolvera/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin-only endpoints
│   │   │   ├── users/            # User management
│   │   │   ├── audit/            # Audit log queries
│   │   │   └── notifications/    # Notification settings
│   │   ├── dns/                  # DNS operations
│   │   │   └── records/          # CRUD for DNS records
│   │   ├── zones/                # Zone management
│   │   ├── watchers/             # IP watcher management
│   │   └── settings/             # User settings
│   ├── dashboard/                # Dashboard page + components
│   ├── zones/                    # Zone pages
│   ├── admin/                    # Admin pages
│   ├── watcher/                  # Watcher pages
│   ├── settings/                 # Settings pages
│   └── setup/                    # Initial setup page
│
├── lib/                          # Core libraries
│   ├── auth/                     # Authentication
│   │   ├── jwt.ts                # JWT utilities
│   │   ├── middleware.ts         # Auth middleware
│   │   ├── session.ts            # Session management
│   │   └── logout.ts             # Logout logic
│   ├── db/                       # Database layer
│   │   ├── prisma.ts             # Prisma client
│   │   └── database.ts           # Database operations
│   ├── cloudflare/               # Cloudflare integration
│   │   ├── api.ts                # API wrapper functions
│   │   └── zones.ts              # Zone management
│   ├── watcher/                  # IP watcher system
│   │   ├── scheduler.ts          # Cron scheduler
│   │   └── background-checker.ts # IP checking logic
│   ├── audit/                    # Audit logging
│   │   └── logger.ts             # Audit log creation
│   ├── security/                 # Security utilities
│   │   └── encryption.ts         # AES-256-GCM encryption
│   ├── validation/               # Input validation
│   │   ├── schemas.ts            # Main schema exports
│   │   └── schemas/              # Modular schema files
│   │       ├── user.ts           # User schemas
│   │       ├── dns.ts            # DNS schemas
│   │       ├── zone.ts           # Zone schemas
│   │       └── watcher.ts        # Watcher schemas
│   ├── services/                 # External services
│   │   ├── notification.ts       # Main notification service
│   │   └── notification/         # Modular notification files
│   │       ├── constants.ts      # Event mappings, colors
│   │       ├── discord-client.ts # Discord webhook client
│   │       └── discord-formatters.ts # Message formatting
│   ├── cache/                    # Caching layer
│   │   └── cloudflare.ts         # In-memory cache
│   ├── storage/                  # Data storage
│   │   └── watchers.ts           # Watcher data access
│   ├── api/                      # API utilities
│   │   ├── responses.ts          # Standard responses
│   │   ├── audit.ts              # Audit helpers
│   │   ├── notifications.ts      # Notification helpers
│   │   └── dns/                  # DNS utilities
│   │       └── authorization.ts  # Authorization logic
│   ├── ui/                       # UI utilities
│   │   └── statusColors.ts       # Status color constants
│   └── utils/                    # General utilities
│       ├── ip.ts                 # IP normalization
│       └── request.ts            # Request context extraction
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── layout/                   # Layout components
│   └── modals/                   # Modal dialogs
│
├── hooks/                        # Custom React hooks
│   ├── useDarkMode.ts            # Dark mode state
│   └── usePageInitialization.ts  # Page auth initialization
│
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
│
├── public/                       # Static assets
└── .docker/                      # Docker configuration
```

---

## Data Flow

### Request Lifecycle

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. HTTP Request
       ▼
┌──────────────────────┐
│  Next.js Server      │
│  (App Router)        │
└──────┬───────────────┘
       │
       │ 2. Route Handler
       ▼
┌──────────────────────┐
│  requireAuth()       │  JWT verification
│  Middleware          │  Cookie validation
└──────┬───────────────┘
       │
       │ 3. Authenticated
       ▼
┌──────────────────────┐
│  Authorization       │  Role check
│  Check               │  Zone access
└──────┬───────────────┘
       │
       │ 4. Authorized
       ▼
┌──────────────────────┐
│  Input Validation    │  Zod schemas
│  (Zod)               │  Type checking
└──────┬───────────────┘
       │
       │ 5. Valid Input
       ▼
┌──────────────────────┐
│  Business Logic      │  Database ops
│  Layer               │  External APIs
└──────┬───────────────┘
       │
       │ 6. Success/Error
       ▼
┌──────────────────────┐
│  Audit Logging       │  Track operation
│  (async)             │  Non-blocking
└──────┬───────────────┘
       │
       │ 7. Log created
       ▼
┌──────────────────────┐
│  Response            │  JSON format
│  Formatting          │  Status codes
└──────┬───────────────┘
       │
       │ 8. HTTP Response
       ▼
┌──────────────────────┐
│   Browser            │
└──────────────────────┘
```

### DNS Record Creation Flow

```
User → Dashboard → API Route → Validation
                      ↓
                Authorization (user has zone access?)
                      ↓
                Cloudflare API (create record)
                      ↓
                Audit Log (track operation)
                      ↓
                Notification (Discord webhook)
                      ↓
                Cache Invalidation
                      ↓
                Response to User
```

---

## Authentication & Authorization

### JWT Authentication

**Token Generation:**
```typescript
// lib/auth/jwt.ts
const token = await new SignJWT({
  userId: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  assignedZoneIds: user.assignedZoneIds
})
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('24h')
  .sign(secret);
```

**Token Storage:**
- HTTP-only cookies (prevents XSS)
- SameSite: 'lax' (CSRF protection)
- 24-hour expiration
- Secure flag in production

**Middleware Protection:**
```typescript
// lib/auth/middleware.ts
export function requireAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse>
```

### Authorization Levels

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features and zones |
| **User** | Access only to assigned zones |

**Zone-Level Authorization:**
```typescript
// lib/api/dns/authorization.ts
export async function authorizeDNSRecordAccessByName(
  user: AuthorizedUser,
  zoneName: string
): Promise<AuthorizationResult>
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    User     │       │     Zone     │       │   Watcher   │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id          │       │ id           │       │ id          │
│ email       │       │ zoneName     │───┐   │ recordName  │
│ name        │       │ zoneId       │   │   │ recordType  │
│ passwordHash│       │ apiToken     │   └──▶│ zoneName    │
│ role        │       │ status       │       │ enabled     │
│ assignedIds │───┐   │ nameServers  │       │ status      │
│ createdAt   │   │   │ createdAt    │       │ currentIP   │
└─────────────┘   │   └──────────────┘       │ expectedIP  │
                  │                           │ lastChecked │
                  │                           │ createdAt   │
                  │                           └─────────────┘
                  │
                  │   ┌──────────────┐
                  └──▶│  AuditLog    │
                      ├──────────────┤
                      │ id           │
                      │ timestamp    │
                      │ action       │
                      │ severity     │
                      │ userId       │───┐
                      │ ip           │   │
                      │ userAgent    │   │
                      │ resource     │   │
                      │ resourceId   │   │
                      │ details      │   │
                      │ success      │   │
                      └──────────────┘   │
                                        │
┌───────────────────┐                   │
│ WatcherSettings   │                   │
├───────────────────┤                   │
│ id                │                   │
│ checkInterval     │                   │
│ autoUpdateEnabled │                   │
│ notifyOnMismatch  │                   │
│ lastCheck         │                   │
│ updatedAt         │                   │
└───────────────────┘                   │
                                        │
┌──────────────────────┐                │
│ NotificationSettings │                │
├──────────────────────┤                │
│ id                   │                │
│ discordWebhookUrl    │                │
│ discordWebhookEnabled│                │
│ dnsRecordAdd         │                │
│ dnsRecordEdit        │                │
│ dnsRecordDelete      │                │
│ watcherIpUpdate...   │                │
│ updatedAt            │                │
└──────────────────────┘                │
```

### Key Indexes

- **AuditLog**: timestamp, userId, action, severity (for fast queries)
- **User**: email (unique), role
- **Zone**: zoneName (unique), zoneId (unique)
- **Watcher**: zoneName, enabled (for scheduler queries)

---

## Background Services

### IP Watcher Scheduler

**Initialization:**
```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startWatcherScheduler } = await import('./lib/watcher/scheduler');
    await startWatcherScheduler();
  }
}
```

**Scheduling Logic:**
```typescript
// lib/watcher/scheduler.ts
const cronExpression = intervalMinutes >= 60
  ? `0 */${Math.floor(intervalMinutes / 60)} * * *`  // Hourly
  : `*/${intervalMinutes} * * * *`;                  // Minutes

cron.schedule(cronExpression, async () => {
  await checkAllWatchers();
});
```

**Check Flow:**
```
1. Get enabled watchers from database
2. For each watcher:
   a. Fetch current DNS record from Cloudflare
   b. Get expected IP from ipify.org (IPv4/IPv6)
   c. Compare current vs expected
   d. If mismatch && auto-update enabled:
      - Update DNS record
      - Send notification
      - Update watcher status
   e. Log result
3. Update lastCheck timestamp
```

---

## Caching Strategy

### In-Memory Cache

```typescript
// lib/cache/cloudflare.ts
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
```

**Cache Keys:**
- DNS Records: `dns:records:{zoneId}`
- Zones: `zones:all`
- TTL: 5 minutes for DNS records, 10 minutes for zones

**Cache Invalidation:**
- On DNS record create/update/delete
- On zone add/remove
- Manual clear via admin interface

**Benefits:**
- Reduces Cloudflare API calls
- Faster response times
- Rate limit protection

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────┐
│  1. Input Validation (Zod)          │  ← Prevent invalid data
├─────────────────────────────────────┤
│  2. Authentication (JWT)             │  ← Verify identity
├─────────────────────────────────────┤
│  3. Authorization (RBAC)             │  ← Check permissions
├─────────────────────────────────────┤
│  4. Encryption (AES-256)             │  ← Protect secrets
├─────────────────────────────────────┤
│  5. Audit Logging                    │  ← Track all actions
├─────────────────────────────────────┤
│  6. Error Handling                   │  ← No sensitive leaks
└─────────────────────────────────────┘
```

### Encryption Flow

**API Token Storage:**
```
1. User enters Cloudflare API token
2. Derive encryption key from ENCRYPTION_KEY env var
   - PBKDF2 with 100,000 iterations
3. Generate random salt (16 bytes)
4. Generate random IV (12 bytes)
5. Encrypt with AES-256-GCM
6. Store: salt:iv:authTag:ciphertext (all base64)
7. Save to database

Decryption (on use):
1. Split stored value into parts
2. Derive same key from ENCRYPTION_KEY
3. Decrypt with salt, IV, authTag
4. Use plaintext token for Cloudflare API
5. Never log or expose plaintext token
```

### Password Hashing

```typescript
// lib/auth/jwt.ts
const hashedPassword = await bcrypt.hash(password, 10);
// 10 rounds = 2^10 = 1024 iterations
// Automatically includes random salt
```

---

## API Integration

### Cloudflare REST API v4

**Wrapper Architecture:**
```typescript
// lib/cloudflare/api.ts
export async function callCloudflareAPI(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  zoneId: string,
  apiToken: string,
  recordId?: string,
  body?: Partial<DNSRecordData>
): Promise<CloudflareResponse>
```

**Endpoints Used:**
- `GET /zones/{zone_id}/dns_records` - List DNS records
- `POST /zones/{zone_id}/dns_records` - Create record
- `PATCH /zones/{zone_id}/dns_records/{record_id}` - Update record
- `DELETE /zones/{zone_id}/dns_records/{record_id}` - Delete record

**Error Handling:**
- Retry logic for temporary failures
- Detailed error messages from Cloudflare
- Audit logging of all API errors

---

## Deployment Architecture

### Docker Deployment

```
┌─────────────────────────────────────────┐
│           Docker Host                    │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Nginx (Reverse Proxy)             │ │
│  │  Port 80/443 → 3000                │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
│  ┌──────────────▼─────────────────────┐ │
│  │  Next.js Container                  │ │
│  │  - Node 20-alpine                   │ │
│  │  - Standalone output                │ │
│  │  - Health checks                    │ │
│  │  - Background scheduler             │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
│  ┌──────────────▼─────────────────────┐ │
│  │  PostgreSQL Container               │ │
│  │  - PostgreSQL 16-alpine             │ │
│  │  - Persistent volume                │ │
│  │  - Health checks                    │ │
│  └────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

### Manual Deployment

```
┌─────────────────────────────────────────┐
│           Linux Server                   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Nginx (Reverse Proxy)             │ │
│  │  Port 80/443 → 3000                │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
│  ┌──────────────▼─────────────────────┐ │
│  │  Next.js Process (PM2/systemd)     │ │
│  │  - Node.js 20+                      │ │
│  │  - npm run start                    │ │
│  │  - Background scheduler             │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
│  ┌──────────────▼─────────────────────┐ │
│  │  PostgreSQL 16                      │ │
│  │  - Local or remote DB               │ │
│  └────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

---

## Performance Considerations

### Optimizations

1. **Database Queries**
   - Indexed columns for fast lookups
   - Selective field loading with Prisma `select`
   - Pagination for large result sets

2. **Caching**
   - In-memory cache for frequent API calls
   - TTL-based expiration
   - Smart invalidation on mutations

3. **Background Jobs**
   - Async audit logging (non-blocking)
   - Scheduled IP checks (cron-based)
   - Configurable check intervals

4. **Frontend**
   - Server-side rendering with Next.js
   - Optimized bundle size
   - Dark mode without layout shift

---

## Monitoring & Observability

### Logging

- **Console Logs**: All operations logged to stdout
- **Audit Logs**: Database-persisted security events
- **Error Logs**: Comprehensive error tracking

### Health Checks

- **Docker**: Built-in health checks for both containers
- **Database**: Connection pool monitoring
- **API**: Cloudflare API status tracking

---

## Future Architecture Plans

### v1.1.0 - Enhanced Caching
- Redis integration for distributed caching
- Cache warming strategies
- Advanced invalidation patterns

### v1.2.0 - Message Queue
- Background job queue (Bull/BullMQ)
- Async notification processing
- Retry mechanisms

### v1.3.0 - Microservices
- Separate watcher service
- Independent scaling
- Service mesh integration

---

**For more information, see:**
- [API Documentation](API.md)
- [Main Documentation](README.md)
- [Development Guide](DEVELOPMENT.md)
