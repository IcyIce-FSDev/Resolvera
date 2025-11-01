# Troubleshooting Guide

Common issues and solutions for Resolvera DNS Manager.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Problems](#database-problems)
- [Authentication Issues](#authentication-issues)
- [DNS Record Issues](#dns-record-issues)
- [Watcher Problems](#watcher-problems)
- [Notification Issues](#notification-issues)
- [Docker Issues](#docker-issues)
- [Performance Problems](#performance-problems)
- [Build Errors](#build-errors)

---

## Installation Issues

### npm install fails

**Problem:** Dependency installation errors

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If using older Node.js version
nvm install 20
nvm use 20
npm install
```

### Prisma migration fails

**Problem:** `Error: P1001: Can't reach database server`

**Solutions:**
```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Verify DATABASE_URL in .env
# Should be: postgresql://user:password@localhost:5432/resolvera

# 3. Test database connection
psql -U resolvera -d resolvera -h localhost

# 4. Check PostgreSQL accepts connections
sudo nano /etc/postgresql/16/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'

sudo nano /etc/postgresql/16/main/pg_hba.conf
# Ensure: local all resolvera md5

# 5. Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Database Problems

### Cannot connect to database

**Problem:** `ECONNREFUSED` or connection timeout

**Diagnosis:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check listening ports
sudo ss -tlnp | grep 5432

# Test connection
psql -U resolvera -d resolvera -h localhost -W
```

**Solutions:**

1. **PostgreSQL not running:**
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Wrong credentials:**
   ```bash
   # Reset password
   sudo -u postgres psql
   ALTER USER resolvera WITH PASSWORD 'new-password';
   \q

   # Update .env
   DATABASE_URL=postgresql://resolvera:new-password@localhost:5432/resolvera
   ```

3. **Database doesn't exist:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE resolvera;
   GRANT ALL PRIVILEGES ON DATABASE resolvera TO resolvera;
   \q
   ```

### Migration errors

**Problem:** `Migration failed to apply`

**Solutions:**
```bash
# 1. Check migration status
npx prisma migrate status

# 2. Reset database (⚠️  DESTROYS ALL DATA)
npx prisma migrate reset

# 3. Apply migrations manually
npx prisma migrate deploy

# 4. If schema is out of sync
npx prisma db push --skip-generate
npx prisma generate
```

### Slow database queries

**Problem:** Pages loading slowly

**Solutions:**
```sql
-- 1. Check database indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- 2. Analyze query performance
EXPLAIN ANALYZE SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 100;

-- 3. Rebuild indexes
REINDEX TABLE "AuditLog";

-- 4. Vacuum database
VACUUM ANALYZE;
```

---

## Authentication Issues

### Cannot log in

**Problem:** Login fails with valid credentials

**Diagnosis:**
1. Check browser console for errors
2. Check server logs for JWT errors
3. Verify JWT_SECRET is set

**Solutions:**

1. **JWT_SECRET not set or too short:**
   ```bash
   # Generate new secret (min 32 characters)
   openssl rand -base64 32

   # Update .env
   JWT_SECRET=your-generated-secret-here

   # Restart server
   npm run build && npm run start
   ```

2. **Password mismatch:**
   ```bash
   # Reset admin password via database
   sudo -u postgres psql -d resolvera
   UPDATE "User" SET "passwordHash" = '$2b$10$...' WHERE email = 'admin@example.com';
   ```

3. **Cookie issues:**
   - Clear browser cookies for localhost:3000
   - Check browser allows cookies
   - Verify SameSite cookie setting in production

### Session expires immediately

**Problem:** Logged out after page refresh

**Solutions:**

1. **Check cookie settings:**
   ```typescript
   // lib/auth/jwt.ts - should have:
   sameSite: 'lax',  // Not 'strict'
   httpOnly: true,
   secure: process.env.NODE_ENV === 'production'
   ```

2. **Clock skew:**
   ```bash
   # Sync system time
   sudo ntpdate -s time.nist.gov
   ```

3. **Browser privacy settings:**
   - Disable "Block all cookies"
   - Allow cookies for localhost

---

## DNS Record Issues

### Failed to create/update DNS record

**Problem:** Cloudflare API errors

**Common Errors:**

1. **81053: Record already exists**
   - A record with same name and type already exists
   - Delete the existing record first
   - Or use a different name/subdomain

2. **81057: Invalid record content**
   - A records require valid IPv4 (e.g., 192.0.2.1)
   - AAAA records require valid IPv6 (e.g., 2001:db8::1)
   - CNAME cannot be at root domain

3. **10000: Authentication error**
   - API token is invalid or expired
   - Token lacks required permissions
   - Re-add zone with new token

**Solutions:**
```bash
# 1. Verify API token has correct permissions
# Cloudflare Dashboard → API Tokens
# Required: Zone.Zone (Read), Zone.DNS (Edit)

# 2. Test token directly
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

# 3. Check zone ID is correct
# Dashboard → Domain → Overview → Zone ID
```

### Zone not found

**Problem:** Cannot access zone in Resolvera

**Solutions:**

1. **Check zone is added:**
   - Admin Dashboard → Zones
   - Verify zone appears in list

2. **Check user permissions:**
   - Admin → Users → Edit User
   - Verify zone is assigned to user

3. **Re-add zone:**
   - Remove zone and re-add with correct zoneId and apiToken

---

## Watcher Problems

### Watcher not running

**Problem:** IP checks not happening

**Diagnosis:**
```bash
# 1. Check server logs
docker compose logs -f app  # Docker
# or
pm2 logs  # Manual deployment

# 2. Check watcher settings in database
sudo -u postgres psql -d resolvera
SELECT * FROM "WatcherSettings";
SELECT * FROM "Watcher" WHERE enabled = true;
```

**Solutions:**

1. **Watcher not enabled:**
   - Admin → Watcher → Settings
   - Enable "Automatic Checking"
   - Set check interval (e.g., 60 minutes)

2. **No watchers configured:**
   - Admin → Watcher → Add Watcher
   - Add at least one A or AAAA record to monitor

3. **Scheduler not started:**
   ```bash
   # Check instrumentation.ts is being executed
   # Restart server to reinitialize
   npm run build && npm run start
   ```

### IP mismatch not detected

**Problem:** Watcher shows "ok" but IP is wrong

**Solutions:**

1. **Check expected IP:**
   - Watcher should auto-populate expectedIP
   - Manually trigger check: Admin → Watcher → "Check Now"

2. **Verify DNS record:**
   ```bash
   # Check actual DNS record
   nslookup home.example.com
   dig home.example.com A +short
   ```

3. **Check watcher config:**
   - Verify recordName matches exactly (e.g., "home.example.com")
   - Verify recordType matches (A for IPv4, AAAA for IPv6)

### Auto-update not working

**Problem:** Watcher detects mismatch but doesn't update DNS

**Solutions:**

1. **Check auto-update is enabled:**
   - Admin → Watcher → Settings
   - Enable "Auto-Update on Mismatch"

2. **Check API token permissions:**
   - Token must have Zone.DNS (Edit) permission

3. **Check audit logs:**
   - Admin → Audit Logs
   - Look for watcher.check.triggered events
   - Check for errors

---

## Notification Issues

### Discord notifications not sending

**Problem:** No messages in Discord channel

**Diagnosis:**
1. Check Discord webhook URL is correct
2. Verify notifications are enabled
3. Check server logs for webhook errors

**Solutions:**

1. **Test webhook URL:**
   ```bash
   curl -X POST "YOUR_DISCORD_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"content": "Test from Resolvera"}'
   ```

2. **Check notification settings:**
   - Admin → Notifications
   - Verify "Discord Webhook Enabled" is checked
   - Verify webhook URL is correct
   - Enable specific event types

3. **Webhook errors:**
   - Invalid webhook URL (deleted channel, invalid ID)
   - Rate limiting (too many messages)
   - Check Discord server logs

### Notifications delayed

**Problem:** Discord messages arrive late

**Solutions:**

1. **Check network latency:**
   ```bash
   ping discord.com
   curl -w "@curl-format.txt" -o /dev/null -s "https://discord.com/api/webhooks/..."
   ```

2. **Check server load:**
   ```bash
   htop  # Check CPU/memory usage
   ```

3. **Database query optimization:**
   - Run `VACUUM ANALYZE` on database
   - Check audit log size (consider pruning old logs)

---

## Docker Issues

### Container won't start

**Problem:** `docker compose up` fails

**Diagnosis:**
```bash
# Check container status
docker compose ps

# Check logs
docker compose logs app
docker compose logs postgres

# Check resource usage
docker stats
```

**Solutions:**

1. **Port already in use:**
   ```bash
   # Check what's using port 3000
   sudo lsof -i :3000

   # Kill process or change HOST_PORT in .env
   HOST_PORT=3001
   ```

2. **Database connection failed:**
   ```bash
   # Verify DATABASE_URL uses 'postgres' as host (not localhost)
   DATABASE_URL=postgresql://resolvera:password@postgres:5432/resolvera

   # Restart services
   docker compose down
   docker compose up -d
   ```

3. **Build failed:**
   ```bash
   # Rebuild from scratch
   docker compose down -v
   docker compose build --no-cache
   docker compose up -d
   ```

### Database data persists after down

**Problem:** Can't reset database

**Solution:**
```bash
# Remove volumes
docker compose down -v

# Remove specific volume
docker volume rm resolvera_postgres_data

# Restart fresh
docker compose up -d
```

---

## Performance Problems

### High CPU usage

**Problem:** Server using excessive CPU

**Diagnosis:**
```bash
# Check processes
htop

# Check Node.js CPU usage
ps aux | grep node

# Docker stats
docker stats
```

**Solutions:**

1. **Watcher checking too frequently:**
   - Increase check interval to 60+ minutes
   - Reduce number of watchers

2. **Infinite loops:**
   - Check browser console for errors
   - Check for useEffect dependency issues
   - Update to latest version (fixes included)

3. **Database queries:**
   - Add database indexes
   - Reduce audit log size
   - Optimize audit log queries

### High memory usage

**Problem:** Out of memory errors

**Solutions:**

1. **Increase Node.js memory:**
   ```bash
   # In package.json
   "start": "NODE_OPTIONS=--max_old_space_size=4096 next start"
   ```

2. **Docker memory limit:**
   ```yaml
   # docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

3. **Clear cache:**
   - Admin → Cache → Clear All Caches
   - Restart server

---

## Build Errors

### TypeScript errors

**Problem:** `npm run build` fails with TS errors

**Solutions:**
```bash
# 1. Check TypeScript version
npm list typescript

# 2. Regenerate Prisma client
npx prisma generate

# 3. Clear Next.js cache
rm -rf .next

# 4. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 5. Build again
npm run build
```

### Module not found errors

**Problem:** Cannot find module '@/lib/...'

**Solutions:**

1. **Check tsconfig.json paths:**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

2. **Restart TypeScript server** (in VS Code):
   - Cmd/Ctrl + Shift + P
   - "TypeScript: Restart TS Server"

---

## Getting Help

If you're still experiencing issues:

1. **Check documentation:**
   - [README.md](README.md)
   - [API.md](API.md)
   - [ARCHITECTURE.md](ARCHITECTURE.md)

2. **Search existing issues:**
   - Check if issue is already reported
   - Look for solutions in closed issues

3. **Create new issue:**
   - Provide clear description
   - Include error messages
   - Attach relevant logs
   - Specify environment (Docker/Manual, OS, versions)

4. **Enable debug logging:**
   ```bash
   # Add to .env
   DEBUG=true
   LOG_LEVEL=debug
   ```

---

**Common Commands Reference:**

```bash
# Development
npm run dev

# Production
npm run build
npm run start

# Database
npx prisma migrate deploy
npx prisma studio
npx prisma generate

# Docker
docker compose up -d
docker compose logs -f
docker compose down
docker compose restart app

# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -d resolvera
```

---

**For more information, see:**
- [Main Documentation](README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Development Guide](DEVELOPMENT.md)
