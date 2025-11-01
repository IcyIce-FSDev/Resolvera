# Nginx Management Integration Plan

**Status:** Planning / Design Phase
**Created:** 2025-11-01
**Version:** 1.0.0

## Executive Summary

This document outlines the plan to extend Resolvera from a DNS management tool into a comprehensive DNS + web server management platform by integrating Nginx configuration management capabilities. This would allow Resolvera to automatically generate, update, and manage Nginx configurations based on DNS records and zones.

---

## Table of Contents

1. [Current State](#current-state)
2. [Vision & Goals](#vision--goals)
3. [Use Cases](#use-cases)
4. [Architecture Overview](#architecture-overview)
5. [Implementation Phases](#implementation-phases)
6. [Technical Design](#technical-design)
7. [Security Considerations](#security-considerations)
8. [API Design](#api-design)
9. [Database Schema Changes](#database-schema-changes)
10. [UI/UX Design](#uiux-design)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Strategy](#deployment-strategy)
13. [Risks & Mitigation](#risks--mitigation)
14. [Future Enhancements](#future-enhancements)

---

## Current State

### What Exists

- **Comprehensive Nginx Documentation** (`documents/planned/NGINX.md`)
  - Installation guides for Ubuntu/Debian and CentOS/RHEL
  - Three production-ready configuration templates
  - SSL/TLS setup with Let's Encrypt integration
  - Security hardening and performance optimization
  - Automated setup script (embedded in documentation)

- **Resolvera Core Features**
  - Multi-zone DNS management via Cloudflare API
  - Background IP watcher with automatic DNS updates
  - Audit logging for all DNS changes
  - Role-based access control (admin/user)
  - Webhook notifications (Discord)
  - JWT authentication with encrypted API tokens

### What Doesn't Exist

- No API endpoints for Nginx configuration management
- No database models for Nginx server/site configurations
- No UI for managing Nginx configurations
- No automated Nginx config generation from DNS records
- No Nginx status monitoring or integration
- No automated SSL certificate management in the app
- No nginx reload/restart automation from the application

---

## Vision & Goals

### Primary Vision

Transform Resolvera into a unified DNS and web server management platform where:

1. **DNS records automatically generate corresponding Nginx configurations**
   - A record for `app.example.com` → Nginx server block for that domain
   - Auto-configure proxying, SSL, caching based on templates

2. **Single source of truth for domain configurations**
   - Manage DNS and web server config from one interface
   - Reduce configuration drift between DNS and Nginx

3. **Automated SSL certificate lifecycle management**
   - Automatic Let's Encrypt certificate provisioning
   - Renewal tracking and automation
   - Certificate health monitoring

4. **Zero-touch domain provisioning**
   - Add DNS record → Nginx config generated → SSL cert provisioned
   - Remove DNS record → Nginx config removed → Certificate cleaned up

### Goals

**Short-term (Phase 1-2):**
- Basic Nginx configuration management (create, read, update, delete)
- Manual Nginx config generation from templates
- Configuration validation and testing
- Nginx reload/restart automation

**Medium-term (Phase 3-4):**
- Automatic Nginx config generation from DNS records
- SSL certificate management integration (Let's Encrypt)
- Nginx status monitoring and health checks
- Configuration backup and rollback

**Long-term (Phase 5+):**
- Advanced load balancing configuration
- WAF (Web Application Firewall) rule management
- Rate limiting and DDoS protection configuration
- Multi-server Nginx deployment management
- Integration with other reverse proxies (Traefik, Caddy)

---

## Use Cases

### Use Case 1: Automated SaaS Provisioning

**Scenario:** A SaaS platform uses Resolvera to manage customer subdomains.

**Workflow:**
1. Customer signs up for `customer123.saas-platform.com`
2. Application creates DNS A record via Resolvera API
3. Resolvera automatically:
   - Creates Nginx server block for `customer123.saas-platform.com`
   - Configures reverse proxy to application backend
   - Provisions Let's Encrypt SSL certificate
   - Reloads Nginx
4. Customer's subdomain is live with HTTPS in under 2 minutes

**Benefits:**
- Fully automated domain provisioning
- No manual Nginx configuration required
- Automatic SSL certificate management
- Reduced time-to-live for new customers

### Use Case 2: Multi-tenant Application Hosting

**Scenario:** A hosting provider manages multiple client websites.

**Workflow:**
1. Client requests new website for `client-website.com`
2. Admin adds zone in Resolvera with DNS records
3. Admin configures Nginx template (PHP-FPM, Node.js, static site, etc.)
4. Resolvera generates optimized Nginx configuration
5. SSL certificate auto-provisioned and configured
6. Website goes live with caching, compression, security headers

**Benefits:**
- Consistent configuration across all sites
- Automatic security best practices applied
- Centralized management of all client sites
- Audit trail of all configuration changes

### Use Case 3: Development/Staging/Production Pipeline

**Scenario:** A development team manages multiple environments.

**Workflow:**
1. Developer creates `feature-xyz.dev.example.com` DNS record
2. Resolvera auto-generates Nginx config with:
   - HTTP-only (no SSL overhead for dev)
   - Proxy to local development backend
   - Relaxed caching headers
3. On promotion to staging, config automatically updated with:
   - SSL enabled
   - Stricter caching
   - Security headers
4. Production promotion applies production-grade config template

**Benefits:**
- Environment-appropriate configurations
- No manual nginx config editing per environment
- Reduced configuration errors
- Fast environment provisioning

### Use Case 4: Certificate Lifecycle Management

**Scenario:** A DevOps team manages 100+ domains with SSL certificates.

**Workflow:**
1. Resolvera monitors all SSL certificate expiration dates
2. 30 days before expiry, sends Discord/Slack notification
3. 7 days before expiry, auto-renews Let's Encrypt certificates
4. On renewal, automatically tests and reloads Nginx
5. Audit log tracks all certificate operations

**Benefits:**
- No unexpected certificate expiry outages
- Automated renewal process
- Visibility into certificate health across all domains
- Compliance reporting for security audits

### Use Case 5: High-Availability Load Balancing

**Scenario:** An application needs load balancing across multiple backends.

**Workflow:**
1. Admin creates DNS record for `api.example.com`
2. Configures Nginx template with upstream servers:
   - Backend 1: `10.0.1.10:3000`
   - Backend 2: `10.0.1.11:3000`
   - Backend 3: `10.0.1.12:3000`
3. Resolvera generates Nginx config with:
   - Round-robin load balancing
   - Health checks
   - Automatic backend failover
   - Session persistence (if needed)
4. Monitors backend health and removes failed backends

**Benefits:**
- Centralized load balancer configuration
- Automated health monitoring
- Easy backend scaling (add/remove backends via UI)
- Visibility into load distribution

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Resolvera Application                   │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │   DNS Manager  │  │  Nginx Manager │  │ SSL Manager  │ │
│  │                │  │                │  │              │ │
│  │ • Cloudflare   │  │ • Config Gen   │  │ • Let's      │ │
│  │   API          │  │ • Validation   │  │   Encrypt    │ │
│  │ • IP Watcher   │  │ • Reload       │  │ • Renewal    │ │
│  │ • Audit Log    │  │ • Templates    │  │ • Monitoring │ │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘ │
│           │                   │                   │         │
│           └───────────────────┴───────────────────┘         │
│                              │                              │
│                   ┌──────────▼──────────┐                   │
│                   │  PostgreSQL + Prisma │                   │
│                   │                      │                   │
│                   │  • Zones             │                   │
│                   │  • DNS Records       │                   │
│                   │  • Nginx Sites       │                   │
│                   │  • SSL Certificates  │                   │
│                   │  • Templates         │                   │
│                   └──────────────────────┘                   │
└──────────────────────────────┬───────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Nginx Server      │
                    │                     │
                    │  • /etc/nginx/      │
                    │  • sites-available/ │
                    │  • sites-enabled/   │
                    │  • SSL certs/       │
                    └─────────────────────┘
```

### Component Interactions

1. **DNS Record Change**
   ```
   User/API → DNS Manager → Database → Nginx Manager → Config Generation
                                    ↓
                              Audit Log → Webhook Notification
                                    ↓
                           Nginx Config File → Validation → Reload
   ```

2. **SSL Certificate Provisioning**
   ```
   Nginx Site Created → SSL Manager → Let's Encrypt API → Certificate
                                                        ↓
                                           Nginx Config Updated → Reload
   ```

3. **Background Certificate Renewal**
   ```
   Cron Scheduler → SSL Manager → Check Expiry → Renew (if <7 days)
                                              ↓
                                    Test Config → Reload → Audit Log
   ```

### Integration Points

1. **File System Access**
   - Resolvera needs write access to `/etc/nginx/`
   - Requires root/sudo privileges or specific user permissions
   - Options:
     - Run Resolvera as root (not recommended)
     - Use sudo with NOPASSWD for specific commands
     - Run nginx-config-generator as separate privileged service

2. **Nginx Control**
   - Config validation: `nginx -t`
   - Reload: `nginx -s reload`
   - Restart: `systemctl restart nginx`
   - Status check: `systemctl status nginx`

3. **SSL Certificate Storage**
   - Let's Encrypt certs: `/etc/letsencrypt/live/`
   - Custom certs: `/etc/nginx/ssl/`
   - Permissions: readable by nginx user

4. **Cloudflare Integration (existing)**
   - DNS record management
   - DNS challenge for Let's Encrypt (optional)
   - Already implemented, no changes needed

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Basic Nginx configuration management without automation

**Tasks:**
- [ ] Database schema design for Nginx sites
- [ ] Create `NginxSite` model in Prisma
- [ ] API endpoints for CRUD operations on Nginx sites
- [ ] Configuration template system
- [ ] File system abstraction layer
- [ ] Nginx validation and reload utilities
- [ ] Basic UI for site management
- [ ] Audit logging integration

**Deliverables:**
- Manual Nginx site creation via UI
- Template-based config generation
- Config validation before applying
- Audit trail of all config changes

**Risks:**
- File system permission issues
- Nginx reload failures
- Invalid configuration breaking existing sites

### Phase 2: Templates & Validation (Weeks 3-4)

**Goal:** Robust configuration templates and safety mechanisms

**Tasks:**
- [ ] Pre-built templates (static site, reverse proxy, PHP, Node.js)
- [ ] Template variable interpolation system
- [ ] Configuration syntax validation
- [ ] Dry-run mode (generate without applying)
- [ ] Configuration diff viewer
- [ ] Rollback mechanism (backup before changes)
- [ ] Template management UI
- [ ] Template versioning

**Deliverables:**
- Production-ready configuration templates
- Safe config deployment with rollback
- Template library for common use cases
- Visual config preview before applying

**Risks:**
- Template injection vulnerabilities
- Insufficient validation catching errors
- Rollback system failures

### Phase 3: Automation & Integration (Weeks 5-6)

**Goal:** Automatic Nginx config generation from DNS records

**Tasks:**
- [ ] DNS record → Nginx site mapping logic
- [ ] Automatic config generation triggers
- [ ] Integration with IP watcher system
- [ ] Conditional automation (enable/disable per zone)
- [ ] Site activation/deactivation workflows
- [ ] Batch operations (sync all zones)
- [ ] Conflict detection (duplicate server names)
- [ ] Migration tool for existing Nginx configs

**Deliverables:**
- Automatic Nginx config creation on DNS record add
- Automatic config removal on DNS record delete
- Bulk sync of all zones to Nginx
- Import existing Nginx configs into Resolvera

**Risks:**
- Unintended config changes
- Race conditions in automation
- Breaking existing manual Nginx configs

### Phase 4: SSL Management (Weeks 7-8)

**Goal:** Automated SSL certificate lifecycle management

**Tasks:**
- [ ] `SSLCertificate` database model
- [ ] Let's Encrypt ACME client integration (acme.sh or certbot API)
- [ ] Automatic certificate provisioning
- [ ] HTTP-01 challenge support (Nginx webroot)
- [ ] DNS-01 challenge support (via Cloudflare)
- [ ] Certificate renewal background job
- [ ] Expiry monitoring and alerting
- [ ] Certificate status dashboard
- [ ] Manual certificate upload support

**Deliverables:**
- Automatic SSL provisioning for new sites
- Auto-renewal 7 days before expiry
- Certificate health monitoring dashboard
- Notifications for cert issues

**Risks:**
- Rate limiting from Let's Encrypt
- Failed certificate challenges
- Certificate renewal failures causing outages

### Phase 5: Monitoring & Advanced Features (Weeks 9-10)

**Goal:** Nginx monitoring and advanced configurations

**Tasks:**
- [ ] Nginx status integration (stub_status module)
- [ ] Real-time request metrics
- [ ] Log parsing and analytics
- [ ] Error rate monitoring
- [ ] Upstream health checks
- [ ] Load balancing configuration UI
- [ ] Rate limiting rules
- [ ] Custom security headers per site
- [ ] Performance metrics dashboard

**Deliverables:**
- Real-time Nginx performance dashboard
- Advanced load balancing setup
- Per-site security configuration
- Nginx log insights

**Risks:**
- Performance impact of monitoring
- Complex configurations hard to maintain
- Nginx module dependencies

### Phase 6: Multi-Server & Enterprise (Weeks 11-12)

**Goal:** Manage Nginx across multiple servers

**Tasks:**
- [ ] Server inventory management
- [ ] Remote Nginx config deployment (SSH/API)
- [ ] Configuration synchronization
- [ ] Cluster health monitoring
- [ ] High-availability setup automation
- [ ] Configuration inheritance (global → server → site)
- [ ] RBAC for Nginx management
- [ ] Compliance reporting

**Deliverables:**
- Manage Nginx on multiple servers from one interface
- Synchronized configurations across cluster
- Enterprise-grade access control
- Compliance and audit reports

**Risks:**
- Network reliability for remote management
- Configuration drift across servers
- Complex RBAC requirements

---

## Technical Design

### Database Schema Changes

#### New Models

```prisma
// Nginx site configuration
model NginxSite {
  id            String   @id @default(cuid())
  name          String   @unique // e.g., "app.example.com"
  zoneId        String?  @unique // Optional link to Zone
  zone          Zone?    @relation(fields: [zoneId], references: [id], onDelete: SetNull)

  // Server configuration
  serverName    String[]          // Array of domain names
  listenPorts   Int[]             // Ports to listen on (80, 443)
  rootPath      String?           // Document root for static sites
  upstreamUrl   String?           // Backend URL for reverse proxy
  upstreamServers Json?           // Multiple upstream servers for load balancing

  // SSL configuration
  sslEnabled    Boolean  @default(false)
  sslCertId     String?  @unique
  sslCert       SSLCertificate? @relation(fields: [sslCertId], references: [id], onDelete: SetNull)
  httpRedirect  Boolean  @default(true) // Redirect HTTP → HTTPS

  // Template and generation
  templateId    String?
  template      NginxTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  configContent String   @db.Text // Generated config
  customConfig  String?  @db.Text // User overrides

  // Status and management
  enabled       Boolean  @default(true)  // Symlinked to sites-enabled
  autoManaged   Boolean  @default(true)  // Auto-update on DNS changes
  lastValidated DateTime?
  lastApplied   DateTime?
  lastError     String?  @db.Text

  // Advanced options
  options       Json?    // Custom nginx directives as JSON

  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String
  user          User     @relation(fields: [createdBy], references: [id])

  @@index([zoneId])
  @@index([enabled])
  @@index([autoManaged])
}

// SSL certificate management
model SSLCertificate {
  id              String   @id @default(cuid())
  domain          String   @unique

  // Certificate files
  certPath        String   // Path to certificate file
  keyPath         String   // Path to private key
  chainPath       String?  // Path to certificate chain
  fullchainPath   String?  // Path to fullchain (cert + chain)

  // Certificate info
  issuer          String   // "Let's Encrypt", "Manual", etc.
  validFrom       DateTime
  validUntil      DateTime
  autoRenew       Boolean  @default(true)

  // Let's Encrypt integration
  acmeProvider    String?  // "letsencrypt-prod", "letsencrypt-staging"
  acmeEmail       String?
  challengeType   String?  // "http-01", "dns-01"

  // Status
  status          String   @default("active") // active, expired, revoked, pending
  lastRenewal     DateTime?
  nextRenewal     DateTime?
  renewalAttempts Int      @default(0)
  lastError       String?  @db.Text

  // Relations
  nginxSite       NginxSite?

  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  user            User     @relation(fields: [createdBy], references: [id])

  @@index([domain])
  @@index([status])
  @@index([validUntil])
  @@index([autoRenew])
}

// Configuration templates
model NginxTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?  @db.Text

  // Template content
  config      String   @db.Text // Nginx config with {{variables}}
  variables   Json     // Schema for variables

  // Template metadata
  type        String   // "static", "reverse-proxy", "php", "node", "load-balancer"
  category    String?  // "basic", "advanced", "enterprise"
  version     String   @default("1.0.0")

  // Status
  isBuiltIn   Boolean  @default(false)
  isActive    Boolean  @default(true)

  // Relations
  sites       NginxSite[]

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?
  user        User?    @relation(fields: [createdBy], references: [id])

  @@index([type])
  @@index([isActive])
}

// Server inventory (for multi-server management)
model NginxServer {
  id           String   @id @default(cuid())
  name         String   @unique
  hostname     String   // server.example.com
  ipAddress    String

  // Connection details
  sshHost      String?
  sshPort      Int      @default(22)
  sshUser      String?
  sshKeyPath   String?  // Encrypted SSH key

  // Nginx paths (may vary per server)
  nginxBinary  String   @default("/usr/sbin/nginx")
  configPath   String   @default("/etc/nginx")
  sitesPath    String   @default("/etc/nginx/sites-available")
  enabledPath  String   @default("/etc/nginx/sites-enabled")

  // Status
  enabled      Boolean  @default(true)
  lastContact  DateTime?
  status       String   @default("unknown") // online, offline, unreachable
  version      String?  // Nginx version

  // Metadata
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  createdBy    String
  user         User     @relation(fields: [createdBy], references: [id])

  @@index([enabled])
  @@index([status])
}
```

#### Schema Modifications

```prisma
// Add to existing Zone model
model Zone {
  // ... existing fields ...

  // Nginx integration
  nginxEnabled     Boolean       @default(false)
  nginxAutoSync    Boolean       @default(false)
  nginxTemplateId  String?
  nginxSite        NginxSite?
}

// Add to existing User model
model User {
  // ... existing fields ...

  // Relations
  nginxSites       NginxSite[]
  sslCertificates  SSLCertificate[]
  nginxTemplates   NginxTemplate[]
  nginxServers     NginxServer[]
}

// Extend AuditLog actions
enum AuditAction {
  // ... existing actions ...
  NGINX_SITE_CREATED
  NGINX_SITE_UPDATED
  NGINX_SITE_DELETED
  NGINX_SITE_ENABLED
  NGINX_SITE_DISABLED
  NGINX_CONFIG_VALIDATED
  NGINX_CONFIG_APPLIED
  NGINX_RELOAD_SUCCESS
  NGINX_RELOAD_FAILED
  SSL_CERT_CREATED
  SSL_CERT_RENEWED
  SSL_CERT_EXPIRED
  SSL_CERT_ERROR
  NGINX_TEMPLATE_CREATED
  NGINX_TEMPLATE_UPDATED
}
```

### File System Architecture

```
/etc/nginx/
├── nginx.conf                     # Main config (don't modify)
├── conf.d/                        # Additional configs
│   └── resolvera-global.conf      # Resolvera global settings
├── sites-available/               # All site configs
│   ├── app.example.com.conf       # Managed by Resolvera
│   ├── api.example.com.conf       # Managed by Resolvera
│   └── manual-site.conf           # Manually created
├── sites-enabled/                 # Active sites (symlinks)
│   ├── app.example.com.conf -> ../sites-available/app.example.com.conf
│   └── api.example.com.conf -> ../sites-available/api.example.com.conf
├── ssl/                           # SSL certificates
│   └── resolvera/                 # Resolvera-managed certs
│       ├── app.example.com/
│       │   ├── fullchain.pem
│       │   └── privkey.pem
│       └── api.example.com/
│           ├── fullchain.pem
│           └── privkey.pem
└── backups/                       # Config backups
    └── resolvera/
        ├── app.example.com.conf.2025-11-01-120000
        └── api.example.com.conf.2025-11-01-115500
```

### Configuration Template System

#### Template Variables

Templates use Handlebars-style syntax for variables:

```nginx
# Example template: reverse-proxy.conf
server {
    listen {{listenPort}};
    listen [::]:{{listenPort}};

    server_name {{serverName}};

    {{#if sslEnabled}}
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    ssl_certificate {{sslCertPath}};
    ssl_certificate_key {{sslKeyPath}};
    ssl_protocols TLSv1.2 TLSv1.3;
    {{/if}}

    location / {
        proxy_pass {{upstreamUrl}};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        {{#if enableCaching}}
        proxy_cache resolvera_cache;
        proxy_cache_valid 200 {{cacheTime}};
        {{/if}}
    }

    {{#if customLocations}}
    {{customLocations}}
    {{/if}}
}
```

#### Built-in Templates

1. **Static Site**
   - Serves static files from document root
   - Gzip compression
   - Browser caching headers
   - Security headers

2. **Reverse Proxy**
   - Proxy to backend application
   - WebSocket support
   - Proxy headers
   - Connection pooling

3. **PHP Application**
   - PHP-FPM integration
   - FastCGI parameters
   - Index file handling
   - Static file optimization

4. **Node.js Application**
   - Proxy to Node.js backend
   - WebSocket support
   - Long timeout configurations
   - Error page handling

5. **Load Balancer**
   - Multiple upstream servers
   - Health checks
   - Session persistence
   - Failover configuration

6. **SPA (Single Page Application)**
   - All routes → index.html
   - API proxy for /api/* routes
   - Asset optimization
   - History mode support

### Nginx Management Service

#### Service Layer Architecture

```typescript
// lib/nginx/manager.ts

import { NginxConfigGenerator } from './config-generator';
import { NginxValidator } from './validator';
import { FileSystemService } from './filesystem';
import { NginxControlService } from './control';
import { logAudit } from '@/lib/audit/logger';

export class NginxManager {
  private configGenerator: NginxConfigGenerator;
  private validator: NginxValidator;
  private fileSystem: FileSystemService;
  private control: NginxControlService;

  constructor() {
    this.configGenerator = new NginxConfigGenerator();
    this.validator = new NginxValidator();
    this.fileSystem = new FileSystemService();
    this.control = new NginxControlService();
  }

  /**
   * Create or update Nginx site configuration
   */
  async upsertSite(siteConfig: NginxSiteConfig): Promise<Result> {
    try {
      // 1. Generate configuration from template
      const configContent = await this.configGenerator.generate(siteConfig);

      // 2. Validate configuration syntax
      const validationResult = await this.validator.validate(configContent);
      if (!validationResult.valid) {
        throw new Error(`Invalid config: ${validationResult.errors.join(', ')}`);
      }

      // 3. Backup existing config (if exists)
      if (await this.fileSystem.configExists(siteConfig.name)) {
        await this.fileSystem.backupConfig(siteConfig.name);
      }

      // 4. Write config to sites-available
      const configPath = await this.fileSystem.writeConfig(
        siteConfig.name,
        configContent
      );

      // 5. Test nginx configuration
      const testResult = await this.control.testConfig();
      if (!testResult.success) {
        // Rollback on test failure
        await this.fileSystem.rollbackConfig(siteConfig.name);
        throw new Error(`Config test failed: ${testResult.error}`);
      }

      // 6. Enable site (create symlink) if needed
      if (siteConfig.enabled) {
        await this.fileSystem.enableSite(siteConfig.name);
      }

      // 7. Reload nginx
      const reloadResult = await this.control.reload();
      if (!reloadResult.success) {
        // Rollback on reload failure
        await this.fileSystem.rollbackConfig(siteConfig.name);
        await this.control.reload();
        throw new Error(`Nginx reload failed: ${reloadResult.error}`);
      }

      // 8. Update database
      await prisma.nginxSite.upsert({
        where: { name: siteConfig.name },
        create: {
          ...siteConfig,
          configContent,
          lastValidated: new Date(),
          lastApplied: new Date(),
        },
        update: {
          ...siteConfig,
          configContent,
          lastValidated: new Date(),
          lastApplied: new Date(),
          lastError: null,
        },
      });

      // 9. Audit log
      await logAudit({
        action: 'NGINX_SITE_CREATED',
        resource: 'nginx_site',
        resourceId: siteConfig.name,
        details: { serverName: siteConfig.serverName },
        userId: siteConfig.createdBy,
        severity: 'info',
      });

      return { success: true, configPath };

    } catch (error) {
      // Log error in database
      await prisma.nginxSite.update({
        where: { name: siteConfig.name },
        data: {
          lastError: error.message,
        },
      }).catch(() => {});

      throw error;
    }
  }

  /**
   * Delete Nginx site configuration
   */
  async deleteSite(siteName: string): Promise<Result> {
    try {
      // 1. Disable site first
      await this.fileSystem.disableSite(siteName);

      // 2. Test and reload
      await this.control.testConfig();
      await this.control.reload();

      // 3. Backup before deletion
      await this.fileSystem.backupConfig(siteName);

      // 4. Delete config file
      await this.fileSystem.deleteConfig(siteName);

      // 5. Update database
      await prisma.nginxSite.delete({
        where: { name: siteName },
      });

      // 6. Audit log
      await logAudit({
        action: 'NGINX_SITE_DELETED',
        resource: 'nginx_site',
        resourceId: siteName,
        severity: 'warning',
      });

      return { success: true };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Synchronize all zones with Nginx
   */
  async syncAllZones(): Promise<SyncResult> {
    const zones = await prisma.zone.findMany({
      where: { nginxEnabled: true, nginxAutoSync: true },
      include: { nginxSite: true },
    });

    const results = [];

    for (const zone of zones) {
      try {
        // Generate site config from zone
        const siteConfig = await this.generateSiteFromZone(zone);

        // Upsert site
        await this.upsertSite(siteConfig);

        results.push({ zone: zone.name, success: true });
      } catch (error) {
        results.push({ zone: zone.name, success: false, error: error.message });
      }
    }

    return {
      total: zones.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  }
}
```

#### File System Service

```typescript
// lib/nginx/filesystem.ts

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FileSystemService {
  private sitesAvailablePath = '/etc/nginx/sites-available';
  private sitesEnabledPath = '/etc/nginx/sites-enabled';
  private backupPath = '/etc/nginx/backups/resolvera';

  /**
   * Write configuration file
   */
  async writeConfig(siteName: string, content: string): Promise<string> {
    const filename = `${siteName}.conf`;
    const filepath = path.join(this.sitesAvailablePath, filename);

    // Ensure directory exists
    await fs.mkdir(this.sitesAvailablePath, { recursive: true });

    // Write config with proper permissions
    await fs.writeFile(filepath, content, { mode: 0o644 });

    return filepath;
  }

  /**
   * Backup existing configuration
   */
  async backupConfig(siteName: string): Promise<string> {
    const filename = `${siteName}.conf`;
    const sourcePath = path.join(this.sitesAvailablePath, filename);

    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch {
      return null; // No file to backup
    }

    // Create backup directory
    await fs.mkdir(this.backupPath, { recursive: true });

    // Backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${siteName}.conf.${timestamp}`;
    const backupFilepath = path.join(this.backupPath, backupFilename);

    await fs.copyFile(sourcePath, backupFilepath);

    return backupFilepath;
  }

  /**
   * Rollback to previous configuration
   */
  async rollbackConfig(siteName: string): Promise<boolean> {
    // Find most recent backup
    const backupFiles = await fs.readdir(this.backupPath);
    const siteBackups = backupFiles
      .filter(f => f.startsWith(`${siteName}.conf.`))
      .sort()
      .reverse();

    if (siteBackups.length === 0) {
      throw new Error(`No backup found for ${siteName}`);
    }

    const latestBackup = siteBackups[0];
    const backupPath = path.join(this.backupPath, latestBackup);
    const targetPath = path.join(this.sitesAvailablePath, `${siteName}.conf`);

    await fs.copyFile(backupPath, targetPath);

    return true;
  }

  /**
   * Enable site (create symlink)
   */
  async enableSite(siteName: string): Promise<void> {
    const filename = `${siteName}.conf`;
    const sourcePath = path.join(this.sitesAvailablePath, filename);
    const targetPath = path.join(this.sitesEnabledPath, filename);

    // Check if already enabled
    try {
      await fs.access(targetPath);
      return; // Already enabled
    } catch {
      // Not enabled, continue
    }

    // Create symlink
    await fs.symlink(sourcePath, targetPath);
  }

  /**
   * Disable site (remove symlink)
   */
  async disableSite(siteName: string): Promise<void> {
    const filename = `${siteName}.conf`;
    const targetPath = path.join(this.sitesEnabledPath, filename);

    try {
      await fs.unlink(targetPath);
    } catch {
      // Already disabled or doesn't exist
    }
  }

  /**
   * Delete configuration file
   */
  async deleteConfig(siteName: string): Promise<void> {
    const filename = `${siteName}.conf`;
    const filepath = path.join(this.sitesAvailablePath, filename);

    await fs.unlink(filepath);
  }

  /**
   * Check if config exists
   */
  async configExists(siteName: string): Promise<boolean> {
    const filename = `${siteName}.conf`;
    const filepath = path.join(this.sitesAvailablePath, filename);

    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Nginx Control Service

```typescript
// lib/nginx/control.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ControlResult {
  success: boolean;
  output?: string;
  error?: string;
}

export class NginxControlService {
  private nginxBinary = '/usr/sbin/nginx';
  private useSudo = true; // Set based on deployment

  /**
   * Test nginx configuration
   */
  async testConfig(): Promise<ControlResult> {
    try {
      const cmd = this.useSudo
        ? `sudo ${this.nginxBinary} -t`
        : `${this.nginxBinary} -t`;

      const { stdout, stderr } = await execAsync(cmd);

      // Nginx outputs to stderr even on success
      const output = stderr || stdout;

      if (output.includes('syntax is ok') && output.includes('test is successful')) {
        return { success: true, output };
      }

      return { success: false, error: output };

    } catch (error) {
      return {
        success: false,
        error: error.stderr || error.message,
      };
    }
  }

  /**
   * Reload nginx
   */
  async reload(): Promise<ControlResult> {
    try {
      const cmd = this.useSudo
        ? `sudo ${this.nginxBinary} -s reload`
        : `${this.nginxBinary} -s reload`;

      const { stdout, stderr } = await execAsync(cmd);

      return {
        success: true,
        output: stdout || stderr,
      };

    } catch (error) {
      return {
        success: false,
        error: error.stderr || error.message,
      };
    }
  }

  /**
   * Restart nginx
   */
  async restart(): Promise<ControlResult> {
    try {
      const cmd = this.useSudo
        ? 'sudo systemctl restart nginx'
        : 'systemctl restart nginx';

      const { stdout, stderr } = await execAsync(cmd);

      return {
        success: true,
        output: stdout || stderr,
      };

    } catch (error) {
      return {
        success: false,
        error: error.stderr || error.message,
      };
    }
  }

  /**
   * Check nginx status
   */
  async status(): Promise<ControlResult & { running: boolean }> {
    try {
      const cmd = this.useSudo
        ? 'sudo systemctl is-active nginx'
        : 'systemctl is-active nginx';

      const { stdout } = await execAsync(cmd);

      const running = stdout.trim() === 'active';

      return {
        success: true,
        running,
        output: stdout,
      };

    } catch (error) {
      return {
        success: false,
        running: false,
        error: error.message,
      };
    }
  }

  /**
   * Get nginx version
   */
  async version(): Promise<string> {
    try {
      const { stdout } = await execAsync(`${this.nginxBinary} -v`);

      // Parse version from output: "nginx version: nginx/1.18.0"
      const match = stdout.match(/nginx\/([0-9.]+)/);
      return match ? match[1] : 'unknown';

    } catch (error) {
      return 'unknown';
    }
  }
}
```

---

## Security Considerations

### 1. File System Permissions

**Problem:** Resolvera needs write access to `/etc/nginx/` which requires elevated privileges.

**Solutions:**

#### Option A: Dedicated Service Account (Recommended)
```bash
# Create nginx-manager user
sudo useradd -r -s /bin/false nginx-manager

# Set ownership
sudo chown -R nginx-manager:nginx-manager /etc/nginx/sites-available
sudo chown -R nginx-manager:nginx-manager /etc/nginx/sites-enabled
sudo chown -R nginx-manager:nginx-manager /etc/nginx/ssl/resolvera

# Allow nginx-manager to reload nginx
echo "nginx-manager ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload, /bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/resolvera-nginx

# Run Resolvera as nginx-manager
sudo -u nginx-manager npm start
```

**Pros:**
- Least privilege principle
- No root access needed for Resolvera
- Specific sudo commands allowed

**Cons:**
- Complex setup
- User management overhead

#### Option B: Sudo with NOPASSWD (Simpler)
```bash
# Allow Resolvera user to run specific nginx commands
echo "resolvera ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload, /usr/sbin/nginx -s restart, /bin/systemctl reload nginx, /bin/systemctl restart nginx" | sudo tee /etc/sudoers.d/resolvera-nginx
```

**Pros:**
- Simple setup
- No dedicated user needed

**Cons:**
- Broader permissions
- Must trust Resolvera process

#### Option C: Separate Privileged Service (Most Secure)
```
┌─────────────────┐
│   Resolvera     │
│  (unprivileged) │
└────────┬────────┘
         │ HTTP API
         ▼
┌─────────────────┐
│ Nginx Config    │
│ Service (root)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Nginx Server   │
└─────────────────┘
```

Create separate systemd service:
```ini
# /etc/systemd/system/resolvera-nginx-manager.service
[Unit]
Description=Resolvera Nginx Configuration Manager
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/resolvera-nginx-manager
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Pros:**
- Separation of concerns
- Resolvera runs unprivileged
- Config service can be audited separately

**Cons:**
- Most complex
- Requires additional service

### 2. Configuration Injection Prevention

**Threat:** Malicious input could inject arbitrary nginx directives.

**Mitigations:**

1. **Template Variable Validation**
   ```typescript
   const ALLOWED_CHARS = /^[a-zA-Z0-9._-]+$/;

   function validateServerName(serverName: string): boolean {
     // Must be valid hostname
     return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(serverName);
   }

   function validateUpstreamUrl(url: string): boolean {
     try {
       const parsed = new URL(url);
       // Only allow http/https
       return ['http:', 'https:'].includes(parsed.protocol);
     } catch {
       return false;
     }
   }
   ```

2. **Escape Special Characters**
   ```typescript
   function escapeNginxString(input: string): string {
     return input.replace(/[;"'`$\\]/g, '\\$&');
   }
   ```

3. **Whitelist-based Template System**
   - Only allow predefined variables
   - No arbitrary code execution
   - Validate all inputs against schemas

4. **Configuration Syntax Validation**
   - Always run `nginx -t` before applying
   - Reject configs that fail validation
   - Rollback on any errors

### 3. SSL Certificate Security

**Threats:**
- Private key exposure
- Certificate theft
- Unauthorized certificate issuance

**Mitigations:**

1. **File Permissions**
   ```bash
   chmod 600 /etc/nginx/ssl/resolvera/*/privkey.pem
   chmod 644 /etc/nginx/ssl/resolvera/*/fullchain.pem
   chown nginx:nginx /etc/nginx/ssl/resolvera/*
   ```

2. **Private Key Encryption at Rest** (Optional)
   - Encrypt private keys with master key
   - Decrypt only when needed for Nginx

3. **Let's Encrypt Rate Limiting**
   - Cache certificate status in database
   - Avoid repeated issuance attempts
   - Implement backoff for failures

4. **Certificate Pinning** (Future)
   - Track certificate fingerprints
   - Alert on unexpected certificate changes

### 4. Audit Logging

**Requirements:**
- Log all configuration changes
- Log all nginx reloads/restarts
- Log SSL certificate operations
- Log access to sensitive operations

**Implementation:**
```typescript
await logAudit({
  action: 'NGINX_CONFIG_APPLIED',
  resource: 'nginx_site',
  resourceId: siteName,
  details: {
    configHash: sha256(configContent),
    serverNames: siteConfig.serverName,
    sslEnabled: siteConfig.sslEnabled,
  },
  userId: currentUser.id,
  severity: 'info',
});
```

### 5. Role-Based Access Control

**Permissions Model:**

| Role | Permissions |
|------|-------------|
| **Admin** | Full nginx management, all zones |
| **User** | Manage assigned zones only |
| **Viewer** | Read-only access to configs |

**Implementation:**
```typescript
// Middleware: lib/auth/nginx-permissions.ts
export async function requireNginxPermission(
  userId: string,
  action: 'read' | 'write' | 'delete',
  siteId: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user.role === 'admin') {
    return true; // Admin has all permissions
  }

  const site = await prisma.nginxSite.findUnique({
    where: { id: siteId },
    include: { zone: true },
  });

  if (!site || !site.zone) {
    return false;
  }

  // Check if user has access to this zone
  const hasZoneAccess = user.zoneIds.includes(site.zoneId);

  if (action === 'read') {
    return hasZoneAccess;
  }

  // Write/delete require admin
  return false;
}
```

### 6. Secrets Management

**Sensitive Data:**
- SSH keys for remote server management
- Let's Encrypt account keys
- Nginx SSL certificates

**Storage:**
- Use existing AES-256-GCM encryption from `lib/security/encryption.ts`
- Encrypt SSH private keys before database storage
- Never log decrypted secrets

---

## API Design

### REST API Endpoints

#### Nginx Sites

```typescript
// GET /api/nginx/sites
// List all nginx sites (filtered by user permissions)
interface ListSitesResponse {
  sites: {
    id: string;
    name: string;
    serverName: string[];
    enabled: boolean;
    sslEnabled: boolean;
    lastApplied: string;
    status: 'active' | 'error' | 'pending';
  }[];
  total: number;
}

// GET /api/nginx/sites/:id
// Get single nginx site details
interface GetSiteResponse {
  id: string;
  name: string;
  zoneId: string | null;
  serverName: string[];
  listenPorts: number[];
  rootPath: string | null;
  upstreamUrl: string | null;
  sslEnabled: boolean;
  sslCert: SSLCertificate | null;
  templateId: string | null;
  template: NginxTemplate | null;
  configContent: string;
  customConfig: string | null;
  enabled: boolean;
  autoManaged: boolean;
  lastValidated: string | null;
  lastApplied: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

// POST /api/nginx/sites
// Create new nginx site
interface CreateSiteRequest {
  name: string;
  zoneId?: string;
  serverName: string[];
  listenPorts?: number[];
  rootPath?: string;
  upstreamUrl?: string;
  upstreamServers?: { host: string; port: number; weight?: number }[];
  sslEnabled?: boolean;
  templateId?: string;
  customConfig?: string;
  enabled?: boolean;
  autoManaged?: boolean;
  options?: Record<string, any>;
}

// PUT /api/nginx/sites/:id
// Update nginx site
interface UpdateSiteRequest {
  // Same fields as CreateSiteRequest (all optional)
}

// DELETE /api/nginx/sites/:id
// Delete nginx site
interface DeleteSiteResponse {
  success: boolean;
  message: string;
}

// POST /api/nginx/sites/:id/enable
// Enable nginx site
interface EnableSiteResponse {
  success: boolean;
  message: string;
}

// POST /api/nginx/sites/:id/disable
// Disable nginx site
interface DisableSiteResponse {
  success: boolean;
  message: string;
}

// POST /api/nginx/sites/:id/validate
// Validate nginx site configuration
interface ValidateSiteResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// POST /api/nginx/sites/:id/apply
// Apply nginx site configuration to filesystem
interface ApplySiteResponse {
  success: boolean;
  message: string;
  configPath: string;
}

// GET /api/nginx/sites/:id/config
// Get generated configuration preview
interface GetConfigResponse {
  config: string;
  variables: Record<string, any>;
}
```

#### SSL Certificates

```typescript
// GET /api/nginx/ssl/certificates
// List all SSL certificates
interface ListCertificatesResponse {
  certificates: {
    id: string;
    domain: string;
    issuer: string;
    validFrom: string;
    validUntil: string;
    status: 'active' | 'expired' | 'revoked' | 'pending';
    autoRenew: boolean;
    daysUntilExpiry: number;
  }[];
  total: number;
}

// GET /api/nginx/ssl/certificates/:id
// Get certificate details
interface GetCertificateResponse {
  id: string;
  domain: string;
  certPath: string;
  keyPath: string;
  issuer: string;
  validFrom: string;
  validUntil: string;
  autoRenew: boolean;
  acmeProvider: string | null;
  status: string;
  lastRenewal: string | null;
  nextRenewal: string | null;
  nginxSite: { id: string; name: string } | null;
}

// POST /api/nginx/ssl/certificates
// Create new SSL certificate (Let's Encrypt)
interface CreateCertificateRequest {
  domain: string;
  acmeProvider: 'letsencrypt-prod' | 'letsencrypt-staging';
  acmeEmail: string;
  challengeType: 'http-01' | 'dns-01';
  autoRenew?: boolean;
}

// POST /api/nginx/ssl/certificates/upload
// Upload manual SSL certificate
interface UploadCertificateRequest {
  domain: string;
  certificate: string; // PEM format
  privateKey: string; // PEM format
  chain?: string; // Optional chain
}

// POST /api/nginx/ssl/certificates/:id/renew
// Manually renew SSL certificate
interface RenewCertificateResponse {
  success: boolean;
  message: string;
  validUntil: string;
}

// DELETE /api/nginx/ssl/certificates/:id
// Delete SSL certificate
interface DeleteCertificateResponse {
  success: boolean;
  message: string;
}
```

#### Templates

```typescript
// GET /api/nginx/templates
// List all templates
interface ListTemplatesResponse {
  templates: {
    id: string;
    name: string;
    description: string;
    type: string;
    category: string;
    version: string;
    isBuiltIn: boolean;
  }[];
}

// GET /api/nginx/templates/:id
// Get template details
interface GetTemplateResponse {
  id: string;
  name: string;
  description: string;
  config: string;
  variables: Record<string, { type: string; required: boolean; default?: any }>;
  type: string;
  category: string;
  version: string;
  isBuiltIn: boolean;
}

// POST /api/nginx/templates
// Create custom template
interface CreateTemplateRequest {
  name: string;
  description?: string;
  config: string;
  variables: Record<string, { type: string; required: boolean; default?: any }>;
  type: string;
  category?: string;
}

// PUT /api/nginx/templates/:id
// Update template (only custom templates)
interface UpdateTemplateRequest {
  // Same as CreateTemplateRequest
}

// DELETE /api/nginx/templates/:id
// Delete template (only custom templates)
interface DeleteTemplateResponse {
  success: boolean;
  message: string;
}
```

#### Nginx Control

```typescript
// POST /api/nginx/control/reload
// Reload nginx
interface ReloadResponse {
  success: boolean;
  message: string;
  output: string;
}

// POST /api/nginx/control/restart
// Restart nginx
interface RestartResponse {
  success: boolean;
  message: string;
  output: string;
}

// POST /api/nginx/control/test
// Test nginx configuration
interface TestResponse {
  valid: boolean;
  output: string;
  errors: string[];
}

// GET /api/nginx/control/status
// Get nginx status
interface StatusResponse {
  running: boolean;
  version: string;
  uptime: number;
  configTest: { valid: boolean; lastCheck: string };
}
```

#### Sync & Automation

```typescript
// POST /api/nginx/sync/all
// Sync all zones with Nginx
interface SyncAllResponse {
  total: number;
  successful: number;
  failed: number;
  details: {
    zone: string;
    success: boolean;
    error?: string;
  }[];
}

// POST /api/nginx/sync/zone/:zoneId
// Sync single zone with Nginx
interface SyncZoneResponse {
  success: boolean;
  message: string;
  siteName: string;
}

// POST /api/zones/:zoneId/nginx/enable
// Enable Nginx auto-sync for zone
interface EnableNginxForZoneRequest {
  autoSync: boolean;
  templateId: string;
}

// POST /api/zones/:zoneId/nginx/disable
// Disable Nginx for zone
interface DisableNginxForZoneResponse {
  success: boolean;
  message: string;
}
```

---

## Database Schema Changes

See [Technical Design > Database Schema Changes](#database-schema-changes) section above for complete Prisma schema.

---

## UI/UX Design

### Navigation Structure

```
Dashboard
├── DNS Management (existing)
│   ├── Zones
│   ├── Records
│   └── Watchers
├── Nginx Management (NEW)
│   ├── Sites
│   ├── SSL Certificates
│   ├── Templates
│   └── Control Panel
└── Admin
    ├── Users
    ├── Audit Logs
    └── Settings
        ├── Watcher Settings
        └── Nginx Settings (NEW)
```

### Page Designs

#### 1. Nginx Sites List (`/app/nginx/sites/page.tsx`)

**Features:**
- Table view of all nginx sites
- Filters: enabled/disabled, SSL enabled, zone
- Search by server name
- Status indicators (active, error, pending)
- Quick actions: enable/disable, view config, delete
- Bulk operations: enable all, disable all, sync all
- Create new site button

**Columns:**
- Site name
- Server names
- Zone (if linked)
- SSL status (icon)
- Enabled status (toggle)
- Last applied (timestamp)
- Status (badge)
- Actions (dropdown)

#### 2. Nginx Site Detail/Edit (`/app/nginx/sites/[id]/page.tsx`)

**Tabs:**
- **Configuration**: Form to edit site settings
- **Preview**: Live config preview with syntax highlighting
- **SSL**: SSL certificate management for this site
- **Logs**: Recent audit logs for this site
- **Status**: Site health check, last reload, errors

**Configuration Form Sections:**
- Basic Settings
  - Site name
  - Server names (array input)
  - Listen ports
  - Linked zone (dropdown)

- Backend Configuration
  - Type: Static / Reverse Proxy / Load Balancer
  - Root path (if static)
  - Upstream URL (if proxy)
  - Upstream servers (if load balancer)

- SSL Configuration
  - SSL enabled (toggle)
  - Certificate (dropdown or "Create new")
  - HTTP → HTTPS redirect

- Template
  - Select template (dropdown)
  - Template variables (dynamic form based on template)

- Advanced
  - Custom nginx directives
  - Options (JSON editor)
  - Auto-managed (toggle)

**Actions:**
- Save
- Save & Apply
- Validate
- Delete
- View Config

#### 3. Create Nginx Site (`/app/nginx/sites/new/page.tsx`)

**Wizard Steps:**

1. **Site Type**
   - Static Website
   - Reverse Proxy
   - PHP Application
   - Node.js Application
   - Load Balancer
   - Custom (advanced)

2. **Basic Configuration**
   - Site name
   - Server names
   - Link to existing zone (optional)

3. **Backend Configuration**
   - (Dynamic based on site type)

4. **SSL Configuration**
   - SSL enabled
   - Create Let's Encrypt certificate
   - Upload manual certificate
   - No SSL (HTTP only)

5. **Review & Create**
   - Configuration summary
   - Config preview
   - Create button

#### 4. SSL Certificates List (`/app/nginx/ssl/page.tsx`)

**Features:**
- Table view of all SSL certificates
- Filters: active, expiring soon (<30 days), expired
- Search by domain
- Status indicators (valid, expiring, expired)
- Expiry date column with visual indicator
- Quick actions: view, renew, delete
- Create new certificate button

**Columns:**
- Domain
- Issuer
- Valid from
- Valid until (with "expires in X days")
- Status (badge)
- Auto-renew (toggle)
- Used by (site name)
- Actions

**Dashboard Widget:**
- "Certificates expiring soon" widget on main dashboard
- Shows count and list of certs expiring in <30 days

#### 5. SSL Certificate Detail (`/app/nginx/ssl/[id]/page.tsx`)

**Sections:**
- **Certificate Information**
  - Domain
  - Issuer
  - Valid from / until
  - Days until expiry (with progress bar)
  - Status

- **Configuration**
  - Auto-renew toggle
  - ACME provider (if Let's Encrypt)
  - Challenge type
  - Renewal schedule

- **Files**
  - Certificate path
  - Private key path
  - Chain path

- **Usage**
  - Sites using this certificate

- **Renewal History**
  - Last renewal
  - Next renewal
  - Renewal attempts
  - Errors (if any)

**Actions:**
- Renew now
- Download certificate
- Download private key
- Delete

#### 6. Create SSL Certificate (`/app/nginx/ssl/new/page.tsx`)

**Options:**

1. **Let's Encrypt (Automatic)**
   - Domain name
   - Email for notifications
   - Challenge type (HTTP-01 / DNS-01)
   - Environment (Production / Staging)
   - Auto-renew enabled by default

2. **Upload Manual Certificate**
   - Domain name
   - Certificate file upload (PEM)
   - Private key file upload (PEM)
   - Chain file upload (optional)

#### 7. Templates Library (`/app/nginx/templates/page.tsx`)

**Layout:**
- Card grid view
- Categories: Basic, Advanced, Enterprise
- Filters: type, category, built-in/custom
- Search by name/description

**Template Card:**
- Template name
- Description
- Type badge
- Built-in / Custom badge
- Version
- "Use Template" button
- Edit (custom only)
- Delete (custom only)

#### 8. Template Detail/Edit (`/app/nginx/templates/[id]/page.tsx`)

**Sections:**
- **Metadata**
  - Name
  - Description
  - Type
  - Category
  - Version

- **Configuration**
  - Config content (code editor with nginx syntax highlighting)
  - Variables definition (JSON editor or form builder)

- **Preview**
  - Sample configuration with example values

- **Sites Using This Template**
  - List of sites

**Actions:**
- Save (custom only)
- Duplicate
- Delete (custom only)
- Export (download as file)

#### 9. Nginx Control Panel (`/app/nginx/control/page.tsx`)

**Sections:**

- **Status**
  - Nginx running (yes/no)
  - Version
  - Uptime
  - Last reload
  - Configuration valid (yes/no)

- **Quick Actions**
  - Test Configuration
  - Reload Nginx
  - Restart Nginx
  - Sync All Zones

- **Statistics** (if nginx stub_status module enabled)
  - Active connections
  - Accepts / Handled / Requests
  - Reading / Writing / Waiting

- **Recent Activity**
  - Recent nginx-related audit logs

#### 10. Nginx Settings (`/app/admin/settings/nginx/page.tsx`)

**Settings:**

- **File Paths**
  - Nginx binary path
  - Config directory
  - Sites available path
  - Sites enabled path
  - SSL directory
  - Backup directory

- **Permissions**
  - Use sudo (toggle)
  - Sudo user

- **Automation**
  - Auto-sync enabled (global toggle)
  - Auto-apply DNS changes
  - Auto-provision SSL
  - SSL renewal days before expiry

- **Notifications**
  - Notify on nginx reload failures
  - Notify on SSL certificate expiry
  - Notify on SSL renewal

- **Advanced**
  - Config validation timeout
  - Backup retention days
  - Max backup files per site

---

## Testing Strategy

### Unit Tests

**Target Coverage:** 80%+

**Focus Areas:**
1. Configuration generation (`lib/nginx/config-generator.ts`)
   - Template rendering with various inputs
   - Variable interpolation
   - Edge cases (missing variables, invalid values)

2. Configuration validation (`lib/nginx/validator.ts`)
   - Syntax validation
   - Semantic validation
   - Error message accuracy

3. File system operations (`lib/nginx/filesystem.ts`)
   - Mock file system with `memfs`
   - Test backup, rollback, enable, disable
   - Error handling

4. Nginx control (`lib/nginx/control.ts`)
   - Mock child_process.exec
   - Test command generation
   - Parse output correctly

### Integration Tests

**Tools:** Playwright for E2E, Vitest for API testing

**Test Scenarios:**

1. **Full Site Lifecycle**
   ```typescript
   test('create, apply, enable, disable, delete nginx site', async () => {
     // Create site
     const site = await createNginxSite({ name: 'test.example.com', ... });
     expect(site.id).toBeDefined();

     // Apply config
     const applied = await applySiteConfig(site.id);
     expect(applied.success).toBe(true);

     // Verify file created
     const configExists = await fs.access(`/etc/nginx/sites-available/${site.name}.conf`);
     expect(configExists).toBe(true);

     // Enable site
     await enableSite(site.id);
     const symlinkExists = await fs.access(`/etc/nginx/sites-enabled/${site.name}.conf`);
     expect(symlinkExists).toBe(true);

     // Disable site
     await disableSite(site.id);
     const symlinkGone = await fs.access(`/etc/nginx/sites-enabled/${site.name}.conf`).catch(() => false);
     expect(symlinkGone).toBe(false);

     // Delete site
     await deleteSite(site.id);
     const configGone = await fs.access(`/etc/nginx/sites-available/${site.name}.conf`).catch(() => false);
     expect(configGone).toBe(false);
   });
   ```

2. **SSL Certificate Provisioning**
   ```typescript
   test('provision Let\'s Encrypt certificate', async () => {
     // Create site with SSL
     const site = await createNginxSite({
       name: 'secure.example.com',
       serverName: ['secure.example.com'],
       sslEnabled: true,
     });

     // Request certificate
     const cert = await provisionSSLCertificate({
       domain: 'secure.example.com',
       acmeProvider: 'letsencrypt-staging', // Use staging for tests
       acmeEmail: 'test@example.com',
       challengeType: 'http-01',
     });

     expect(cert.status).toBe('active');
     expect(cert.certPath).toBeDefined();
     expect(cert.validUntil).toBeGreaterThan(new Date());
   });
   ```

3. **Automatic DNS → Nginx Sync**
   ```typescript
   test('creating DNS record auto-creates nginx site', async () => {
     // Enable nginx auto-sync for zone
     await updateZone(zoneId, {
       nginxEnabled: true,
       nginxAutoSync: true,
       nginxTemplateId: reverseProxyTemplateId,
     });

     // Create DNS A record
     const record = await createDNSRecord({
       zoneId,
       type: 'A',
       name: 'auto.example.com',
       content: '192.0.2.1',
     });

     // Verify nginx site created
     const site = await getNginxSiteByName('auto.example.com');
     expect(site).toBeDefined();
     expect(site.zoneId).toBe(zoneId);
     expect(site.autoManaged).toBe(true);
   });
   ```

4. **Rollback on Failure**
   ```typescript
   test('rollback to previous config on nginx reload failure', async () => {
     // Create valid site
     const site = await createNginxSite({ /* valid config */ });
     await applySiteConfig(site.id);

     // Get original config
     const originalConfig = await fs.readFile(`/etc/nginx/sites-available/${site.name}.conf`, 'utf-8');

     // Update with invalid config
     try {
       await updateNginxSite(site.id, {
         customConfig: 'invalid nginx syntax here;',
       });
       await applySiteConfig(site.id);

       fail('Should have thrown error');
     } catch (error) {
       expect(error.message).toContain('Config test failed');
     }

     // Verify original config restored
     const currentConfig = await fs.readFile(`/etc/nginx/sites-available/${site.name}.conf`, 'utf-8');
     expect(currentConfig).toBe(originalConfig);
   });
   ```

### Manual Testing Checklist

- [ ] Create static site, verify file serving works
- [ ] Create reverse proxy, verify backend requests work
- [ ] Create load balancer with 3 backends, verify round-robin distribution
- [ ] Provision Let's Encrypt SSL, verify HTTPS works
- [ ] Upload manual SSL certificate, verify HTTPS works
- [ ] Test auto-renewal of certificate (mock expiry date)
- [ ] Enable nginx for zone, create DNS record, verify auto-site creation
- [ ] Delete DNS record, verify auto-site deletion
- [ ] Test rollback after invalid config
- [ ] Test nginx reload failure handling
- [ ] Test permissions (user vs admin access)
- [ ] Test bulk sync of all zones
- [ ] Verify audit logs for all operations

### Performance Testing

**Load Tests:**
- Create 100 nginx sites in parallel
- Sync 50 zones simultaneously
- Provision 10 SSL certificates concurrently
- Monitor database query performance
- Monitor file system I/O

**Benchmarks:**
- Site creation time: <5 seconds
- Config generation time: <500ms
- Nginx reload time: <2 seconds
- SSL provisioning time: <60 seconds

---

## Deployment Strategy

### Development Environment

```bash
# Setup development Nginx
sudo apt install nginx
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo mkdir -p /etc/nginx/ssl/resolvera
sudo mkdir -p /etc/nginx/backups/resolvera

# Configure sudo permissions
echo "$USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload" | sudo tee /etc/sudoers.d/resolvera-nginx

# Run migrations
npx prisma migrate dev --name add_nginx_models

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### Staging Environment

```bash
# Same as development, plus:
# - Use Let's Encrypt staging for SSL tests
# - Test on real-world DNS configurations
# - Verify auto-sync workflows
# - Test multi-user access scenarios
```

### Production Deployment

**Docker Compose Update:**

```yaml
# docker-compose.yml
services:
  resolvera:
    # ... existing config ...
    volumes:
      - ./data:/app/data
      - /etc/nginx:/etc/nginx  # NEW: Mount nginx config directory
      - /var/run/docker.sock:/var/run/docker.sock  # NEW: For restarting nginx (if dockerized)
    environment:
      - NGINX_MANAGEMENT_ENABLED=true
      - NGINX_CONFIG_PATH=/etc/nginx
      - NGINX_USE_SUDO=true
    cap_add:  # NEW: Required capabilities
      - SYS_ADMIN  # For executing nginx commands

  nginx:  # Optional: Nginx in separate container
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/nginx:/etc/nginx:ro  # Read-only from host
    depends_on:
      - resolvera
    restart: unless-stopped
```

**Migration Path:**

1. **Phase 1: Deploy with Nginx management disabled**
   ```bash
   docker compose pull
   docker compose up -d
   npx prisma migrate deploy
   ```

2. **Phase 2: Configure permissions**
   ```bash
   # Setup nginx directories
   sudo mkdir -p /etc/nginx/{sites-available,sites-enabled,ssl/resolvera,backups/resolvera}

   # Set permissions
   sudo chown -R 1000:1000 /etc/nginx/sites-{available,enabled} /etc/nginx/ssl/resolvera

   # Configure sudo
   echo "resolvera ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload" | sudo tee /etc/sudoers.d/resolvera-nginx
   ```

3. **Phase 3: Enable Nginx management**
   ```bash
   # Update .env
   echo "NGINX_MANAGEMENT_ENABLED=true" >> .env

   # Restart
   docker compose restart resolvera
   ```

4. **Phase 4: Migrate existing sites**
   - Manually import existing nginx configs via UI
   - Or use bulk import script
   - Enable auto-sync for zones

**Rollback Plan:**

If issues occur, disable nginx management:
```bash
# Disable in .env
NGINX_MANAGEMENT_ENABLED=false

# Restart
docker compose restart resolvera

# All existing nginx configs remain untouched
```

---

## Risks & Mitigation

### Risk 1: Nginx Configuration Errors Breaking Production

**Severity:** Critical
**Likelihood:** Medium

**Mitigation:**
- Always run `nginx -t` before applying changes
- Implement automatic rollback on validation failure
- Maintain backups of all configs with timestamps
- Test configurations in staging environment first
- Implement dry-run mode for previewing changes
- Add emergency "restore previous config" button in UI

### Risk 2: File System Permission Issues

**Severity:** High
**Likelihood:** High

**Mitigation:**
- Comprehensive setup documentation
- Automated setup script to configure permissions
- Clear error messages when permission denied
- Fallback to manual mode if automated management fails
- Health check endpoint to verify permissions
- Startup validation of file system access

### Risk 3: Let's Encrypt Rate Limiting

**Severity:** Medium
**Likelihood:** Medium

**Rate Limits:**
- 50 certificates per registered domain per week
- 5 duplicate certificates per week
- 300 new orders per account per 3 hours

**Mitigation:**
- Cache certificate status in database
- Implement exponential backoff for failures
- Use staging environment for testing
- Track rate limit usage per domain
- Warn users before hitting limits
- Support manual certificate upload as fallback

### Risk 4: Race Conditions in Automation

**Severity:** Medium
**Likelihood:** Low

**Scenario:** Multiple DNS records created simultaneously triggering concurrent nginx reloads.

**Mitigation:**
- Implement queue system for nginx operations
- Lock mechanism for config generation
- Debounce rapid changes (wait 5 seconds before applying)
- Transaction-based database updates
- Idempotent operations

### Risk 5: Breaking Existing Manual Nginx Configurations

**Severity:** High
**Likelihood:** Medium

**Mitigation:**
- Never modify files not created by Resolvera
- Use dedicated directory structure (e.g., `/etc/nginx/sites-available/resolvera/`)
- Import wizard to bring existing configs under management
- Opt-in approach (disabled by default per zone)
- Clear documentation on migration path

### Risk 6: SSL Certificate Renewal Failures

**Severity:** Critical
**Likelihood:** Low

**Mitigation:**
- Multiple renewal attempts (7 days, 3 days, 1 day before expiry)
- Immediate notifications on renewal failures
- Fallback to longer expiry warnings
- Manual renewal option in UI
- Monitor certificate expiry dates continuously
- Alert 30/14/7/1 days before expiry

### Risk 7: Security Vulnerabilities in Configuration Injection

**Severity:** Critical
**Likelihood:** Low

**Mitigation:**
- Strict input validation (see Security Considerations)
- Template-based configuration only (no arbitrary code)
- Escape all user inputs
- Syntax validation before applying
- Regular security audits
- Penetration testing

### Risk 8: Performance Impact on Resolvera

**Severity:** Low
**Likelihood:** Medium

**Concerns:** Nginx management could slow down existing DNS operations.

**Mitigation:**
- Async processing for nginx operations
- Background jobs for bulk operations
- Separate database connection pool
- Monitor performance metrics
- Optimize database queries (proper indexing)
- Cache frequently accessed data

### Risk 9: Complexity Overwhelming Users

**Severity:** Medium
**Likelihood:** Medium

**Mitigation:**
- Intuitive wizard-based workflows
- Pre-built templates for common use cases
- Comprehensive documentation
- Video tutorials
- Sensible defaults (80% of users shouldn't need advanced features)
- Progressive disclosure (hide advanced options by default)

### Risk 10: Vendor Lock-in to Cloudflare

**Severity:** Low
**Likelihood:** High

**Current State:** Resolvera only supports Cloudflare DNS.

**Future Mitigation:**
- Abstract DNS provider interface
- Support additional providers (Route53, DigitalOcean, etc.)
- Nginx management works independently of DNS provider
- Export/import configurations

---

## Future Enhancements

### Phase 7+: Advanced Features

1. **Multi-Provider DNS Support**
   - AWS Route53
   - DigitalOcean DNS
   - Google Cloud DNS
   - Cloudflare (existing)

2. **Alternative Reverse Proxies**
   - Traefik integration
   - Caddy integration
   - HAProxy integration
   - Kong gateway

3. **Web Application Firewall (WAF)**
   - ModSecurity integration
   - OWASP Core Rule Set
   - Custom rule management
   - Attack blocking dashboard

4. **Advanced Load Balancing**
   - Geographic routing
   - Weighted load balancing
   - Session persistence strategies
   - Health check customization
   - Circuit breaker pattern

5. **Edge Caching & CDN**
   - Integrate with Cloudflare cache
   - Nginx proxy_cache management
   - Cache purging API
   - Cache analytics

6. **Monitoring & Analytics**
   - Real-time traffic analytics
   - Error rate tracking
   - Response time monitoring
   - Geographic request distribution
   - Integration with Prometheus/Grafana

7. **Kubernetes Integration**
   - Ingress controller management
   - Service mesh integration
   - Auto-scaling based on traffic
   - Multi-cluster support

8. **API Gateway Features**
   - Rate limiting per API key
   - Authentication middleware
   - Request transformation
   - Response caching
   - API versioning

9. **Compliance & Security**
   - PCI-DSS compliance reports
   - GDPR data locality rules
   - Security posture dashboard
   - Vulnerability scanning
   - Certificate transparency monitoring

10. **Disaster Recovery**
    - Multi-region failover
    - Automated backup verification
    - One-click restore
    - Configuration versioning with Git
    - Blue-green deployments

11. **AI-Powered Features**
    - Intelligent traffic routing based on ML
    - Anomaly detection for DDoS
    - Auto-optimization of cache rules
    - Predictive scaling

12. **Third-Party Integrations**
    - Slack notifications
    - PagerDuty alerts
    - Datadog monitoring
    - GitHub Actions for GitOps
    - Terraform provider

---

## Success Metrics

### Key Performance Indicators (KPIs)

**Adoption Metrics:**
- Number of nginx sites managed
- Percentage of zones with nginx enabled
- Number of SSL certificates provisioned
- Time saved vs manual configuration (estimated)

**Reliability Metrics:**
- Nginx reload success rate (target: >99%)
- SSL renewal success rate (target: >99.5%)
- Configuration validation success rate
- Average time to resolve errors

**Performance Metrics:**
- Average site creation time
- Average config generation time
- Average SSL provisioning time
- API response times (p50, p95, p99)

**User Satisfaction:**
- Feature adoption rate
- User-reported issues
- Documentation clarity feedback
- Support ticket volume

### Launch Criteria

**Phase 1 Launch (Basic Management):**
- [ ] All unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Manual testing checklist complete
- [ ] Documentation complete
- [ ] Security review passed
- [ ] Performance benchmarks met
- [ ] At least 5 production-ready templates
- [ ] Rollback mechanism tested and working
- [ ] Audit logging complete

**Phase 4 Launch (SSL Management):**
- [ ] All Phase 1 criteria met
- [ ] Let's Encrypt integration tested (staging + production)
- [ ] Certificate renewal automated and tested
- [ ] Expiry monitoring working
- [ ] Notifications configured
- [ ] Manual certificate upload tested
- [ ] Documentation updated

**General Availability:**
- [ ] All phases 1-4 complete
- [ ] Beta testing with 10+ real users
- [ ] No critical bugs
- [ ] Performance under load verified
- [ ] Security audit passed
- [ ] Documentation reviewed by technical writer
- [ ] Video tutorials published
- [ ] Support process established

---

## Timeline Estimate

### Conservative Estimate (Single Developer)

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|--------------|
| Phase 1 | Foundation | 2 weeks | None |
| Phase 2 | Templates & Validation | 2 weeks | Phase 1 |
| Phase 3 | Automation & Integration | 2 weeks | Phase 2 |
| Phase 4 | SSL Management | 2 weeks | Phase 3 |
| Phase 5 | Monitoring & Advanced | 2 weeks | Phase 4 |
| Phase 6 | Multi-Server & Enterprise | 2 weeks | Phase 5 |
| **Total** | | **12 weeks** | |

**Add Buffer:** 20% for unexpected issues = **14-15 weeks**

### Aggressive Estimate (Team of 2-3 Developers)

| Phase | Description | Duration | Parallelization |
|-------|-------------|----------|-----------------|
| Phase 1 | Foundation | 1 week | Core team |
| Phase 2 | Templates & Validation | 1 week | Dev 1: Templates, Dev 2: Validation |
| Phase 3 | Automation & Integration | 1.5 weeks | Dev 1: DNS integration, Dev 2: UI |
| Phase 4 | SSL Management | 1.5 weeks | Dev 1: ACME client, Dev 2: Renewal system |
| Phase 5 | Monitoring & Advanced | 2 weeks | Dev 1: Monitoring, Dev 2: Advanced features |
| Phase 6 | Multi-Server & Enterprise | 2 weeks | Full team |
| **Total** | | **9 weeks** | |

**Add Buffer:** 20% = **10-11 weeks**

### Minimum Viable Product (MVP)

**Scope:** Phase 1 + Phase 2 + Basic SSL (manual upload only)

**Timeline:** 4-5 weeks

**Features:**
- Create/edit/delete nginx sites
- Template-based config generation
- Config validation and rollback
- Manual SSL certificate upload
- Basic UI

---

## References & Resources

### Documentation

1. **Nginx Official Docs**
   - https://nginx.org/en/docs/
   - https://nginx.org/en/docs/http/ngx_http_core_module.html
   - https://nginx.org/en/docs/http/ngx_http_ssl_module.html

2. **Let's Encrypt / ACME**
   - https://letsencrypt.org/docs/
   - https://datatracker.ietf.org/doc/html/rfc8555 (ACME Protocol)
   - https://github.com/acmesh-official/acme.sh (ACME client library)

3. **Next.js**
   - https://nextjs.org/docs

4. **Prisma**
   - https://www.prisma.io/docs/

### Libraries to Consider

1. **ACME Client:**
   - `acme-client` (Node.js ACME client)
   - `acme.sh` (Shell script, could invoke via child_process)
   - `node-acme` (Lightweight alternative)

2. **Configuration Templating:**
   - `handlebars` (template engine, already familiar syntax)
   - `ejs` (embedded JavaScript)
   - Custom template parser (full control)

3. **Nginx Configuration Parsing:**
   - `nginx-conf` (parse existing nginx configs)
   - Custom parser using regex/AST

4. **File System Monitoring:**
   - `chokidar` (watch for external config changes)

5. **Background Jobs:**
   - `node-cron` (already used for IP watcher)
   - Extend existing watcher system

### Competitive Analysis

**Similar Tools:**
- **Cloudflare Dashboard** - DNS + basic proxy settings, no nginx
- **cPanel / Plesk** - Full hosting panel with nginx, but complex and expensive
- **RunCloud** - Server management focused on PHP hosting
- **ServerPilot** - WordPress-focused server management
- **Forge / Envoyer (Laravel)** - PHP deployment tools with nginx
- **Dokku** - Mini-Heroku with nginx, Docker-focused
- **CapRover** - PaaS with nginx, container-focused

**Differentiators:**
- Focus on DNS + Nginx integration
- Cloudflare-native (use CF API for DNS-01 challenges)
- Open-source and self-hosted
- Lightweight (no full control panel bloat)
- Modern stack (Next.js, React 19, Prisma)
- Developer-friendly (API-first design)

---

## Conclusion

This document outlines a comprehensive plan to extend Resolvera from a DNS management tool into a unified DNS + web server management platform. The phased approach allows for incremental development and deployment, with clear milestones and success criteria.

**Next Steps:**

1. **Review & Approval**
   - Share with stakeholders
   - Gather feedback
   - Refine scope if needed

2. **Technical Spike** (1 week)
   - Prototype config generation
   - Test file system permissions
   - Evaluate ACME client libraries
   - Validate nginx control mechanisms

3. **Phase 1 Development** (2 weeks)
   - Implement database schema
   - Build core services
   - Create basic UI
   - Write tests

4. **Iterate** through remaining phases

**Questions to Answer:**

1. Should nginx management be a separate product or integrated into Resolvera?
2. What's the target audience? (Self-hosters, agencies, SaaS platforms?)
3. What's the monetization strategy? (Open-source + support? SaaS offering?)
4. Should we support other reverse proxies from the start?
5. What's the priority: depth (nginx features) or breadth (multiple proxies)?

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-01
**Author:** Claude
**Status:** Draft / Planning Phase
