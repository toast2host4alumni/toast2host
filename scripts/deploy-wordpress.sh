#!/bin/bash

# Azure WordPress Deployment Script
# Creates WordPress + MySQL on Azure App Service with multi-container

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Configuration
RESOURCE_GROUP="toast2host-rg"
LOCATION="eastus"
WP_APP_NAME="toast2host-wordpress"
WP_PLAN_NAME="toast2host-wordpress-plan"

# Generate random passwords
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
WP_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "========================================="
echo "Azure WordPress Deployment"
echo "========================================="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "WordPress App: $WP_APP_NAME"
echo "========================================="

# Check if resource group exists
echo "Checking resource group..."
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  echo "Creating resource group $RESOURCE_GROUP..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
else
  echo "Resource group $RESOURCE_GROUP already exists"
fi

# Check if App Service Plan exists, create if not
echo ""
echo "Checking App Service Plan..."
if ! az appservice plan show --name "$WP_PLAN_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
  echo "Creating App Service Plan..."
  az appservice plan create \
    --name "$WP_PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku B2 \
    --is-linux
else
  echo "App Service Plan $WP_PLAN_NAME already exists"
fi

# Create Web App
echo ""
echo "Creating WordPress App Service..."
az webapp create \
  --name "$WP_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$WP_PLAN_NAME" \
  --multicontainer-config-type compose \
  --multicontainer-config-file "$SCRIPT_DIR/docker-compose-wordpress.yml"

# Configure app settings with passwords
echo ""
echo "Configuring environment variables..."
az webapp config appsettings set \
  --name "$WP_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    WORDPRESS_DB_PASSWORD="$WP_DB_PASSWORD" \
    MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="true" \
    WEBSITES_PORT="80"

# Enable container logging
echo ""
echo "Enabling container logs..."
az webapp log config \
  --name "$WP_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --docker-container-logging filesystem

# Enable HTTPS only
echo ""
echo "Enabling HTTPS..."
az webapp update \
  --name "$WP_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --https-only true

# Restart the webapp to apply changes
echo ""
echo "Restarting webapp..."
az webapp restart \
  --name "$WP_APP_NAME" \
  --resource-group "$RESOURCE_GROUP"

# Get the webapp URL
WP_URL=$(az webapp show \
  --name "$WP_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostName" -o tsv)

echo ""
echo "========================================="
echo "WordPress Deployment Complete!"
echo "========================================="
echo "WordPress URL: https://$WP_URL"
echo ""
echo "The WordPress site is deploying with MySQL container."
echo "It may take 2-3 minutes for containers to start."
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for containers to start"
echo "2. Visit https://$WP_URL to complete WordPress installation"
echo "3. Configure custom domain (toast2host.net) in Azure Portal"
echo "4. Install SSL certificate for custom domain"
echo ""

# Save credentials to file
CREDS_FILE="/Users/jay/Projects/Toast2Host/mvp/tmp/wordpress-credentials.txt"
mkdir -p /Users/jay/Projects/Toast2Host/mvp/tmp
cat > "$CREDS_FILE" << EOF
WordPress Deployment Credentials
=================================
Date: $(date)

WordPress URL: https://$WP_URL
App Name: $WP_APP_NAME
Resource Group: $RESOURCE_GROUP

MySQL Root Password: $MYSQL_ROOT_PASSWORD
WordPress DB Password: $WP_DB_PASSWORD

Database Host: mysql (internal)
Database Name: wordpress
Database User: wordpress
EOF

echo "Credentials saved to: $CREDS_FILE"
