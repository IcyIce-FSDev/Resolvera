# NGINX Integration Guide for Resolvera

Complete guide to setting up NGINX as a reverse proxy for Resolvera DNS Manager with SSL/TLS support, automated configuration generation, and production best practices.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration Templates](#configuration-templates)
- [Automated Setup Script](#automated-setup-script)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Security Hardening](#security-hardening)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)
- [Production Checklist](#production-checklist)

---

## Overview

NGINX serves as a reverse proxy for Resolvera, providing:

- **SSL/TLS termination** - HTTPS support with automatic certificate renewal
- **Load balancing** - Distribute traffic across multiple instances
- **Caching** - Static asset caching for improved performance
- **Security** - DDoS protection, rate limiting, security headers
- **WebSocket support** - For real-time features (if added)
- **Compression** - Gzip/Brotli compression for reduced bandwidth

### Architecture

```
Internet ’ NGINX (Port 80/443) ’ Resolvera (Port 3000) ’ PostgreSQL
              “
         SSL/TLS Termination
         Static Caching
         Security Headers
         Rate Limiting
```

---

## Prerequisites

- **Ubuntu/Debian** 20.04+ or similar Linux distribution
- **Root or sudo access** for system configuration
- **Domain name** pointing to your server IP
- **Resolvera** installed and running on port 3000
- **PostgreSQL** installed and configured

### Verify Resolvera is Running

```bash
# Check if Resolvera is running
curl http://localhost:3000

# Check with Docker
docker compose ps

# Check logs
docker compose logs app
# or
pm2 logs resolvera
```

---

## Quick Start

**For impatient users who want NGINX up in 5 minutes:**

```bash
# 1. Download and run the automated setup script
curl -sSL https://raw.githubusercontent.com/yourusername/resolvera/main/scripts/nginx-setup.sh | sudo bash

# 2. Follow the prompts:
#    - Enter your domain (e.g., dns.example.com)
#    - Choose SSL option (Let's Encrypt or Manual)
#    - Confirm settings

# 3. Access your site
#    https://dns.example.com
```

**For users who want control, continue reading...**

---

## Installation

### Step 1: Install NGINX

**Ubuntu/Debian:**
```bash
# Update package list
sudo apt update

# Install NGINX
sudo apt install nginx -y

# Start and enable NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
# Expected: nginx version: nginx/1.18.0 (or higher)
```

**CentOS/RHEL:**
```bash
# Install NGINX
sudo yum install nginx -y

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Configure Firewall

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 'Nginx Full'
sudo ufw allow 'OpenSSH'
sudo ufw enable

# Verify
sudo ufw status

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Step 3: Verify NGINX is Running

```bash
# Check status
sudo systemctl status nginx

# Test default page
curl http://localhost

# Should see: "Welcome to nginx!" page
```

---

## Configuration Templates

### Template 1: HTTP Only (Development/Testing)

**File:** `/etc/nginx/sites-available/resolvera`

```nginx
# Resolvera - HTTP Only Configuration
# WARNING: NOT SECURE - Use only for testing

server {
    listen 80;
    listen [::]:80;

    server_name dns.example.com;  # CHANGE THIS

    # Logging
    access_log /var/log/nginx/resolvera-access.log;
    error_log /var/log/nginx/resolvera-error.log warn;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Resolvera
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Template 2: HTTPS with Let's Encrypt (Production)

**File:** `/etc/nginx/sites-available/resolvera-ssl`

```nginx
# Resolvera - Production HTTPS Configuration
# Requires: Certbot SSL certificates

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;

    server_name dns.example.com;  # CHANGE THIS

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name dns.example.com;  # CHANGE THIS

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/dns.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dns.example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/dns.example.com/chain.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Diffie-Hellman parameter for DHE ciphersuites
    ssl_dhparam /etc/nginx/dhparam.pem;

    # Logging
    access_log /var/log/nginx/resolvera-ssl-access.log;
    error_log /var/log/nginx/resolvera-ssl-error.log warn;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    # Client body size (for large API requests)
    client_max_body_size 1M;

    # Rate limiting (if configured)
    # limit_req zone=resolvera_limit burst=10 nodelay;

    # Proxy to Resolvera
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;

        # WebSocket support (for future use)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Don't pass these headers to backend
        proxy_hide_header X-Powered-By;
    }

    # Static assets caching (if serving directly)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints (no caching)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # No caching for API
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";

        # Timeouts for API calls
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Template 3: Docker Deployment

**File:** `/etc/nginx/sites-available/resolvera-docker`

```nginx
# Resolvera - Docker Deployment Configuration

upstream resolvera_backend {
    # Docker container
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;

    # For multiple instances (load balancing)
    # server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    # server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;

    keepalive 32;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name dns.example.com;  # CHANGE THIS

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/dns.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dns.example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Logging
    access_log /var/log/nginx/resolvera-access.log;
    error_log /var/log/nginx/resolvera-error.log;

    # Security headers
    include /etc/nginx/snippets/security-headers.conf;

    # Proxy to Docker container
    location / {
        proxy_pass http://resolvera_backend;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## Automated Setup Script

Create this script to automatically configure NGINX for Resolvera.

**File:** `/usr/local/bin/setup-resolvera-nginx.sh`

```bash
#!/bin/bash
#
# Resolvera NGINX Setup Script
# Automatically configures NGINX as a reverse proxy for Resolvera
#
# Usage: sudo ./setup-resolvera-nginx.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() { echo -e "${GREEN}${NC} $1"; }
print_error() { echo -e "${RED}${NC} $1"; }
print_info() { echo -e "${YELLOW}’${NC} $1"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

echo "TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW"
echo "Q   Resolvera NGINX Configuration Setup     Q"
echo "ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]"
echo ""

# Step 1: Check prerequisites
print_info "Checking prerequisites..."

# Check if NGINX is installed
if ! command -v nginx &> /dev/null; then
    print_error "NGINX is not installed"
    read -p "Install NGINX now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apt update
        apt install nginx -y
        print_success "NGINX installed"
    else
        exit 1
    fi
else
    print_success "NGINX is installed"
fi

# Check if Resolvera is running
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Resolvera is running on port 3000"
else
    print_error "Resolvera is not running on port 3000"
    print_info "Please start Resolvera first"
    exit 1
fi

# Step 2: Get domain name
echo ""
print_info "Configuration"
read -p "Enter your domain name (e.g., dns.example.com): " DOMAIN

if [[ -z "$DOMAIN" ]]; then
    print_error "Domain name is required"
    exit 1
fi

# Step 3: Choose SSL option
echo ""
print_info "SSL Configuration"
echo "1) Let's Encrypt (automatic, free SSL)"
echo "2) Manual SSL certificates"
echo "3) No SSL (HTTP only - not recommended)"
read -p "Choose option (1-3): " SSL_OPTION

# Step 4: Create NGINX configuration
print_info "Creating NGINX configuration..."

CONFIG_FILE="/etc/nginx/sites-available/resolvera"

if [[ "$SSL_OPTION" == "1" ]]; then
    # Let's Encrypt setup

    # Install Certbot
    if ! command -v certbot &> /dev/null; then
        print_info "Installing Certbot..."
        apt install certbot python3-certbot-nginx -y
        print_success "Certbot installed"
    fi

    # Create initial HTTP config
    cat > $CONFIG_FILE << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Enable site
    ln -sf $CONFIG_FILE /etc/nginx/sites-enabled/resolvera

    # Test and reload NGINX
    nginx -t && systemctl reload nginx

    print_success "Initial configuration created"

    # Obtain SSL certificate
    print_info "Obtaining SSL certificate..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

    if [[ $? -eq 0 ]]; then
        print_success "SSL certificate obtained"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi

elif [[ "$SSL_OPTION" == "2" ]]; then
    # Manual SSL
    read -p "Path to SSL certificate: " SSL_CERT
    read -p "Path to SSL private key: " SSL_KEY

    if [[ ! -f "$SSL_CERT" ]] || [[ ! -f "$SSL_KEY" ]]; then
        print_error "SSL files not found"
        exit 1
    fi

    cat > $CONFIG_FILE << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

else
    # HTTP only
    cat > $CONFIG_FILE << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    access_log /var/log/nginx/resolvera-access.log;
    error_log /var/log/nginx/resolvera-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

fi

# Enable site (if not already done)
if [[ ! -L /etc/nginx/sites-enabled/resolvera ]]; then
    ln -s $CONFIG_FILE /etc/nginx/sites-enabled/resolvera
fi

# Remove default site
if [[ -L /etc/nginx/sites-enabled/default ]]; then
    rm /etc/nginx/sites-enabled/default
    print_info "Removed default NGINX site"
fi

# Step 5: Create security headers snippet
print_info "Creating security headers..."
mkdir -p /etc/nginx/snippets

cat > /etc/nginx/snippets/security-headers.conf << 'EOF'
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
EOF

print_success "Security headers configured"

# Step 6: Generate Diffie-Hellman parameters (if SSL enabled)
if [[ "$SSL_OPTION" == "1" ]] || [[ "$SSL_OPTION" == "2" ]]; then
    if [[ ! -f /etc/nginx/dhparam.pem ]]; then
        print_info "Generating Diffie-Hellman parameters (this may take a while)..."
        openssl dhparam -out /etc/nginx/dhparam.pem 2048
        print_success "DH parameters generated"
    fi
fi

# Step 7: Test and restart NGINX
print_info "Testing NGINX configuration..."
if nginx -t; then
    print_success "NGINX configuration is valid"
    systemctl restart nginx
    print_success "NGINX restarted"
else
    print_error "NGINX configuration has errors"
    exit 1
fi

# Step 8: Configure firewall
print_info "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    print_success "Firewall configured (UFW)"
fi

# Step 9: Setup auto-renewal for Let's Encrypt
if [[ "$SSL_OPTION" == "1" ]]; then
    print_info "Setting up SSL certificate auto-renewal..."

    # Test renewal
    certbot renew --dry-run

    # Add cron job if not exists
    if ! crontab -l | grep -q certbot; then
        (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
        print_success "Auto-renewal configured"
    fi
fi

# Summary
echo ""
echo "TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW"
echo "Q         Setup Complete! <‰                 Q"
echo "ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]"
echo ""
print_success "NGINX is configured and running"
print_success "Domain: $DOMAIN"

if [[ "$SSL_OPTION" == "1" ]] || [[ "$SSL_OPTION" == "2" ]]; then
    print_success "SSL: Enabled (HTTPS)"
    echo ""
    echo "Access your site at: https://$DOMAIN"
else
    print_info "SSL: Disabled (HTTP only)"
    echo ""
    echo "Access your site at: http://$DOMAIN"
fi

echo ""
print_info "Next steps:"
echo "  1. Update NEXT_PUBLIC_URL in .env to https://$DOMAIN"
echo "  2. Restart Resolvera: docker compose restart app"
echo "  3. Test your site: curl -I https://$DOMAIN"
echo ""

# Log file locations
print_info "Log files:"
echo "  - Access: /var/log/nginx/resolvera-access.log"
echo "  - Error: /var/log/nginx/resolvera-error.log"
echo "  - NGINX: /var/log/nginx/error.log"
echo ""
```

**Make it executable:**
```bash
sudo chmod +x /usr/local/bin/setup-resolvera-nginx.sh
```

**Run it:**
```bash
sudo /usr/local/bin/setup-resolvera-nginx.sh
```

---

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Recommended)

**Advantages:**
- Free SSL certificates
- Automatic renewal
- Trusted by all browsers

**Installation:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d dns.example.com

# Test auto-renewal
sudo certbot renew --dry-run

# Certificates stored at:
# /etc/letsencrypt/live/dns.example.com/
```

**Auto-renewal setup:**
```bash
# Check existing cron jobs
crontab -l

# Add auto-renewal (if not exists)
sudo crontab -e

# Add this line:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Option 2: Manual SSL Certificates

**For custom certificates or wildcard domains:**

```bash
# Generate self-signed certificate (testing only)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/resolvera.key \
  -out /etc/ssl/certs/resolvera.crt

# Update NGINX config
sudo nano /etc/nginx/sites-available/resolvera

# Add SSL directives:
ssl_certificate /etc/ssl/certs/resolvera.crt;
ssl_certificate_key /etc/ssl/private/resolvera.key;
```

### SSL Best Practices

**1. Generate strong DH parameters:**
```bash
sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048
```

**2. Use modern TLS versions:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
```

**3. Enable OCSP stapling:**
```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/dns.example.com/chain.pem;
```

**4. Configure HSTS:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

## Security Hardening

### 1. Rate Limiting

**Add to `/etc/nginx/nginx.conf` (http block):**

```nginx
http {
    # Rate limiting zone
    limit_req_zone $binary_remote_addr zone=resolvera_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # ... rest of config
}
```

**Apply in server block:**

```nginx
# General rate limit
limit_req zone=resolvera_limit burst=20 nodelay;
limit_conn conn_limit 10;

# API-specific rate limit
location /api/ {
    limit_req zone=api_limit burst=5 nodelay;
    proxy_pass http://localhost:3000;
}
```

### 2. Security Headers Snippet

**Create:** `/etc/nginx/snippets/security-headers.conf`

```nginx
# Security Headers for Resolvera

# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# Enable XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';" always;

# HSTS (if SSL enabled)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Hide NGINX version
server_tokens off;
```

**Include in server block:**
```nginx
server {
    # ...
    include /etc/nginx/snippets/security-headers.conf;
    # ...
}
```

### 3. Block Common Attacks

```nginx
# Block common attack patterns
location ~ /\. {
    deny all;
}

location ~ ~$ {
    deny all;
}

# Block access to sensitive files
location ~ \.(env|git|svn|htaccess)$ {
    deny all;
}

# Limit request methods
if ($request_method !~ ^(GET|HEAD|POST|PUT|DELETE|PATCH|OPTIONS)$) {
    return 405;
}
```

### 4. IP Whitelisting (Optional)

**For admin routes:**
```nginx
location /api/admin/ {
    # Allow specific IPs
    allow 192.168.1.0/24;
    allow 10.0.0.1;
    deny all;

    proxy_pass http://localhost:3000;
}
```

---

## Performance Optimization

### 1. Enable Caching

```nginx
# Proxy cache configuration
proxy_cache_path /var/cache/nginx/resolvera
    levels=1:2
    keys_zone=resolvera_cache:10m
    max_size=100m
    inactive=60m
    use_temp_path=off;

server {
    # Static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        proxy_cache resolvera_cache;
        proxy_cache_valid 200 7d;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
        expires 7d;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

### 2. Enable Compression

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/rss+xml
    font/truetype
    font/opentype
    application/vnd.ms-fontobject
    image/svg+xml;
gzip_disable "msie6";

# Brotli compression (if module installed)
# brotli on;
# brotli_comp_level 6;
# brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. Connection Optimization

```nginx
# Keep-alive settings
keepalive_timeout 65;
keepalive_requests 100;

# Client timeouts
client_body_timeout 12;
client_header_timeout 12;
send_timeout 10;

# Buffers
client_body_buffer_size 128k;
client_max_body_size 1m;
client_header_buffer_size 1k;
large_client_header_buffers 4 8k;
```

### 4. Worker Optimization

**Edit `/etc/nginx/nginx.conf`:**

```nginx
# Auto-detect number of cores
worker_processes auto;

# Max connections per worker
events {
    worker_connections 1024;
    use epoll;
}
```

---

## Monitoring & Logging

### 1. Custom Log Format

**Add to `/etc/nginx/nginx.conf`:**

```nginx
http {
    # Custom log format with timing
    log_format resolvera '$remote_addr - $remote_user [$time_local] '
                         '"$request" $status $body_bytes_sent '
                         '"$http_referer" "$http_user_agent" '
                         'rt=$request_time uct="$upstream_connect_time" '
                         'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log resolvera;
}
```

### 2. Log Rotation

**Edit `/etc/logrotate.d/nginx`:**

```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
```

### 3. Status Monitoring

**Enable stub_status module:**

```nginx
server {
    listen 127.0.0.1:8080;
    server_name localhost;

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

**Check status:**
```bash
curl http://localhost:8080/nginx_status
```

### 4. Real-time Monitoring

```bash
# Watch access log in real-time
sudo tail -f /var/log/nginx/resolvera-access.log

# Watch error log
sudo tail -f /var/log/nginx/resolvera-error.log

# Monitor with goaccess (if installed)
sudo goaccess /var/log/nginx/resolvera-access.log -c
```

---

## Troubleshooting

### Common Issues

**1. 502 Bad Gateway**
```bash
# Check if Resolvera is running
curl http://localhost:3000

# Check Resolvera logs
docker compose logs app
# or
pm2 logs resolvera

# Check NGINX error log
sudo tail -f /var/log/nginx/error.log
```

**2. SSL Certificate Errors**
```bash
# Test SSL
openssl s_client -connect dns.example.com:443 -servername dns.example.com

# Check certificate expiry
echo | openssl s_client -connect dns.example.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew Let's Encrypt
sudo certbot renew --force-renewal
```

**3. Configuration Errors**
```bash
# Test NGINX config
sudo nginx -t

# Check syntax
sudo nginx -T

# Reload without restart
sudo nginx -s reload
```

**4. Permission Denied**
```bash
# Check NGINX user
ps aux | grep nginx

# Check file permissions
ls -la /var/log/nginx/

# Fix permissions
sudo chown -R www-data:www-data /var/log/nginx/
```

**5. Rate Limiting Issues**
```bash
# Check rate limit zones
sudo cat /var/log/nginx/error.log | grep limiting

# Adjust limits in nginx.conf
# Then reload
sudo nginx -s reload
```

---

## Production Checklist

### Pre-Deployment

- [ ] **Domain DNS configured** - A/AAAA records point to server
- [ ] **Firewall rules configured** - Ports 80, 443, 22 open
- [ ] **NGINX installed** - Latest stable version
- [ ] **Resolvera running** - Accessible on localhost:3000
- [ ] **SSL certificate obtained** - Let's Encrypt or manual
- [ ] **DH parameters generated** - For strong encryption

### Configuration

- [ ] **Server name set** - Correct domain in config
- [ ] **SSL enabled** - HTTPS with valid certificates
- [ ] **Security headers configured** - CSP, HSTS, X-Frame-Options
- [ ] **Rate limiting enabled** - Protect against abuse
- [ ] **Gzip compression enabled** - Reduce bandwidth
- [ ] **Logging configured** - Access and error logs
- [ ] **Cache configured** - Static assets cached
- [ ] **Proxy headers set** - X-Real-IP, X-Forwarded-For

### Security

- [ ] **HSTS enabled** - Force HTTPS
- [ ] **SSL score tested** - A+ on SSL Labs
- [ ] **Security headers tested** - A on SecurityHeaders.com
- [ ] **Server tokens disabled** - Hide NGINX version
- [ ] **Directory listing disabled** - No autoindex
- [ ] **Sensitive files blocked** - .env, .git, etc.
- [ ] **Rate limiting tested** - Verify limits work
- [ ] **Fail2ban configured** (optional) - Ban malicious IPs

### Performance

- [ ] **Worker processes optimized** - Match CPU cores
- [ ] **Gzip compression tested** - Verify headers
- [ ] **Static caching verified** - Check cache headers
- [ ] **Connection optimization** - Keepalive configured
- [ ] **Response times acceptable** - < 500ms average

### Monitoring

- [ ] **Log rotation configured** - Prevent disk fill
- [ ] **Access logs working** - Verify entries
- [ ] **Error logs working** - Check for issues
- [ ] **SSL renewal tested** - Certbot dry-run successful
- [ ] **Monitoring setup** (optional) - Grafana/Prometheus
- [ ] **Alerts configured** (optional) - Uptime monitoring

### Testing

- [ ] **HTTP to HTTPS redirect** - `curl -I http://domain.com`
- [ ] **SSL certificate valid** - Browser shows secure
- [ ] **All pages load** - Dashboard, zones, settings
- [ ] **API endpoints work** - Test CRUD operations
- [ ] **WebSocket connection** (if applicable) - No errors
- [ ] **Mobile responsive** - Test on phone
- [ ] **Cross-browser tested** - Chrome, Firefox, Safari

### Documentation

- [ ] **Configuration backed up** - Copy of nginx configs
- [ ] **Credentials documented** - SSL cert locations
- [ ] **Runbook created** - Common operations guide
- [ ] **Team notified** - Share access info

### Post-Deployment

- [ ] **DNS propagation verified** - `nslookup domain.com`
- [ ] **SSL certificate monitored** - Expiry alerts set
- [ ] **Logs monitored** - Check for errors daily
- [ ] **Performance baselines** - Record initial metrics
- [ ] **Backup strategy** - NGINX configs included

---

## Quick Commands Reference

```bash
# Configuration
sudo nano /etc/nginx/sites-available/resolvera
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx

# SSL (Let's Encrypt)
sudo certbot --nginx -d dns.example.com
sudo certbot renew --dry-run
sudo certbot certificates

# Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/resolvera-access.log

# Status
sudo systemctl status nginx
curl -I https://dns.example.com
sudo nginx -V

# Troubleshooting
sudo nginx -t
sudo systemctl restart nginx
sudo journalctl -u nginx -f
```

---

## Additional Resources

- **NGINX Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **SSL Labs Test**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **Mozilla SSL Config**: https://ssl-config.mozilla.org/

---

**For more information:**
- [Main Documentation](../../README.md)
- [Docker Deployment](../../.docker/README.md)
- [Troubleshooting Guide](../../TROUBLESHOOTING.md)
