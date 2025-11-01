# Resolvera

**Modern Self-Hosted DNS Manager for Cloudflare**

Resolvera is a powerful, self-hosted DNS management dashboard that simplifies managing multiple Cloudflare zones from a single, intuitive interface. Built with Next.js 16, React 19, and featuring comprehensive security, automated IP monitoring, searchable audit logs, and webhook notifications.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Status](https://img.shields.io/badge/status-stable-green.svg)

---

## ✨ Why Resolvera?

- **🚀 All-in-One Dashboard**: Manage unlimited Cloudflare zones from a single interface
- **🤖 Automated IP Monitoring**: Background watcher with auto-DNS updates for dynamic IPs
- **🔍 Searchable Audit Logs**: Track every change with keyword and date range filtering
- **🔔 Smart Notifications**: Discord webhooks for DNS changes and IP updates
- **👥 Multi-User Ready**: Role-based access with admin and user roles
- **🔒 Security First**: bcrypt passwords, AES-256 API tokens, comprehensive audit trail
- **🎨 Modern UI**: Clean design with dark mode and mobile support
- **⚡ Production Ready**: PostgreSQL backend, optimized caching, proper error handling

---

## 📋 Quick Start

### 🐳 Docker (Recommended)

**Get started in under 2 minutes:**

```bash
# 1. Clone repository
git clone https://gitea.stull-group.com/iceflier/resolvera.git
cd resolvera

# 2. Configure environment
cp .env.example .env
# Edit .env and set all required secrets
# Generate secrets: openssl rand -base64 32  (JWT_SECRET)
#                  openssl rand -hex 16      (ENCRYPTION_KEY, PASSWORD_HASH_SECRET, ZONE_API_HASH_SECRET)

# 3. Start with Docker Compose
docker compose up -d

# 4. Access at http://localhost:3000
# 5. Create admin at http://localhost:3000/setup
```

**Image**: `icyicefsdev/resolvera:latest` (pre-built from Docker Hub)

**[📖 Full Docker Guide](.docker/README.md)** | **[🚀 Quick Start Guide](documents/docker/QUICKSTART.md)**

---

### 💻 Manual Installation

**Prerequisites:**
- **Node.js** 20.x or higher
- **PostgreSQL** 16 or higher
- **Cloudflare Account** with API access

**Installation (5 minutes):**

```bash
# 1. Clone and install
git clone https://gitea.stull-group.com/iceflier/resolvera.git
cd resolvera
npm install

# 2. Setup database
sudo -u postgres psql -c "CREATE DATABASE resolvera;"
sudo -u postgres psql -c "CREATE USER resolvera WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE resolvera TO resolvera;"

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings (see configuration section)

# 4. Generate secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -hex 16     # ENCRYPTION_KEY
openssl rand -hex 16     # PASSWORD_HASH_SECRET
openssl rand -hex 16     # ZONE_API_HASH_SECRET

# 5. Run migrations and start
npx prisma migrate deploy
npm run build
npm run start

# 6. Setup admin account
# Navigate to http://localhost:3000/setup
```

**Configuration** (`.env`):
```env
DATABASE_URL=postgresql://resolvera:your-password@localhost:5432/resolvera
JWT_SECRET=your-generated-jwt-secret-minimum-32-characters
ENCRYPTION_KEY=your-generated-32-character-encryption-key
PASSWORD_HASH_SECRET=your-generated-32-character-key
ZONE_API_HASH_SECRET=your-generated-32-character-key
NEXT_PUBLIC_URL=http://localhost:3000
NODE_ENV=production
```

---

## 🎯 Core Features

### 🌐 Multi-Zone DNS Management
- Manage unlimited Cloudflare zones from one dashboard
- Support for all DNS record types (A, AAAA, CNAME, MX, TXT, etc.)
- Real-time synchronization with Cloudflare
- Zone assignment to specific users

### 👁️ Automated IP Watcher
- **Background Monitoring**: Cron scheduler checks IPs every 1-1440 minutes
- **Auto-Update**: Automatically update DNS when IP changes
- **Status Tracking**: Real-time status (OK, Mismatch, Error)
- **Dual Stack**: Monitor both IPv4 (A) and IPv6 (AAAA) records
- **Manual Triggers**: Admin can force immediate checks
- **Startup Checks**: Automatic verification on server restart

[📖 Complete Watcher Guide](documents/WATCHER_SYSTEM.md)

### 📊 Searchable Audit Logs
- **Comprehensive Tracking**: Every security-relevant operation logged
- **Keyword Search**: Search across actions, resources, IPs, user agents
- **Date Filtering**: Filter by custom date ranges with timezone support
- **Auto-Refresh**: Real-time updates with configurable intervals (5s-60s)
- **Smart Logging**: Only logs status changes (reduces noise)
- **User Attribution**: Automatic user name resolution

[📖 Complete Audit Guide](documents/AUDIT_LOGGING.md)

### 🔔 Webhook Notifications
- **Discord Integration**: Rich embeds with color-coded severity
- **Event-Based**: Configure triggers for each event type
- **DNS Events**: Record add/edit/delete notifications
- **IP Updates**: Manual mismatch alerts and auto-update confirmations
- **User Tracking**: Shows who performed each action
- **Retry Logic**: Automatic retry on temporary failures

[📖 Complete Notifications Guide](documents/NOTIFICATIONS.md)

### 👥 User Management
- **Role-Based Access**: Admin and User roles
- **Zone Assignment**: Assign specific zones to users
- **Permission Control**: Users see only assigned zones
- **Audit Trail**: Track user actions in audit logs
- **Password Security**: bcrypt hashing with salt

### 🔒 Security Features
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcrypt (10 rounds + salt)
- **API Token Encryption**: AES-256-GCM for Cloudflare tokens
- **Input Validation**: Zod schemas on all inputs
- **Audit Trail**: Comprehensive activity logging
- **Access Control**: Role-based permissions (RBAC)

---

## 📚 Documentation

### Core Documentation
- **[API Reference](API.md)** - Complete REST API documentation
- **[Architecture Guide](ARCHITECTURE.md)** - System design and structure
- **[Development Guide](DEVELOPMENT.md)** - Setup and development workflow
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Changelog](CHANGELOG.md)** - Version history

