# Docker Hub Deployment Guide

This guide covers building and publishing Resolvera to Docker Hub for easy distribution.

## Quick Start

```bash
# Build and push to Docker Hub
.docker/scripts/build-and-push.sh

# Or use the pre-built image
docker compose -f .docker/docker-compose.prebuilt.yml up -d
```

---

## Prerequisites

1. **Docker Hub Account**: https://hub.docker.com/
2. **Docker installed**: Docker 20.10+
3. **Login to Docker Hub**:
   ```bash
   docker login
   # Username: icyicefsdev
   # Password: [your token or password]
   ```

---

## Building and Pushing

### Automated Script (Recommended)

The automated script handles versioning, tagging, and pushing:

```bash
# Build and push (reads version from package.json)
.docker/scripts/build-and-push.sh

# Build only (don't push)
.docker/scripts/build-and-push.sh --build-only

# Build without cache
.docker/scripts/build-and-push.sh --no-cache

# Build for multiple architectures (amd64, arm64)
.docker/scripts/build-and-push.sh --multiarch

# Use custom version
.docker/scripts/build-and-push.sh --version 1.2.3

# View all options
.docker/scripts/build-and-push.sh --help
```

**Script creates these tags automatically:**
- `icyicefsdev/resolvera:latest`
- `icyicefsdev/resolvera:0.1.0` (from package.json)
- `icyicefsdev/resolvera:v0.1.0`

### Manual Build and Push

If you prefer to build manually:

```bash
# 1. Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# 2. Build with multiple tags
docker build -f .docker/Dockerfile \
  -t icyicefsdev/resolvera:latest \
  -t icyicefsdev/resolvera:${VERSION} \
  -t icyicefsdev/resolvera:v${VERSION} \
  .

# 3. Push all tags
docker push icyicefsdev/resolvera:latest
docker push icyicefsdev/resolvera:${VERSION}
docker push icyicefsdev/resolvera:v${VERSION}
```

---

## Using Pre-Built Images

Once pushed to Docker Hub, users can run Resolvera without building:

### Option 1: Use Pre-Built Compose File

```bash
# 1. Configure environment
cp .docker/.env.docker .env
# Edit .env with your secrets

# 2. Start with pre-built image
docker compose -f .docker/docker-compose.prebuilt.yml up -d
```

### Option 2: Pull and Run Manually

```bash
# Pull the image
docker pull icyicefsdev/resolvera:latest

# Run with docker run (you'll need to set up postgres separately)
docker run -d \
  --name resolvera \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret" \
  -e ENCRYPTION_KEY="your-key" \
  icyicefsdev/resolvera:latest
```

---

## Versioning Strategy

### Semantic Versioning

Resolvera follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Version Tags

Each release creates multiple tags:

| Tag | Description | Example |
|-----|-------------|---------|
| `latest` | Most recent stable release | `icyicefsdev/resolvera:latest` |
| `X.Y.Z` | Specific version | `icyicefsdev/resolvera:1.0.0` |
| `vX.Y.Z` | Specific version (with v prefix) | `icyicefsdev/resolvera:v1.0.0` |

### Recommended Usage

**Production**: Use specific version tags
```yaml
services:
  app:
    image: icyicefsdev/resolvera:1.0.0  # Pinned version
```

**Development/Testing**: Use latest tag
```yaml
services:
  app:
    image: icyicefsdev/resolvera:latest  # Always latest
```

---

## Multi-Architecture Builds

To support multiple CPU architectures (Intel/AMD and ARM):

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build for multiple platforms
.docker/scripts/build-and-push.sh --multiarch
```

This creates images for:
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, e.g., Raspberry Pi 4, Apple Silicon)

---

## Release Workflow

### 1. Update Version

```bash
# Update package.json version
npm version patch  # or minor, or major

# This creates a git tag automatically
```

### 2. Build and Push

```bash
# Automated (reads new version from package.json)
.docker/scripts/build-and-push.sh

