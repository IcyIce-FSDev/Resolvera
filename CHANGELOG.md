# Changelog

All notable changes to Resolvera will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### Major Release - Production Ready

First stable release of Resolvera DNS Manager with comprehensive features for self-hosted Cloudflare DNS management.

### Added

**Core Features:**
- Multi-zone DNS management dashboard
- Complete CRUD operations for all DNS record types (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, PTR)
- Automated background IP watcher with cron scheduling (1-1440 minute intervals)
- Role-based access control (Admin and User roles)
- Zone assignment for users
- PostgreSQL database with Prisma ORM
- Dark mode support with persistent preference

**Security:**
- JWT authentication with HTTP-only cookies
- bcrypt password hashing (10 rounds + salt)
- AES-256-GCM encryption for Cloudflare API tokens
- Comprehensive input validation with Zod schemas
- Password strength requirements (min 12 chars, mixed case, numbers, special chars)
- Disposable email domain blocking

**Audit Logging:**
- Comprehensive activity tracking for all operations
- Searchable audit logs with keyword filtering
- Date range filtering with timezone support
- Auto-refresh with configurable intervals (5-60 seconds)
- Smart logging (only logs status changes to reduce noise)
- User attribution with automatic name resolution

**Notifications:**
- Discord webhook integration with rich embeds
- Color-coded notifications by event type
- Configurable event triggers (DNS changes, IP updates)
- Support for manual and automatic IP update notifications
- User tracking (shows who performed each action)

**IP Watcher:**
- Background scheduler using node-cron
- Automatic DNS updates when IP changes detected
- Support for both IPv4 (A) and IPv6 (AAAA) records
- Real-time status tracking (OK, Mismatch, Error)
- Manual trigger for immediate checks
- Startup checks on server restart
- Configurable check intervals and auto-update settings

**Performance:**
- In-memory caching for Cloudflare API responses
- Efficient database queries with proper indexing
- Pagination for large datasets
- Cache invalidation on mutations

**Deployment:**
- Docker support with Docker Compose
- Multi-stage Docker builds
- Health checks for both app and database containers
- Standalone Next.js output for optimized production builds
- Comprehensive environment variable configuration

**Documentation:**
- Complete README with quick start guides
- Feature-specific documentation (Watcher, Audit, Notifications)
- Docker deployment guides
- API reference documentation
- Architecture documentation
- Contributing guidelines
- Troubleshooting guide

### Changed

**Code Quality Improvements:**
- Refactored to use React 19 patterns (strict types, useCallback for stable refs)
- Implemented modular architecture with separated concerns
- Created reusable utility modules for common operations
- Standardized API response formats
- Improved error handling throughout application

**Phase 1 - Cross-File Utilities:**
- Created `lib/api/responses.ts` for unified API responses
- Created `lib/ui/statusColors.ts` for consistent status colors
- Created `hooks/usePageInitialization.ts` for shared auth logic
- Created `lib/api/dns/authorization.ts` for DNS authorization
- Created `lib/cloudflare/api.ts` for Cloudflare API wrapper
- Created `lib/api/audit.ts` for audit logging helpers
- Created `lib/api/notifications.ts` for notification helpers

**Phase 2 - Component Extraction:**
- Refactored Settings page (371→185 lines, 50% reduction)
  - Extracted `useAccountSettings` hook
  - Extracted `usePreferences` hook
  - Created `SettingsAccountTab` component
  - Created `SettingsPreferencesTab` component
- Refactored Dashboard page (540→143 lines, 73% reduction)
  - Extracted `useDashboardData` hook
  - Created `DashboardWatchersCard` component
  - Created `DashboardDNSRecordsCard` component
  - Created `DashboardAuditLogsCard` component

**Phase 3 - API Route Refactoring:**
- Refactored `app/api/dns/records/[id]/route.ts` (364→194 lines, 47% reduction)
- Refactored `app/api/dns/records/route.ts` (264→167 lines, 37% reduction)
- Applied utility functions throughout API routes

**Phase 4 - Services Modularization:**
- Modularized `lib/services/notification.ts` (229→74 lines, 68% reduction)
  - Extracted `notification/constants.ts`
  - Extracted `notification/discord-formatters.ts`
  - Extracted `notification/discord-client.ts`
- Modularized `lib/validation/schemas.ts` (217→40 lines, 82% reduction)
  - Extracted `schemas/password.ts`
  - Extracted `schemas/email.ts`
  - Extracted `schemas/user.ts`
  - Extracted `schemas/zone.ts`
  - Extracted `schemas/dns.ts`
  - Extracted `schemas/watcher.ts`
- Extracted utilities from `lib/audit/logger.ts` (226→203 lines)
  - Created `utils/ip.ts`
  - Created `utils/request.ts`
- Removed deprecated functions from `lib/db/database.ts` (357→304 lines)

### Fixed

**Performance Issues:**
- Fixed infinite render loops in Settings and Dashboard pages
- Fixed multiple concurrent API requests (5+ duplicate /api/auth/me calls)
- Implemented promise caching for session requests
- Fixed preferences loading delay with lazy initialization

**Data Handling:**
- Fixed watchers data extraction in dashboard (nested data structure)
- Fixed validation error property inconsistency (field vs path)
- Fixed type compatibility for user roles (JWT payload vs database)

**Security:**
- Fixed JWT cookie settings for Docker deployments (SameSite: 'lax')
- Improved session stability during navigation

### Technical Details

**Total Impact:**
- Reduced codebase by ~600 lines
- Created 17 new modular utility files
- Improved maintainability and reusability
- Enhanced type safety throughout
- Standardized patterns across codebase

**Dependencies:**
- Next.js 16.0.1 (App Router with Turbopack)
- React 19.2.0
- TypeScript 5.x
- PostgreSQL 16
- Prisma ORM 6.18.0
- Tailwind CSS v4
- Zod 4.1.12
- jose 6.1.0 (JWT)
- bcrypt 6.0.0
- node-cron 4.2.1

---

## [Unreleased]

### Planned for v1.1.0
- Enhanced Docker support with automated backups
- Multi-container scaling support
- Redis caching integration
- Performance monitoring dashboard

### Planned for v1.2.0
- Email notifications (SMTP)
- Slack webhook integration
- Telegram bot support
- Custom webhook templates

### Planned for v1.3.0
- Two-factor authentication (TOTP)
- API key management
- Enhanced session management
- Security policy configuration

---

## Version History

- **1.0.0** (2025-01-15) - Initial production release
- Development versions (pre-1.0.0) - Internal testing and development

---

**Legend:**
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements
