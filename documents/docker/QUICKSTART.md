# Resolvera Docker Quick Start Guide

Get Resolvera running in Docker in under 5 minutes!

## Prerequisites

- **Docker**: 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: v2.0+ (included with Docker Desktop)

Verify installation:
```bash
docker --version
docker compose version
```

## Step 1: Clone Repository

```bash
git clone https://gitea.stull-group.com/iceflier/resolvera.git
cd resolvera
```

## Step 2: Configure Environment

```bash
# Copy the environment template
cp .docker/.env.docker .env

# Generate secrets (Linux/Mac)
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)" >> .env
echo "PASSWORD_HASH_SECRET=$(openssl rand -hex 16)" >> .env
echo "ZONE_API_HASH_SECRET=$(openssl rand -hex 16)" >> .env
```

**Or manually edit `.env`** and set:
- `POSTGRES_PASSWORD`: Strong database password
- `JWT_SECRET`: 32+ character random string
- `ENCRYPTION_KEY`: Exactly 32 characters

## Step 3: Start Services

```bash
docker compose -f .docker/docker-compose.yml up -d
```

You should see:
```
✅ Container resolvera-postgres   Started
✅ Container resolvera-app        Started
```

## Step 4: Verify Services

```bash
# Check container status
docker compose -f .docker/docker-compose.yml ps

# View logs
docker compose -f .docker/docker-compose.yml logs -f app
```

Expected output:
```
resolvera-app  | 🚀 Starting Resolvera container...
resolvera-app  | ✅ PostgreSQL is ready!
resolvera-app  | ✅ Database migrations completed successfully
resolvera-app  | 🌐 Starting application...
resolvera-app  | ✓ Ready on http://localhost:3000
```

## Step 5: Access Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Step 6: Create Admin Account

Navigate to the setup page:

```
http://localhost:3000/setup
```

Fill in:
- **Name**: Your admin name
- **Email**: admin@example.com
- **Password**: Strong password (save this!)

Click **"Create Admin Account"**

## Step 7: Login

1. Go to `http://localhost:3000`
2. Login with your admin credentials
3. Start managing your DNS!

---

## Common Commands

### Stop Services
```bash
docker compose -f .docker/docker-compose.yml down
```

### Restart Services
```bash
docker compose -f .docker/docker-compose.yml restart
```

### View Logs
```bash
# All logs
docker compose -f .docker/docker-compose.yml logs -f

# App only
docker compose -f .docker/docker-compose.yml logs -f app

# Database only
docker compose -f .docker/docker-compose.yml logs -f postgres
```

### Update to Latest Version
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f .docker/docker-compose.yml up -d --build
```

### Backup Database
```bash
docker compose -f .docker/docker-compose.yml exec postgres \
  pg_dump -U resolvera resolvera > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
docker compose -f .docker/docker-compose.yml exec -T postgres \
  psql -U resolvera resolvera < backup.sql
```

---

## Troubleshooting

### Containers Won't Start

**Check logs:**
```bash
docker compose -f .docker/docker-compose.yml logs
```

**Common issues:**
- Missing required environment variables (JWT_SECRET, ENCRYPTION_KEY, POSTGRES_PASSWORD)
- Port 3000 already in use
- Database connection failed

### Port Already in Use

Change the host port in `.env`:
```env
HOST_PORT=8080
```

Then restart:
```bash
docker compose -f .docker/docker-compose.yml down
docker compose -f .docker/docker-compose.yml up -d
```

Access at: `http://localhost:8080`

### Database Connection Error

**Verify database is running:**
```bash
docker compose -f .docker/docker-compose.yml exec postgres \
  psql -U resolvera -d resolvera -c "SELECT version();"
```

**Check connection string:**
```bash
docker compose -f .docker/docker-compose.yml exec app \
  printenv DATABASE_URL
```

### Reset Everything

**⚠️ WARNING: This deletes all data!**

```bash
docker compose -f .docker/docker-compose.yml down -v
docker compose -f .docker/docker-compose.yml up -d
```

### Permission Denied (Linux)

If you get permission errors:
```bash
sudo chown -R $USER:$USER .
```

---

## Production Deployment

For production environments:

1. **Use HTTPS** with reverse proxy (Nginx/Traefik)
2. **Change all default passwords** and secrets
3. **Enable automatic backups**
4. **Configure firewall rules**
5. **Set up monitoring** and alerts
6. **Use Docker secrets** instead of environment variables
7. **Regular security updates**

See [README.md](.docker/README.md) for detailed production setup.

---

## Next Steps

1. **Add Cloudflare Zones**:
   - Admin → Zones → Add Zone
   - Enter zone name and API token

2. **Create Users**:
   - Admin → Users → Add User
   - Assign zones to users

3. **Setup Watchers**:
   - Dashboard → Watchers → Add Watcher
   - Monitor DNS records for IP changes

4. **Configure Notifications**:
   - Admin → Notifications
   - Add Discord webhook URL

---

## Support

- **Documentation**: [/documents](../documents/)
- **Full Docker Guide**: [.docker/README.md](README.md)
- **Repository**: [Gitea](https://gitea.stull-group.com/iceflier/resolvera)

---

**You're all set! 🎉**

Resolvera is now running in Docker. Enjoy managing your DNS records!
