# Docker Setup for Resolvera

This directory contains all the necessary files to run Resolvera in Docker containers using Docker Compose.

## Quick Start

```bash
# 1. From the project root, run:
docker compose -f .docker/docker-compose.yml up -d

# 2. Access the application at:
http://localhost:3000

# 3. Complete the initial setup at:
http://localhost:3000/setup
```

## What's Included

- **PostgreSQL 16**: Database with persistent volume
- **Resolvera App**: Next.js application with auto-restart
- **Health Checks**: Automated container health monitoring
- **Persistent Data**: Volumes for database and application data

## Files Overview

```
.docker/
├── README.md                    # This file
├── docker-compose.yml           # Build from source
├── docker-compose.prebuilt.yml  # Use pre-built image from Docker Hub
├── Dockerfile                   # Multi-stage app container build
├── entrypoint.sh                # Container startup script
└── scripts/
    └── build-and-push.sh        # Automated Docker Hub build/push
```

## Deployment Options

### Option 1: Pre-Built Image (Fastest)
Use the pre-built image from Docker Hub:
```bash
docker compose -f .docker/docker-compose.prebuilt.yml up -d
```
[📖 See Docker Hub Guide](DOCKER_HUB.md)

### Option 2: Build from Source
Build the image locally:
```bash
docker compose -f .docker/docker-compose.yml up -d
```

## Configuration

### 1. Environment Variables

Copy the template and customize:

```bash
cp .env.example .env
```

**Required variables:**
- `POSTGRES_PASSWORD`: Database password (change this!)
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `ENCRYPTION_KEY`: Generate with `openssl rand -hex 16` (must be exactly 32 chars)
- `PASSWORD_HASH_SECRET`: Generate with `openssl rand -hex 16` (must be exactly 32 chars)
- `ZONE_API_HASH_SECRET`: Generate with `openssl rand -hex 16` (must be exactly 32 chars)

### 2. Ports

Default ports (can be changed in docker-compose.yml):
- `3000`: Resolvera web interface
- `5432`: PostgreSQL (not exposed by default)

## Management Commands

### Start Services
```bash
docker compose -f .docker/docker-compose.yml up -d
```

### Stop Services
```bash
docker compose -f .docker/docker-compose.yml down
```

### View Logs
```bash
# All services
docker compose -f .docker/docker-compose.yml logs -f

# Specific service
docker compose -f .docker/docker-compose.yml logs -f app
docker compose -f .docker/docker-compose.yml logs -f postgres
```

### Restart Services
```bash
docker compose -f .docker/docker-compose.yml restart
```

### Rebuild After Code Changes
```bash
docker compose -f .docker/docker-compose.yml up -d --build
```

### Database Backup
```bash
docker compose -f .docker/docker-compose.yml exec postgres \
  pg_dump -U resolvera resolvera > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
```bash
docker compose -f .docker/docker-compose.yml exec -T postgres \
  psql -U resolvera resolvera < backup.sql
```

## Data Persistence

Data is stored in Docker volumes:

- `resolvera_postgres_data`: Database files
- `resolvera_app_data`: Application data

### Backup Volumes
```bash
docker run --rm -v resolvera_postgres_data:/data \
  -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### List Volumes
```bash
docker volume ls | grep resolvera
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose -f .docker/docker-compose.yml logs

# Check container status
docker compose -f .docker/docker-compose.yml ps
```

### Database Connection Issues
```bash
# Verify database is running
docker compose -f .docker/docker-compose.yml exec postgres \
  psql -U resolvera -d resolvera -c "SELECT version();"

# Check connection from app
docker compose -f .docker/docker-compose.yml exec app \
  node -e "console.log(process.env.DATABASE_URL)"
```

### Reset Everything
```bash
# WARNING: This deletes all data
docker compose -f .docker/docker-compose.yml down -v
docker compose -f .docker/docker-compose.yml up -d
```

### Permission Issues
```bash
# Fix ownership (Linux)
sudo chown -R $USER:$USER .
```

## Production Deployment

For production use:

1. **Change all secrets** in `.env`
2. **Use HTTPS** with a reverse proxy (Nginx/Traefik)
3. **Enable automatic backups**
4. **Configure firewall** to restrict database access
5. **Set up monitoring** (health checks are included)
6. **Use Docker secrets** instead of environment variables

### Example with Nginx Reverse Proxy

```yaml
# Add to docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
```

## Health Checks

Both containers include health checks:

- **PostgreSQL**: Checks database connectivity
- **App**: Checks HTTP response on port 3000

View health status:
```bash
docker compose -f .docker/docker-compose.yml ps
```

## Security Notes

1. **Never commit `.env`** with real credentials
2. **Use strong passwords** for PostgreSQL
3. **Keep JWT_SECRET and ENCRYPTION_KEY secure**
4. **Limit database exposure** (port 5432 not exposed by default)
5. **Regular backups** are essential
6. **Update base images** regularly for security patches

## Support

- **Documentation**: [/documents](../documents/)
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **PostgreSQL Image**: https://hub.docker.com/_/postgres
- **Node.js Image**: https://hub.docker.com/_/node

## Version Information

- Docker Compose: v2.0+
- PostgreSQL: 16-alpine
- Node.js: 20-alpine
- Next.js: 16.0.1
