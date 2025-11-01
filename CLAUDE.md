# Resolvera Architecture Guide

A comprehensive guide to the Resolvera DNS management system architecture. This document helps developers quickly understand the codebase and get productive.

## Project Overview

Resolvera is a Next.js-based DNS management application that integrates with Cloudflare to manage DNS records and monitor IP changes. The application provides automated IP monitoring, notification systems, and a web-based UI for managing DNS zones and records.

**Tech Stack:**
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT-based (HTTP-only cookies)
- **Frontend**: React 19 + Tailwind CSS
- **Background Jobs**: node-cron for scheduled tasks
- **Validation**: Zod for schema validation
- **API Client**: Cloudflare API wrapper

---

## 1. API Structure

### API Routes Organization

```
app/api/
├── auth/              # Authentication endpoints
│   ├── login/         # POST: User login
│   ├── logout/        # POST: User logout
│   └── me/            # GET: Current user info
├── dns/records/       # DNS record operations
│   ├── route.ts       # GET all, POST create
│   └── [id]/route.ts  # PATCH update, DELETE
├── watchers/          # IP watcher operations
│   ├── route.ts       # GET all, POST create
│   ├── [id]/route.ts  # PATCH update, DELETE
│   └── check/         # Manual watcher check
├── zones/            # Zone management
├── admin/            # Admin-only operations
│   ├── users/        # User management
│   ├── audit-logs/   # Audit log retrieval
│   ├── zones/        # Zone admin operations
│   ├── notifications/# Notification settings
│   ├── cache/        # Cache management
│   └── watcher-scheduler/ # Scheduler control
├── settings/         # User settings
├── setup/            # Initial setup
├── health/           # Health check endpoint
└── ip/              # Current server IP detection
```

### API Response Pattern

All API endpoints follow a consistent response structure:

```typescript
// Success Response
{
  success: true,
  data: { /* response data */ },
  meta?: { /* optional metadata like pagination */ }
}

// Error Response
{
  success: false,
  error: "Error message",
  details?: "Additional details or validation errors"
}
```

**Key Files:**
- `/lib/api/responses.ts` - Response builders (successResponse, errorResponse)
- `/lib/api/error-handler.ts` - Error handling utilities
- `/lib/validation/schemas/` - Zod schemas for input validation

### Main API Endpoints

#### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout (clears JWT cookie)
- `GET /api/auth/me` - Get current user info

#### DNS Records
- `GET /api/dns/records` - List all DNS records (with Cloudflare cache)
- `POST /api/dns/records` - Create new DNS record
- `PATCH /api/dns/records/[id]` - Update DNS record
- `DELETE /api/dns/records/[id]` - Delete DNS record

#### Watchers (IP Monitoring)
- `GET /api/watchers` - List all watchers
- `POST /api/watchers` - Create new watcher
- `PATCH /api/watchers/[id]` - Update watcher
- `DELETE /api/watchers/[id]` - Delete watcher
- `POST /api/watchers/check` - Manually trigger IP check

#### Admin Operations
- `GET/POST /api/admin/users` - User management
- `GET /api/admin/audit-logs` - Retrieve audit logs
- `GET/POST /api/admin/zones` - Zone admin operations
- `GET/POST /api/admin/notifications` - Notification settings
- `GET/POST /api/admin/watcher-scheduler` - Control scheduler

---

## 2. Authentication & Authorization

### JWT-Based Authentication Flow

**Implementation:**
- **JWT Generation**: `/lib/auth/jwt.ts` - Uses `jose` library for HS256 signing
- **Middleware**: `/lib/auth/middleware.ts` - Wraps endpoints with auth checks
- **Session Management**: `/lib/auth/session.ts` - Client-side session caching

**Token Details:**
- **Algorithm**: HS256 (HMAC-SHA256)
- **Secret**: `JWT_SECRET` (min 32 chars, from env)
- **Expiration**: 24 hours
- **Storage**: HTTP-only cookie (`resolvera_token`)
- **Cookie Settings**: HttpOnly, Lax SameSite, path=/

