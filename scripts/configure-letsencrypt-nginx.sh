#!/bin/bash
set -e

# Script to replace Cloudflare certificates with Let's Encrypt in Nginx
# Run this on your Azure VM

echo "=== Nginx Certificate Configuration: Switch to Let's Encrypt ==="

# Variables - Update these as needed
DOMAIN="your-domain.com"  # Update with your actual domain
EMAIL="your-email@example.com"  # Update with your email

# Backup current Nginx configuration
echo "Backing up Nginx configuration..."
sudo cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d_%H%M%S)

# Find and list current Nginx configurations
echo "Current Nginx configuration files:"
sudo find /etc/nginx/sites-enabled -type f -o -type l

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Stop Nginx temporarily to allow certbot standalone mode
echo "Stopping Nginx for certificate generation..."
sudo systemctl stop nginx

# Remove old Cloudflare certificates (optional - just for cleanup)
echo "Removing Cloudflare certificates..."
sudo rm -f /etc/ssl/cloudflare/*.pem 2>/dev/null || true
sudo rm -rf /etc/ssl/cloudflare 2>/dev/null || true

# Generate Let's Encrypt certificates
echo "Generating Let's Encrypt certificates for $DOMAIN..."
sudo certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Update Nginx configuration to use Let's Encrypt certificates
echo "Updating Nginx configuration..."

# Create new server block configuration
cat <<'EOF' | sudo tee /etc/nginx/sites-available/toast2host
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Let's Encrypt SSL certificates
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend proxy
    location /api/ {
        proxy_pass http://localhost:1337/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /graphql {
        proxy_pass http://localhost:1337/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin panel
    location /admin {
        proxy_pass http://localhost:1337/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Root location - serve static frontend or redirect
    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }
}
EOF

# Replace placeholder with actual domain
sudo sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/toast2host

# Enable the site
sudo ln -sf /etc/nginx/sites-available/toast2host /etc/nginx/sites-enabled/toast2host

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
echo "Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup auto-renewal for Let's Encrypt certificates
echo "Setting up certificate auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "=== Configuration Complete ==="
echo "Let's Encrypt certificates installed for: $DOMAIN"
echo "Certificates location: /etc/letsencrypt/live/$DOMAIN/"
echo "Auto-renewal enabled via systemd timer"
echo ""
echo "Next steps:"
echo "1. Update Cloudflare SSL/TLS mode to 'Full' (not 'Full strict')"
echo "2. Verify your site is working: https://$DOMAIN"
echo ""
echo "Certificate renewal test:"
echo "  sudo certbot renew --dry-run"
