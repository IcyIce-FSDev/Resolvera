# Development Guide

Complete guide for developing and extending Resolvera.

## Table of Contents

- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Organization](#code-organization)
- [Adding New Features](#adding-new-features)
- [Database Management](#database-management)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)

---

## Development Environment

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 20.x+ | Runtime environment |
| PostgreSQL | 16+ | Database |
| Git | Latest | Version control |
| VS Code | Latest | Recommended editor |

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://gitea.stull-group.com/iceflier/resolvera.git
cd resolvera

# 2. Install dependencies
npm install

# 3. Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE resolvera_dev;
CREATE USER resolvera WITH PASSWORD 'dev-password';
GRANT ALL PRIVILEGES ON DATABASE resolvera_dev TO resolvera;
\q

# 4. Configure environment
cp .env.example .env

# Edit .env:
DATABASE_URL="postgresql://resolvera:dev-password@localhost:5432/resolvera_dev"
JWT_SECRET="dev-secret-min-32-characters-long"
ENCRYPTION_KEY="dev-encryption-key-32-chars"
NODE_ENV="development"

# 5. Run database migrations
npx prisma migrate deploy

# 6. Generate Prisma client
npx prisma generate

# 7. Start development server
npm run dev

# 8. Setup admin account
# Navigate to http://localhost:3000/setup
```

---

## Project Structure

### Directory Overview

```
resolvera/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (server-side)
│   │   ├── auth/           # Authentication endpoints
│   │   ├── admin/          # Admin-only endpoints
│   │   ├── dns/            # DNS record operations
│   │   ├── zones/          # Zone management
│   │   ├── watchers/       # IP watcher endpoints
│   │   └── settings/       # User settings endpoints
│   ├── dashboard/          # Dashboard page
│   │   ├── page.tsx        # Main page component
│   │   ├── components/     # Dashboard-specific components
│   │   └── hooks/          # Dashboard hooks
│   ├── zones/              # Zones pages
│   ├── admin/              # Admin pages
│   ├── watcher/            # Watcher pages
│   ├── settings/           # Settings pages
│   └── setup/              # Initial setup page
│
├── lib/                    # Core application libraries
│   ├── auth/               # Authentication & JWT
│   ├── db/                 # Database layer (Prisma)
│   ├── cloudflare/         # Cloudflare API integration
│   ├── watcher/            # IP monitoring system
│   ├── audit/              # Audit logging
│   ├── security/           # Encryption utilities
│   ├── validation/         # Zod schemas
│   ├── services/           # External services (Discord)
│   ├── cache/              # Caching layer
│   ├── api/                # API utilities
│   ├── ui/                 # UI utilities
│   └── utils/              # General utilities
│
├── components/             # Reusable React components
│   ├── ui/                 # Base UI components
│   ├── layout/             # Layout components
│   └── modals/             # Modal dialogs
│
├── hooks/                  # Custom React hooks
├── prisma/                 # Database schema & migrations
├── public/                 # Static assets
└── .docker/                # Docker configuration
```

### Key Files

- **`instrumentation.ts`** - Server initialization, starts watcher scheduler
- **`middleware.ts`** - Next.js middleware (currently unused)
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`next.config.mjs`** - Next.js configuration
- **`.env`** - Environment variables
- **`package.json`** - Dependencies and scripts

---

## Development Workflow

### Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Database commands
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create new migration
npx prisma migrate deploy  # Apply migrations
npx prisma generate        # Regenerate Prisma client
npx prisma db push         # Push schema without migration (dev only)
```

### Hot Reload

Next.js 16 with Turbopack provides fast hot module replacement:

- **Frontend changes**: Auto-refresh in browser
- **API changes**: Auto-reload API routes
- **Environment changes**: Requires server restart

### Working with TypeScript

**Type checking:**
```bash
# Check types without building
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

**Prisma types:**
```bash
# Regenerate after schema changes
npx prisma generate

# Types are auto-imported from @prisma/client
import { User, Zone, AuditLog } from '@prisma/client';
```

---

## Code Organization

### File Naming Conventions

- **Pages**: `page.tsx` (Next.js convention)
- **API routes**: `route.ts` (Next.js convention)
- **Components**: `ComponentName.tsx` (PascalCase)
- **Hooks**: `useHookName.ts` (camelCase with 'use' prefix)
- **Utilities**: `utilityName.ts` (camelCase)
- **Types**: `types.ts` or inline in files

### Import Organization

```typescript
// 1. External dependencies
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 2. Internal libraries
import { requireAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';

// 3. Components
import Button from '@/components/ui/Button';

// 4. Hooks
import { useDarkMode } from '@/hooks/useDarkMode';

// 5. Types
import type { User } from '@prisma/client';

// 6. Utilities
import { formatDate } from '@/lib/utils/date';
```

### Component Structure

```typescript
'use client'; // If using client features

import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';

// Props interface
interface MyComponentProps {
  title: string;
  onSave: (data: string) => void;
}

// Component
export default function MyComponent({ title, onSave }: MyComponentProps) {
  // 1. Hooks
  const [data, setData] = useState<string>('');

  // 2. Effects
  useEffect(() => {
    // ...
  }, []);

  // 3. Callbacks (use useCallback for functions passed to children)
  const handleSave = useCallback(() => {
    onSave(data);
  }, [data, onSave]);

  // 4. Render
  return (
    <div>
      <h1>{title}</h1>
      {/* ... */}
    </div>
  );
}
```

### API Route Structure

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/responses';
import { validateSchema, mySchema } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const user = getRequestUser(req);

      // Authorization check
      if (user.role !== 'admin') {
        return errorResponse('Access denied', 403);
      }

      // Business logic
      const data = await fetchData();

      return successResponse(data);
    } catch (error) {
      console.error('Error:', error);
      return errorResponse(error, 500);
    }
  });
}

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();

      // Validation
      const validation = validateSchema(mySchema, body);
      if (!validation.success) {
        return validationErrorResponse(validation.errors || []);
      }

      // Process
      const result = await processData(validation.data);

      return successResponse(result);
    } catch (error) {
      console.error('Error:', error);
      return errorResponse(error, 500);
    }
  });
}
```

---

## Adding New Features

### Adding a New API Endpoint

**1. Create route file:**
```typescript
// app/api/myfeature/route.ts
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse } from '@/lib/api/responses';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req) => {
    try {
      // Your logic here
      return successResponse({ message: 'Success' });
    } catch (error) {
      return errorResponse(error, 500);
    }
  });
}
```

**2. Add validation schema (if needed):**
```typescript
// lib/validation/schemas/myfeature.ts
import { z } from 'zod';

export const myFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.number().int().positive()
});
```

**3. Add authorization (if needed):**
```typescript
// lib/api/myfeature/authorization.ts
export async function authorizeMyFeature(user: AuthorizedUser): Promise<boolean> {
  return user.role === 'admin';
}
```

**4. Add audit logging:**
```typescript
import { logOperation } from '@/lib/api/audit';

await logOperation('myfeature.action', request, user, resourceId, details, true);
```

### Adding a New Page

**1. Create page component:**
```typescript
// app/myfeature/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/session';
import PageLayout from '@/components/layout/PageLayout';

export default function MyFeaturePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!(await isAuthenticated())) {
        router.push('/');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <PageLayout currentPage="myfeature">
      <h1>My Feature</h1>
      {/* Your content */}
    </PageLayout>
  );
}
```

**2. Add navigation link:**
```typescript
// components/layout/PageLayout.tsx
// Add to navigation items
{
  name: 'My Feature',
  path: '/myfeature',
  icon: <svg>...</svg>
}
```

### Adding a Database Model

**1. Update Prisma schema:**
```prisma
// prisma/schema.prisma
model MyFeature {
  id        String   @id @default(uuid())
  name      String
  value     Int
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

**2. Create migration:**
```bash
npx prisma migrate dev --name add_my_feature
```

**3. Add database operations:**
```typescript
// lib/db/myfeature.ts
import { prisma } from './prisma';

export async function createMyFeature(data: {
  name: string;
  value: number;
  userId: string;
}) {
  return await prisma.myFeature.create({ data });
}

export async function getMyFeatures(userId: string) {
  return await prisma.myFeature.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}
```

---

## Database Management

### Prisma Studio

Visual database editor:
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Creating Migrations

```bash
# Create migration from schema changes
npx prisma migrate dev --name descriptive_name

# Examples:
npx prisma migrate dev --name add_user_preferences
npx prisma migrate dev --name add_email_notifications
npx prisma migrate dev --name index_audit_logs
```

### Applying Migrations

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Database Seeding

**1. Create seed file:**
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create test data
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: '...',
      role: 'user'
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**2. Run seed:**
```bash
npx prisma db seed
```

### Resetting Database

```bash
# ⚠️  WARNING: Deletes all data
npx prisma migrate reset

# Asks for confirmation, then:
# 1. Drops database
# 2. Creates database
# 3. Applies all migrations
# 4. Runs seed (if configured)
```

---

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Session persistence across page refresh
- [ ] Access protected routes without auth

**DNS Records:**
- [ ] Create A record
- [ ] Create AAAA record
- [ ] Create CNAME record
- [ ] Update record
- [ ] Delete record
- [ ] Validation error handling

**Watcher:**
- [ ] Create watcher
- [ ] Enable/disable watcher
- [ ] Manual check trigger
- [ ] Auto-update on mismatch
- [ ] Status updates

**Admin Features:**
- [ ] Create user
- [ ] Assign zones to user
- [ ] View audit logs
- [ ] Search audit logs
- [ ] Configure notifications

### Testing with Different Users

```sql
-- Create test users
INSERT INTO "User" (id, email, name, "passwordHash", role, "assignedZoneIds")
VALUES
  ('admin-id', 'admin@test.com', 'Admin', '$2b$10$...', 'admin', '{}'),
  ('user-id', 'user@test.com', 'User', '$2b$10$...', 'user', '{"zone-id-1"}');
```

---

## Debugging

### Server-Side Debugging

**Console logging:**
```typescript
console.log('[DEBUG]', 'Variable value:', value);
console.error('[ERROR]', 'Error occurred:', error);
```

**VS Code debugging:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-inspector",
      "request": "attach",
      "port": 9229,
      "restart": true
    }
  ]
}
```

```bash
# Start with debugging
NODE_OPTIONS='--inspect' npm run dev
```

### Client-Side Debugging

**Browser DevTools:**
- Console: View logs and errors
- Network: Check API requests
- Application: View cookies and localStorage
- React DevTools: Inspect component tree

**React DevTools Profiler:**
- Identify slow renders
- Track component updates
- Optimize performance

### Database Debugging

**Query logging:**
```typescript
// lib/db/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Explain queries:**
```sql
EXPLAIN ANALYZE
SELECT * FROM "AuditLog"
WHERE "userId" = 'user-id'
ORDER BY "timestamp" DESC
LIMIT 100;
```

---

## Performance Optimization

### Frontend Optimization

**1. Component memoization:**
```typescript
import { memo, useMemo, useCallback } from 'react';

const MyComponent = memo(function MyComponent({ data }) {
  const processedData = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);

  const handleClick = useCallback(() => {
    // ...
  }, []);

  return <div>...</div>;
});
```

**2. Code splitting:**
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

### Backend Optimization

**1. Database indexes:**
```prisma
model AuditLog {
  // ...
  @@index([timestamp])
  @@index([userId])
  @@index([action])
}
```

**2. Query optimization:**
```typescript
// ❌ Bad: N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  const logs = await prisma.auditLog.findMany({ where: { userId: user.id } });
}

// ✅ Good: Single query with relations
const users = await prisma.user.findMany({
  include: { auditLogs: true }
});
```

**3. Pagination:**
```typescript
const logs = await prisma.auditLog.findMany({
  skip: offset,
  take: limit,
  orderBy: { timestamp: 'desc' }
});
```

**4. Caching:**
```typescript
import { cfCache, buildDNSRecordsKey } from '@/lib/cache/cloudflare';

const cacheKey = buildDNSRecordsKey(zoneId);
let records = cfCache.get(cacheKey);

if (!records) {
  records = await fetchFromAPI();
  cfCache.set(cacheKey, records, ttl);
}
```

---

## Deployment

### Production Build

```bash
# 1. Build application
npm run build

# 2. Test production build locally
npm run start

# 3. Verify all features work
```

### Environment Variables

**Production .env:**
```env
DATABASE_URL="postgresql://resolvera:strong-password@localhost:5432/resolvera"
JWT_SECRET="production-secret-min-32-characters-CHANGE-THIS"
ENCRYPTION_KEY="production-key-32-chars-CHANGE-THIS"
NODE_ENV="production"
NEXT_PUBLIC_URL="https://yourdomain.com"
```

### Docker Deployment

```bash
# Build and start
docker compose up -d --build

# Check logs
docker compose logs -f app

# Restart
docker compose restart app
```

### Manual Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run migrations
npx prisma migrate deploy

# 4. Build
npm run build

# 5. Restart with PM2
pm2 restart resolvera

# Or with systemd
sudo systemctl restart resolvera
```

---

## Best Practices

### Code Quality

- **TypeScript strict mode**: Always enabled
- **ESLint**: Fix all warnings
- **Naming conventions**: Descriptive and consistent
- **Comments**: Explain why, not what
- **Error handling**: Always catch and log errors

### Security

- **Never log secrets**: No passwords, tokens, or API keys
- **Validate all input**: Use Zod schemas
- **Authorize all actions**: Check user permissions
- **Encrypt sensitive data**: Use AES-256-GCM
- **Audit critical operations**: Log security events

### Git Workflow

- **Commit often**: Small, focused commits
- **Descriptive messages**: Follow commit guidelines
- **Branch per feature**: Never commit directly to main
- **Test before pushing**: Build and test locally

---

**For more information, see:**
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Troubleshooting](TROUBLESHOOTING.md)