**Authentication Flow:**
1. User logs in with email/password at `POST /api/auth/login`
2. Password verified against bcrypt hash (with migration support for legacy hashes)
3. JWT token generated and set as HTTP-only cookie
4. Token verified on every request via `requireAuth()` middleware
5. User info from JWT attached to request object

**Code Example:**
```typescript
// In API route handler
import { requireAuth, getRequestUser } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    const user = getRequestUser(req); // JWT payload with userId, role, etc.
    
    // User authenticated - proceed with logic
  });
}
```

### Authorization Levels

**Role-Based Access Control:**
- `admin` - Full access to all features
- `user` - Limited access based on assigned zones

**Zone-Based Access Control:**
- Users have `assignedZoneIds` array
- Non-admin users can only view/modify watchers in assigned zones
- Authorization checked via `/lib/api/dns/authorization.ts`

**Middleware Functions:**
- `requireAuth(request, handler)` - Requires valid JWT
- `requireAdmin(request, handler)` - Requires admin role
- `getRequestUser(request)` - Extract user from authenticated request

**Key Files:**
- `/lib/auth/jwt.ts` - JWT generation/verification
- `/lib/auth/middleware.ts` - Auth middleware
- `/lib/auth/session.ts` - Client-side session management
- `/lib/auth/password.ts` - Password hashing/verification
- `/lib/api/dns/authorization.ts` - Zone access control

---

## 3. Core Services & Utilities

### Cloudflare API Client

**Location**: `/lib/cloudflare/`

**Key Components:**

**api.ts** - Low-level Cloudflare API wrapper
- `callCloudflareAPI()` - Generic API call builder
- `fetchDNSRecords(zoneId, apiToken)` - GET all records
- `createDNSRecord()` - POST new record
- `updateDNSRecord()` - PATCH record
- `deleteDNSRecord()` - DELETE record

**zones.ts** - Zone and DNS record management
- `getZones()` - Read zones from DB with decrypted tokens
- `saveZone()` - Save zone to DB with encrypted token
- `removeZone()` - Delete zone from DB
- `fetchDNSRecordsForZone()` - Fetch records from Cloudflare for one zone
- `fetchAllDNSRecords()` - Fetch records from all zones

**Pattern**: API tokens are encrypted before storage and decrypted when used (AES-256-GCM)

### Encryption Utilities

**Location**: `/lib/security/encryption.ts`

**Functions:**
- `encrypt(plaintext)` - AES-256-GCM encryption → base64 output
- `decrypt(encryptedData)` - Decrypt encrypted tokens
- `encryptIfNeeded(token)` - Safe idempotent encrypt
- `decryptIfNeeded(token)` - Safe idempotent decrypt
- `isEncrypted(data)` - Check if string is encrypted format

**Format**: `salt:iv:authTag:encryptedData` (all base64)
**Derivation**: PBKDF2 with 100,000 iterations, SHA256

### Database Access Layer

**Location**: `/lib/db/database.ts`

**Prisma ORM Operations:**

```typescript
// Users
createUser(), getUserById(), getUserByEmail(), getAllUsers(), 
updateUser(), deleteUser()

// Zones
createZone(), getZoneById(), getZoneByZoneId(), getAllZones(),
updateZone(), deleteZone()

// Watchers
createWatcher(), getWatcherById(), getAllWatchers(),
getWatchersByZone(), updateWatcher(), deleteWatcher()

// Audit Logs
createAuditLog(), getAuditLogs(), deleteOldAuditLogs()

// Watcher Settings
getWatcherSettings(), createWatcherSettings(), updateWatcherSettings()

// User Preferences
getUserPreferences(), createUserPreferences(), updateUserPreferences()
```

**Database Connection:**
- Uses `/lib/db/prisma.ts` for singleton instance management
- Prevents multiple instances during hot reload in development
- Connection pooling handled by Prisma

### Caching System

**Location**: `/lib/cache/cloudflare.ts`

**In-Memory Cache for Cloudflare API:**
- `cfCache.get<T>(key)` - Get cached item
- `cfCache.set<T>(key, data, ttl)` - Set with TTL in ms
- `cfCache.invalidate(key)` - Clear specific entry
- `cfCache.invalidatePattern(pattern)` - Regex-based invalidation
- `cfCache.clear()` - Clear all cache
- `cfCache.stats()` - Get cache statistics

