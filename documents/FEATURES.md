# Resolvera Features Guide

Complete overview of all features in Resolvera v1.0.0.

## Core Features

### Multi-Zone DNS Management

**Manage unlimited Cloudflare zones from a single dashboard.**

- Add zones with Cloudflare API tokens
- View all DNS records across all zones
- Create, edit, and delete DNS records
- Support for all DNS record types (A, AAAA, CNAME, MX, TXT, etc.)
- Real-time synchronization with Cloudflare
- Zone assignment to specific users

**Key Benefits**:
- Centralized management for multiple domains
- No need to log into Cloudflare for each zone
- Quick record creation with form validation
- Immediate updates reflected in Cloudflare

---

### User Management & Access Control

**Role-based access control with Admin and User roles.**

**Admin Capabilities**:
- Create, edit, and delete user accounts
- Assign zones to specific users
- Change user roles (Admin/User)
- View all users and their permissions
- Force password resets
- View user activity in audit logs

**User Capabilities**:
- Access assigned zones only
- Create/edit/delete DNS records in assigned zones
- Create watchers for assigned zones
- Change own password
- View personal activity logs

**Security Features**:
- bcrypt password hashing (10 rounds + salt)
- Role-based permissions enforced at API level
- JWT authentication with HTTP-only cookies
- Session management with configurable expiration
- Automatic logout on inactivity

---

### Automated IP Watcher System

**Monitor server IP addresses and automatically update DNS records.**

**Features**:
- Background cron scheduler (1-1440 minute intervals)
- IPv4 (A) and IPv6 (AAAA) record monitoring
- Status tracking (OK, Mismatch, Error)
- Optional auto-update on IP change
- Manual trigger for immediate checks
- Automatic startup check on server restart

**Configuration**:
- Check interval: 1-1440 minutes
- Auto-update: Enable/disable automatic DNS updates
- Notifications: Discord webhooks on IP changes

**Status Types**:
- **OK**: DNS IP matches server IP
- **Mismatch**: IPs don't match (needs update)
- **Error**: DNS record not found or API error

**Use Cases**:
- Home servers with dynamic IPs
- VPS monitoring for IP changes
- Failover detection
- Multiple server monitoring

[Complete Documentation](WATCHER_SYSTEM.md)

---

### Comprehensive Audit Logging

**Track all security-relevant operations with searchable logs.**

**Logged Events**:
- Authentication (login, logout, failures)
- User management (create, update, delete)
- DNS operations (all record changes)
- Watcher operations (create, update, delete, checks)
- Settings changes (notifications, cache, watcher)
- Security events (CSRF, rate limiting)

**Search Capabilities**:
- **Keyword Search**: Search across actions, resources, IPs, user agents
- **Date Range Filtering**: Filter by start and end dates
- **Combined Filters**: Mix keyword and date range
- **Pagination**: Handle large log volumes efficiently
- **Auto-Refresh**: Real-time updates (5s-60s intervals)

**Log Details**:
- Timestamp (exact time of event)
- Action type (what happened)
- Severity (info, warning, error, critical)
- User (who performed it)
- IP address (where from)
- Resource details (what was affected)
- Success/failure status

**Optimization**:
- Only logs status changes (reduces noise)
- Database indexed for fast queries
- Efficient pagination
- Automatic user name resolution

[Complete Documentation](AUDIT_LOGGING.md)

---

### Webhook Notifications

**Real-time notifications for DNS events and IP changes.**

**Supported Platforms**:
- ✅ Discord webhooks (with rich embeds)
- ⏳ Email (SMTP) - planned
- ⏳ Slack webhooks - planned
- ⏳ Telegram bots - planned

**Event Types**:
- DNS record add/edit/delete
- Watcher add/edit/delete
- IP update (manual and automatic)
- Color-coded severity levels
- Timestamp and user tracking

**Configuration**:
- Enable/disable per event type
- Multiple webhook URLs (future)
- Test notification button
- Retry logic on failure