# Or manual
VERSION=$(node -p "require('./package.json').version")
docker build -f .docker/Dockerfile -t icyicefsdev/resolvera:${VERSION} .
docker push icyicefsdev/resolvera:${VERSION}
```

### 3. Update Latest Tag

```bash
# Tag and push as latest
docker tag icyicefsdev/resolvera:${VERSION} icyicefsdev/resolvera:latest
docker push icyicefsdev/resolvera:latest
```

### 4. Push Git Changes

```bash
git push && git push --tags
```

---

## Docker Hub Repository Setup

### Repository Settings

1. **Description**: Modern Self-Hosted DNS Manager for Cloudflare
2. **README**: Link to GitHub/Gitea repository
3. **Category**: Developer Tools

### Automated Builds (Optional)

You can configure Docker Hub to automatically build on git push:

1. Go to Docker Hub repository
2. Settings → Builds → Configure Automated Builds
3. Connect to your git repository
4. Set build rules:
   - **Source**: `main` branch → **Tag**: `latest`
   - **Source**: `/^v[0-9.]+$/` (version tags) → **Tag**: `{sourceref}`

---

## Updating Documentation

After pushing a new image, update these files:

### README.md
```markdown
## Docker Installation

Pull and run from Docker Hub:

\`\`\`bash
docker pull icyicefsdev/resolvera:latest
docker compose -f .docker/docker-compose.prebuilt.yml up -d
\`\`\`
```

### QUICKSTART.md
Add Docker Hub instructions as an alternative to building locally.

---

## Troubleshooting

### Login Issues

```bash
# Create access token on Docker Hub (recommended)
# Settings → Security → New Access Token

# Login with token
docker login -u icyicefsdev
# Password: [paste your access token]
```

### Build Fails

```bash
# Clear build cache
docker builder prune

# Build with no cache
.docker/scripts/build-and-push.sh --no-cache
```

### Push Rate Limits

Docker Hub has rate limits for free accounts:
- **Pull**: 100 pulls per 6 hours (anonymous), 200 pulls (authenticated)
- **Push**: No limit for your own repositories

**Solution**: Upgrade to Docker Hub Pro or use GitHub Container Registry.

### Image Size Too Large

Current Dockerfile uses multi-stage builds for optimization. To reduce further:

```bash
# Check image size
docker images icyicefsdev/resolvera

# Analyze layers
docker history icyicefsdev/resolvera:latest

# Use dive tool for detailed analysis
dive icyicefsdev/resolvera:latest
```

---

## Alternative: GitHub Container Registry

If you prefer GitHub Container Registry (ghcr.io):

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u icyicefsdev --password-stdin

# Build and push
docker build -f .docker/Dockerfile -t ghcr.io/icyicefsdev/resolvera:latest .
docker push ghcr.io/icyicefsdev/resolvera:latest
```

---

## Image Information

### Current Stats
- **Base Image**: node:20-alpine
- **Size**: ~300-500MB (with multi-stage build optimization)
- **Platforms**: linux/amd64 (add linux/arm64 with --multiarch)

### Security
- Runs as non-root user (nextjs:1001)
- No sensitive data in image
- Regular security updates via base image

---

## Support

- **Docker Hub**: https://hub.docker.com/r/icyicefsdev/resolvera
- **Repository**: https://gitea.stull-group.com/iceflier/resolvera
- **Issues**: Report on git repository

---

## Next Steps

1. ✅ Build and push your first image
2. ✅ Test pulling and running the pre-built image
3. ✅ Set up automated builds (optional)
4. ✅ Add Docker Hub badge to README
5. ✅ Share the image with users!

**Docker Hub Badge for README:**
```markdown
![Docker Pulls](https://img.shields.io/docker/pulls/icyicefsdev/resolvera)
![Docker Image Size](https://img.shields.io/docker/image-size/icyicefsdev/resolvera)
```