**Default TTLs:**
- Zones: 5 minutes
- DNS Records: 2 minutes
- Zone Info: 10 minutes

**Cache Keys:**
- `zones:all` or `zones:user:{userId}`
- `dns:records:{zoneId}`
- `zone:{zoneId}`

### Notification Service

**Location**: `/lib/services/notification.ts`

**Functions:**
- `sendNotification(payload)` - Send event-based notification
- `isNotificationEnabled(eventType)` - Check if type is enabled

**Notification Types:**
- `dns_record_add/edit/delete`
- `watcher_add/edit/delete`
- `watcher_ip_update_manual/auto`

**Currently Supported Channels:**
- Discord webhooks (via `/lib/services/notification/discord-client.ts`)

**Configuration**: Stored in `NotificationSettings` database model
- Each event type has corresponding enable/disable flag
- Discord webhook URL and enabled flag

### Audit Logging System

**Location**: `/lib/audit/logger.ts`

**Main Function:**
```typescript
createAuditLog({
  action: AuditAction,      // Pre-defined action types
  severity: AuditSeverity,  // 'info' | 'warning' | 'error' | 'critical'
  userId?: string,
  userEmail?: string,
  userName?: string,
  ip?: string,
  userAgent?: string,
  resource?: string,        // Resource type (e.g., 'watcher', 'zone')
  resourceId?: string,      // ID of resource affected
  details?: Record<string, any>,
  success: boolean,
  error?: string
})
```

**Logged Actions:**
- Authentication (login success/failed, logout)
- User management (create, update, delete, password change)
- DNS operations (record create/update/delete, zone add/remove)
- Watcher operations (create, update, delete, toggle, check, settings)
- Notifications (settings changed)
- Cache operations (config updated, cleared)
- System operations (security events, rate limiting)

### Request Utilities

**Location**: `/lib/utils/request.ts`

**Functions:**
- `getUserInfoFromRequest(request, user?)` - Extract IP, user agent, and user info from request
- `getClientIdentifier(request)` - Get IP for rate limiting

---

## 4. Data Flow

### Request-Response Cycle

```
Browser (Client)
       │ HTTP Request
       ▼
Next.js API Route Handler
  ├─ Validate Input (Zod)
  ├─ Authenticate (JWT middleware)
  ├─ Authorize (Role/Zone check)
  └─ Execute Business Logic
       │ Database Operation
       ▼
Prisma ORM
  ├─ Query/Mutation
  └─ PostgreSQL
       │ Response
       ▼
Standard Response { success, data }
       │
       ▼
Browser
```

### Watcher Check Flow

```
Scheduled Task (every N minutes)
  ▼
startWatcherScheduler()
  ├─ Convert minutes to cron expression
  ├─ Schedule task with node-cron
  └─ Run initial check on startup
  ▼
runBackgroundWatcherCheck()
  ├─ Fetch server IPs (GET /api/ip)
  ├─ Get watcher settings from DB
  ├─ Get all watchers
  │
  ├─ For each enabled watcher:
  │  ├─ Fetch all DNS records from Cloudflare
  │  ├─ Find matching DNS record
  │  ├─ Compare current IP vs expected IP
  │  │
  │  ├─ IF mismatch AND auto-update enabled:
  │  │  ├─ Update DNS record via Cloudflare API
  │  │  ├─ Send notification (watcher_ip_update_auto)
  │  │  └─ Create audit log
  │  │
  │  └─ IF mismatch AND notify enabled:
  │     ├─ Send notification (watcher_ip_update_manual)
  │     └─ Create audit log
  │
  ├─ Update watcher status in DB
  └─ Return results { success, checkedCount, errors }
```

### DNS Record Management Flow

```
User Action (Create/Update/Delete Record)
  ▼
POST /api/dns/records
  ├─ Validate input (Zod schema)
  ├─ Authenticate (JWT)
  ├─ Authorize (user has zone access)
  │
  ├─ Check cache for zone DNS records
  │ (if miss, fetch from Cloudflare)
  │
  ├─ If creating/updating:
  │  └─ Call Cloudflare API
  │
  ├─ Invalidate cache for zone
  ├─ Send notification (dns_record_add/edit/delete)
  ├─ Create audit log
  │
  └─ Return updated record data
```