### Features
- **[Complete Features Guide](documents/FEATURES.md)** - All features explained
- **[Watcher System](documents/WATCHER_SYSTEM.md)** - Automated IP monitoring
- **[Audit Logging](documents/AUDIT_LOGGING.md)** - Activity tracking and search
- **[Notifications](documents/NOTIFICATIONS.md)** - Webhook integration

### Deployment
- **[Docker Guide](.docker/README.md)** - Full Docker setup guide
- **[Docker Quick Start](.docker/QUICKSTART.md)** - Get running in 5 minutes

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.0.1 (App Router) |
| **UI Library** | React 19.2.0 |
| **Styling** | Tailwind CSS v4 |
| **Language** | TypeScript 5.x |
| **Database** | PostgreSQL 16 + Prisma ORM 6.18.0 |
| **Authentication** | JWT (jose) + HTTP-only cookies |
| **Validation** | Zod schemas v4 |
| **Encryption** | Node.js crypto (AES-256-GCM) |
| **Password Hashing** | bcrypt (10 rounds) |
| **Scheduling** | node-cron |
| **API** | Cloudflare REST API v4 |

---

## 🚀 What's New in v1.0.0

**Major Features**:
- ✅ PostgreSQL database with Prisma ORM
- ✅ Automated background IP watcher with cron scheduling
- ✅ Searchable and filterable audit logs
- ✅ Discord webhook notifications
- ✅ Role-based access control (Admin & User)
- ✅ Zone assignment for users
- ✅ Cache management system
- ✅ Comprehensive security hardening
- ✅ Complete documentation

**Performance**:
- Optimized database queries with indexes
- Efficient audit logging (status change detection)
- In-memory caching for API responses
- Pagination for large datasets

**Developer Experience**:
- Full TypeScript support
- Comprehensive error handling
- API documentation
- Troubleshooting guides

---

## 📈 Roadmap

### v1.1.0 - Docker Containerization (Q1 2025)
- Complete Docker setup
- Docker Compose configuration
- Multi-stage builds
- Automated backups

### v1.2.0 - Enhanced Notifications (Q2 2025)
- Email notifications (SMTP)
- Slack webhooks
- Telegram bot integration
- Custom webhook templates

### v1.3.0 - Advanced Security (Q3 2025)
- Two-factor authentication (TOTP)
- API key management
- Enhanced session management
- Security policy configuration

### v1.4.0 - Power Features (Q4 2025)
- Bulk DNS operations
- Import/Export configurations
- DNS record templates
- Historical data analytics

### v2.0.0 - Nginx Integration (2026)
- Automated reverse proxy configuration
- SSL/TLS certificate management
- Load balancer support
- Configuration validation

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

- Code of conduct: Be respectful and constructive
- Development setup: Fork the repository and create feature branches
- Coding standards: Follow TypeScript and ESLint conventions
- Pull request process: Submit PRs with clear descriptions
- Testing: Test your changes thoroughly before submitting

---

## 🔐 Security

Security is our top priority. We implement:

- JWT authentication with secure sessions
- bcrypt password hashing (10 rounds + salt)
- AES-256-GCM encryption for API tokens
- Zod-based input validation
- Comprehensive audit logging
- Role-based access control
- IP normalization and tracking

**Reporting Security Issues**: If you discover a vulnerability, please contact maintainers directly. Do not open public issues for security concerns.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

**Technology**:
- [Next.js](https://nextjs.org/) - React Framework
- [React](https://react.dev/) - UI Library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Prisma](https://www.prisma.io/) - ORM
- [PostgreSQL](https://www.postgresql.org/) - Database

**Services**:
- [Cloudflare](https://www.cloudflare.com/) - DNS Provider
- [Discord](https://discord.com/) - Webhooks

---

## 💬 Support

- **Documentation**: [/documents](documents/)
- **Repository**: [Gitea](https://gitea.stull-group.com/iceflier/resolvera)
- **Cloudflare API**: [Docs](https://developers.cloudflare.com/api)

---

## 🎯 Production Ready

Resolvera v1.0.0 is production-ready for self-hosted deployments with:

- ✅ Stable core features
- ✅ Comprehensive security
- ✅ Full documentation
- ✅ Error handling and logging
- ✅ Performance optimizations
- ✅ Database migrations
- ✅ Docker support with Docker Compose

---

**Built with care using Next.js 16, React 19, and modern web technologies.**

*Resolvera - Simplifying DNS management, one zone at a time.*

---

<div align="center">

**[⬆ back to top](#resolvera)**

</div>