**Discord Features**:
- Rich embeds with colors
- Detailed event information
- User attribution
- Timestamp display

[Complete Documentation](NOTIFICATIONS.md)

---

### Security Features

**Multi-layered security approach for production deployments.**

**Authentication**:
- JWT tokens with HTTP-only cookies
- Configurable session expiration
- Secure session management
- Automatic logout on inactivity

**Password Security**:
- bcrypt hashing (10 rounds)
- Salt per password
- Minimum length requirements
- No password in logs or responses

**API Token Protection**:
- AES-256-GCM encryption
- Encrypted at rest in database
- Decrypted only when needed
- Never exposed in API responses

**Input Validation**:
- Zod schemas for all inputs
- Type-safe validation
- SQL injection prevention
- XSS protection

**Access Control**:
- Role-based permissions (RBAC)
- Admin-only routes protected
- User-specific zone access
- API endpoint protection

**Audit Trail**:
- All operations logged
- User action tracking
- IP address logging
- Timestamp for every action

---

### Cache Management

**Optimize API performance with configurable caching.**

**Features**:
- In-memory caching for API responses
- Configurable TTL per endpoint
- Manual cache clearing
- Cache statistics and monitoring

**Cached Resources**:
- DNS records (configurable TTL)
- Zone information
- User data
- Watcher status

**Cache Control**:
- View cache statistics (hit/miss rates)
- Configure TTL per resource type
- Clear entire cache
- Clear specific cache entries

**Performance**:
- Reduces Cloudflare API calls
- Faster page loads
- Lower latency for repeat requests
- Configurable cache duration

---

### Modern User Interface

**Clean, responsive design with dark mode support.**

**Design Features**:
- Tailwind CSS v4 styling
- Mobile-responsive layout
- Dark mode toggle
- System preference detection
- Consistent component library

**User Experience**:
- Intuitive navigation
- Real-time feedback
- Loading states
- Error messages
- Success notifications
- Toast notifications
- Modal dialogs

**Accessibility**:
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus indicators
- Color contrast compliance

**Pages**:
- Dashboard (stats and overview)
- DNS Records (zone management)
- Watchers (IP monitoring)
- Admin Panel (user and settings management)
- Settings (user preferences)
- Activity Logs (audit trail)

---

## Advanced Features

### Dashboard Statistics

**Real-time overview of system status.**

**Metrics Displayed**:
- Total users count
- Total zones count
- Total DNS records count
- Active watchers count

**Auto-Update**:
- Refreshes on navigation
- Real-time data from database
- No caching of stats

---

### Zone Assignment

**Admins can assign specific zones to users.**

**How It Works**:
1. Admin creates user account
2. Admin assigns zones to user
3. User sees only assigned zones
4. User can manage only assigned zones

**Benefits**:
- Multi-tenant support
- Delegated zone management
- Clear permission boundaries
- Audit trail per user

---

### Watcher Scheduler

**Background cron-based task scheduler for IP monitoring.**

**Implementation**:
- Uses node-cron for scheduling
- Runs in Next.js instrumentation hook
- Starts automatically on server boot
- Survives process restarts (new instance created)

**Monitoring**:
- Check scheduler status via API
- View last check time
- See check interval
- Manual trigger capability

---

### IP Detection

**Automatic server IP address detection.**

**Capabilities**:
- IPv4 detection
- IPv6 detection
- Proxy support (X-Forwarded-For headers)
- IP normalization (IPv4-mapped IPv6 → IPv4)

**API Endpoint**: `/api/ip`

Returns:
```json
{
  "success": true,
  "data": {
    "ipv4": "192.168.1.1",
    "ipv6": "2001:db8::1"
  }
}
```

---

## Integration Features

### Cloudflare API Integration

**Full integration with Cloudflare API v4.**

**Supported Operations**:
- List zones
- List DNS records (all types)
- Create DNS records
- Update DNS records
- Delete DNS records
- Paginated results handling
- Error handling and retry logic

**API Token Requirements**:
- Zone:Read permission
- DNS:Read permission
- DNS:Edit permission (for updates)