---

## 5. Key Components

### UI Component Structure

```
components/
├── layout/
│   ├── Header.tsx          # Top nav with user menu
│   ├── Navigation.tsx      # Sidebar navigation
│   └── PageLayout.tsx      # Main layout wrapper
├── ui/
│   ├── Button.tsx          # Reusable button
│   ├── Input.tsx           # Reusable input field
│   ├── Card.tsx            # Card container
│   ├── Alert.tsx           # Alert/notification display
│   ├── Toast.tsx           # Toast notification
│   └── StatsCard.tsx       # Statistics display
├── modals/
│   ├── AddDNSRecordModal.tsx      # DNS record creation
│   ├── EditDNSRecordModal.tsx     # DNS record editing
│   └── DeleteConfirmationModal.tsx # Deletion confirmation
└── watcher/
    ├── WatcherCard.tsx            # Watcher display
    ├── WatcherZoneSection.tsx     # Zone watchers section
    ├── ServerIPCards.tsx          # Current server IPs
    └── AddWatcherModal.tsx        # Watcher creation
```

### Pages Structure

```
app/
├── page.tsx                # Login page (if not authenticated)
├── layout.tsx              # Root layout with client wrapper
├── dashboard/page.tsx      # Main dashboard
├── settings/page.tsx       # User settings (account, preferences)
├── admin/page.tsx          # Admin panel (user mgmt, audit logs, etc.)
├── zones/page.tsx          # Zone management (if implemented)
├── watcher/page.tsx        # Watcher management UI
└── setup/page.tsx          # Initial setup/registration
```

### Component Patterns

**Client Components:**
- Use `'use client'` directive
- Handle state with `useState`
- Manage effects with `useEffect`
- Custom hooks in `/hooks/` directory

**Page Components:**
- Wrap with `PageLayout` for consistent styling
- Use client components for interactive sections
- Pass session data from server components

**Data Fetching Pattern:**
```typescript
// Server-side (layout)
const session = await getSessionAsync();

// Client-side (components)
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/endpoint')
    .then(r => r.json())
    .then(d => setData(d.data));
}, []);
```

### Custom Hooks

**Location**: `/hooks/` directory

**Available Hooks:**
- `useDarkMode()` - Theme toggling (stores preference in localStorage)
- `usePageInitialization()` - Session check and auth redirect

---

## 6. Background Jobs

### IP Watcher Cron Job

**Initialization**: `/instrumentation.ts`
- Runs once when Next.js server starts
- Dynamically imports scheduler to avoid client-side bundling
- Safely handles failures without crashing startup

**Scheduler**: `/lib/watcher/scheduler.ts`
- Uses `node-cron` library for scheduling
- Converts interval minutes to cron expression
- Supports flexible intervals (not just 5, 10, 15, 30, 60 minutes)
- Automatic restart when settings change
- Runs initial check on startup

**Checker**: `/lib/watcher/background-checker.ts`
- No authentication needed (internal background task)
- Fetches server IPs via internal API call
- Gets Cloudflare API tokens from DB (encrypted)
- Compares current IP vs expected IP for each watcher
- Auto-updates DNS records if enabled
- Sends notifications on mismatch/update
- Creates audit logs for tracking

**Settings Management:**
- Check interval stored in `WatcherSettings` model
- Auto-update and notification flags also configurable
- Scheduler restarts when settings change via API

### Cron Expression Handling

**Examples:**
- 5 minutes: `*/5 * * * *`
- 7 minutes: `0,7,14,21,28,35,42,49,56 * * * *`
- 30 minutes: `*/30 * * * *`
- 1 hour: `0 * * * *`

**Algorithm:**
```typescript
// For intervals dividing evenly into 60
if (60 % minutes === 0) return `*/${minutes} * * * *`

// For non-standard intervals, list specific minutes
const minutesList = [0, 7, 14, 21, 28, 35, 42, 49, 56];
return `${minutesList.join(",")} * * * *`
```

---

## 7. Important Patterns & Conventions

### Error Handling Pattern

**Standard Approach:**
```typescript
try {
  // Business logic
} catch (error) {
  console.error('Context:', error);
  return errorResponse(error, statusCode);
}
```

**Error Response Builder:**
```typescript
// From /lib/api/responses.ts
errorResponse(error, 500) // or string message
validationErrorResponse(errors) // for validation failures
```

### Validation Pattern

**Using Zod Schemas:**
```typescript
import { dnsRecordSchema, validateSchema } from '@/lib/validation/schemas';

const validation = validateSchema(dnsRecordSchema, body);
if (!validation.success) {
  return validationErrorResponse(validation.errors);
}
const { type, name, content } = validation.data!;
```

### Database Patterns

**Timestamp Handling:**
- `createdAt` auto-set via `@default(now())`
- `updatedAt` auto-updated via `@updatedAt`
- In code: explicit `new Date().toISOString()` when needed

**Relationships:**
- Foreign key relations via `@relation()` with `onDelete` strategies
- Cascade delete for dependent records
- SetNull for optional parent references

**Indexing:**
- Frequently queried fields indexed (e.g., `enabled`, `zoneName`)
- Timestamp and action fields indexed for audit logs
- Foreign key fields auto-indexed by Prisma

### Caching Strategy

**Cache Invalidation:**
```typescript
// After DNS record creation/update/delete
cfCache.invalidate(`dns:records:${zoneId}`);

// Pattern-based invalidation
cfCache.invalidatePattern(`dns:records:.*`);

// Full clear
cfCache.clear();
```

**Cache Bypass:**
- API responses set `Cache-Control: no-store` headers
- Prevents HTTP caching of sensitive data

### Security Patterns

**Password Security:**
- Bcrypt hashing (modern standard)
- Legacy hash migration on login (from previous system)
- Automatic upgrade to bcrypt on successful login

**API Token Security:**
- AES-256-GCM encryption at rest
- Decrypted only when needed
- Never logged or exposed in responses
- Separate encryption key from JWT secret

**Rate Limiting:**
- Login endpoint: `/lib/security/rate-limit.ts`
- Client identifier: IP address or user-agent
- Prevents brute force attacks

**CSRF Protection:**
- HTTP-only cookie for JWT (immune to XSS)
- Credentials required for cross-origin requests (`credentials: 'include'`)
- Lax SameSite policy for cookie

### Logging & Auditing

**Audit Log Creation:**
```typescript
await createAuditLog({
  action: 'user.created',
  severity: 'info',
  userId: user.id,
  resource: 'user',
  resourceId: newUser.id,
  details: { email: newUser.email },
  success: true,
});
```

**Request Context Capture:**
```typescript
const { ip, userAgent, userId, userEmail } = 
  getUserInfoFromRequest(request, user);
```

### Response Standardization

**Success Responses:**
```typescript
return successResponse(
  { records: [], count: 0 },
  200,
  { page: 1, total: 100 }
);
```

**Error Responses:**
```typescript
return errorResponse('Detailed error message', 400);
return validationErrorResponse([
  { path: 'email', message: 'Invalid email format' }
]);
```

### Environment Configuration

**Required Variables:**
```env
# Authentication
JWT_SECRET=<32+ character secret>

# Database
DATABASE_URL=postgresql://user:password@host/dbname

# Encryption (all must be 32 characters)
ENCRYPTION_KEY=<32 character encryption key>
PASSWORD_HASH_SECRET=<32 character password pepper>
ZONE_API_HASH_SECRET=<32 character API token encryption key>

# Optional
NEXT_PUBLIC_URL=http://localhost:3000
NODE_ENV=development|production
```

**Configuration in Code:**
- Env vars accessed via `process.env.VARIABLE_NAME`
- Build-time check for required vars (e.g., JWT_SECRET length)
- Runtime validation in module initialization

---

## 8. Development Workflow

### Starting the Application

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

### Making Changes

**Database Schema Changes:**
```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Update generated types
npx prisma generate
```

**Adding New API Endpoint:**
1. Create route file: `app/api/feature/route.ts`
2. Add Zod schema: `lib/validation/schemas/feature.ts`
3. Implement handler with `requireAuth` middleware
4. Add audit logging for tracking
5. Test with curl or API client

**Adding New Component:**
1. Create in `components/` with appropriate subdirectory
2. Use 'use client' directive if interactive
3. Import reusable UI components from `components/ui/`
4. Follow existing styling patterns (Tailwind)

### Debugging

**Server Logs:**
- Check terminal output for console.error() messages
- Prisma logs enabled in development mode

**Network Requests:**
- Use browser DevTools Network tab
- Check request/response headers and body
- Verify JWT cookie is being sent with requests

**Database Queries:**
- Enable Prisma debug logging: `PRISMA_CLIENT_ENGINE_TYPE=wasm`
- Query results accessible via Prisma Studio: `npx prisma studio`

---

## 9. Project Structure Summary

```
resolvera/
├── app/                          # Next.js pages & API routes
│   ├── api/                     # REST API endpoints
│   ├── (admin|dashboard|setup)/ # Page routes
│   └── layout.tsx               # Root layout
├── components/                  # React UI components
│   ├── layout/                 # Layout components
│   ├── ui/                     # Reusable UI elements
│   ├── modals/                 # Modal dialogs
│   └── watcher/                # Watcher-specific components
├── lib/                         # Core business logic & utilities
│   ├── api/                    # API helpers (responses, auth, etc.)
│   ├── auth/                   # JWT & authentication
│   ├── db/                     # Database access layer
│   ├── cloudflare/             # Cloudflare API wrapper
│   ├── security/               # Encryption, rate limiting
│   ├── services/               # Notifications, etc.
│   ├── cache/                  # In-memory caching
│   ├── audit/                  # Audit logging
│   ├── validation/             # Zod schemas
│   ├── storage/                # High-level data access
│   ├── utils/                  # Utility functions
│   └── watcher/                # Watcher scheduler & checker
├── hooks/                       # Custom React hooks
├── prisma/                      # Database schema & migrations
├── public/                      # Static assets
├── instrumentation.ts           # Server startup hook
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── README.md                   # User documentation
```

---

## 10. Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework with SSR |
| `react` / `react-dom` | UI library |
| `@prisma/client` | ORM for database access |
| `jose` | JWT token generation/verification |
| `bcrypt` | Password hashing |
| `node-cron` | Background job scheduling |
| `zod` | Input validation schemas |
| `tailwindcss` | CSS framework |

---

## Quick Reference

### Common Tasks

**Add a new API endpoint:**
1. Create `app/api/feature/route.ts`
2. Wrap handler with `requireAuth()` middleware
3. Use `getRequestUser()` to access user info
4. Return `successResponse()` or `errorResponse()`

**Query the database:**
```typescript
import { getUserById, getZoneByZoneId } from '@/lib/db/database';
const user = await getUserById(userId);
```

**Make Cloudflare API call:**
```typescript
import { updateDNSRecord } from '@/lib/cloudflare/api';
const result = await updateDNSRecord(zoneId, apiToken, recordId, data);
```

**Cache Cloudflare data:**
```typescript
import { cfCache, buildDNSRecordsKey } from '@/lib/cache/cloudflare';
const cached = cfCache.get(buildDNSRecordsKey(zoneId));
if (!cached) {
  cfCache.set(buildDNSRecordsKey(zoneId), records, 120000);
}
```

**Create audit log entry:**
```typescript
import { createAuditLog } from '@/lib/audit/logger';
await createAuditLog({
  action: 'dns.record.created',
  severity: 'info',
  success: true,
  resource: 'dns_record',
  resourceId: recordId,
});
```

---

## Deployment Notes

- Application runs as standalone Next.js server (`output: 'standalone'`)
- PostgreSQL database required (configure via `DATABASE_URL`)
- Environment variables must be set before startup
- Server startup runs watcher scheduler via instrumentation
- Reverse proxy (NGINX) recommended for HTTPS in production
- API tokens and sensitive data encrypted at rest

---

## Support & Documentation

- **User Guide**: `/README.md`
- **Deployment Docs**: `/documents/docker/`
- **API Schema**: Defined via TypeScript types and Zod schemas
- **Database Schema**: `/prisma/schema.prisma`