---

### Database Layer

**PostgreSQL with Prisma ORM.**

**Schema**:
- Users table (authentication and profiles)
- Zones table (Cloudflare zone configuration)
- UserZones table (zone assignment)
- Watchers table (IP monitoring configuration)
- WatcherSettings table (global watcher config)
- NotificationSettings table (webhook config)
- CacheSettings table (cache configuration)
- AuditLog table (activity tracking)

**Features**:
- Migrations with Prisma Migrate
- Type-safe queries
- Relation handling
- Indexes for performance
- Transaction support

---

## Security & Compliance

### Compliance Support

**Features supporting compliance requirements:**

**SOC 2**:
- Comprehensive audit logging
- Access control enforcement
- Encryption at rest
- Session management

**GDPR**:
- User data tracking
- Privacy-conscious logging
- User deletion support
- Data minimization

**HIPAA** (if applicable):
- Audit trail requirements
- Access control
- Encryption standards

**PCI DSS** (if handling payments):
- Access control logging
- Encryption requirements

---

## Performance Features

### Optimization Techniques

**Frontend**:
- Next.js App Router
- React 19 concurrent rendering
- Code splitting
- Image optimization
- Font optimization (Geist)

**Backend**:
- Database connection pooling
- Query optimization
- Efficient indexes
- Caching layer
- API response compression

**Database**:
- Indexed columns for fast queries
- Relation loading optimization
- Pagination for large datasets
- Connection reuse

---

## Developer Features

### TypeScript Support

**Full TypeScript implementation:**
- Type-safe components
- API type definitions
- Database types from Prisma
- Zod schema validation
- No `any` types in production code

### Code Organization

**Clean architecture:**
- Separation of concerns
- Reusable components
- Shared utilities
- Consistent patterns
- Well-documented code

### Environment Configuration

**Flexible configuration:**
- Environment variables
- Development vs Production modes
- Configurable timeouts
- Feature flags (future)

---

## Coming Soon

### Planned Features (v1.1.0+)

**Docker Containerization** (v1.1.0):
- Complete Docker setup
- Docker Compose configuration
- Multi-stage builds
- Production-ready images

**Email Notifications** (v1.2.0):
- SMTP configuration
- HTML email templates
- Batch digest mode

**Two-Factor Authentication** (v1.3.0):
- TOTP support
- Backup codes
- Recovery options

**Bulk Operations** (v1.4.0):
- Bulk DNS record updates
- Import/Export configurations
- Template system

**Analytics Dashboard** (v1.5.0):
- Historical data
- Trend analysis
- Performance metrics

**Nginx Integration** (v2.0.0):
- Reverse proxy configuration
- SSL certificate management
- Load balancing

---

## Feature Comparison

| Feature | Resolvera | Cloudflare Dashboard | Other DNS Managers |
|---------|-----------|---------------------|-------------------|
| Multi-Zone Management | ✅ | ✅ | Varies |
| User Management | ✅ | ⚠️ Limited | Varies |
| IP Watcher | ✅ | ❌ | Varies |
| Audit Logs | ✅ Searchable | ⚠️ Basic | Varies |
| Notifications | ✅ Discord | ⚠️ Email only | Varies |
| Self-Hosted | ✅ | ❌ | Varies |
| Open Source | ✅ MIT | ❌ | Varies |
| Dark Mode | ✅ | ✅ | Varies |

---

## Use Cases

### Home Lab Management
- Monitor dynamic IP changes
- Auto-update DNS records
- Centralized DNS management
- Multiple domain support

### Small Business
- Team member access control
- Audit trail for compliance
- Centralized management
- Zone delegation

### Development Teams
- Separate environments (dev/staging/prod)
- Zone assignment per developer
- Change tracking
- Notification integration

### MSP/Agency
- Manage client zones
- User per client
- Audit trail per client
- Automated monitoring

---

This features guide covers all major capabilities in Resolvera v1.0.0. For detailed documentation on specific features, see the linked documentation files.
