# Azure CLI Manual Deployment Guide

This guide explains how to deploy Toast2Host to Azure using Azure CLI directly, without GitHub Actions.

## Prerequisites

- Azure CLI installed (`az --version`)
- Azure subscription
- Logged in to Azure (`az login`)
- Node.js and pnpm installed locally

## Production URLs

- **Frontend**: https://app.toast2host.net
- **Backend**: https://api.toast2host.net

## Step 1: Generate Secrets

Run these commands to generate secure secrets:

```bash
# Generate random secrets
echo "DB_ADMIN_PASSWORD=$(openssl rand -base64 24)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"

# Generate 4 app keys (comma-separated)
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
```

Save these values - you'll need them for environment configuration.

## Step 2: Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="toast2host-prod"
LOCATION="eastus"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags environment=production project=toast2host
```

## Step 3: Deploy PostgreSQL Database

```bash
# Set database variables
DB_SERVER_NAME="toast2host-db"
DB_ADMIN_USER="t2hadmin"
DB_ADMIN_PASSWORD="<use generated password from Step 1>"
DB_NAME="toast2host"

# Create PostgreSQL server
az postgres flexible-server create \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0 \
  --tags environment=production

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

# Allow Azure services to connect
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Step 4: Deploy Backend (App Service)

```bash
# Set backend variables
BACKEND_APP_NAME="toast2host-backend"
BACKEND_PLAN="toast2host-backend-plan"

# Create App Service Plan
az appservice plan create \
  --name $BACKEND_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $BACKEND_PLAN \
  --runtime "NODE:20-lts"

# Configure environment variables
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATABASE_CLIENT=postgres \
    DATABASE_URL="postgresql://$DB_ADMIN_USER:$DB_ADMIN_PASSWORD@$DB_SERVER_NAME.postgres.database.azure.com:5432/$DB_NAME?sslmode=require" \
    APP_KEYS="<paste from Step 1>" \
    API_TOKEN_SALT="<paste from Step 1>" \
    ADMIN_JWT_SECRET="<paste from Step 1>" \
    TRANSFER_TOKEN_SALT="<paste from Step 1>" \
    JWT_SECRET="<paste from Step 1>" \
    PROVIDER_GOOGLE_CLIENT_ID="<your-google-client-id>" \
    PROVIDER_GOOGLE_CLIENT_SECRET="<your-google-client-secret>" \
    PROVIDER_GOOGLE_REDIRECT_URI="https://api.toast2host.net/api/connect/google/callback" \
    CLIENT_URL="https://app.toast2host.net" \
    CONSENT_REQUIRED=true \
    DAILY_CONNECT_CAP=10 \
    NOTIFICATIONS_EMAIL_ENABLED=false

# Enable HTTPS only
az webapp update \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true
```

## Step 5: Deploy Backend Code

```bash
# From project root
cd /Users/jay/Projects/Toast2Host/mvp

# Build backend
cd apps/backend
pnpm install --production=false
pnpm build

# Create deployment package
rm -f backend-deploy.zip
zip -r backend-deploy.zip \
  build/ \
  node_modules/ \
  package.json \
  ecosystem.config.js \
  public/ \
  database/ \
  config/ \
  -x "*.log" "*.tmp" ".DS_Store"

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --src backend-deploy.zip

# Set startup command
az webapp config set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "node build/server.js"

# Restart app
az webapp restart \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

## Step 6: Deploy Frontend (Static Web App)

```bash
# Set frontend variables
FRONTEND_APP_NAME="toast2host-frontend"

# Create Static Web App
az staticwebapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.apiKey" -o tsv)

echo "Deployment token: $DEPLOYMENT_TOKEN"
```

## Step 7: Build and Deploy Frontend

```bash
# From project root
cd /Users/jay/Projects/Toast2Host/mvp/apps/frontend

# Set environment variable for build
export NEXT_PUBLIC_STRAPI_URL=https://api.toast2host.net
export NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<your-google-maps-api-key>"

# Install dependencies and build
pnpm install
pnpm build

# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy to Static Web App
swa deploy \
  --app-location . \
  --output-location .next \
  --deployment-token $DEPLOYMENT_TOKEN
```

## Step 8: Configure Custom Domains

### Backend Custom Domain (api.toast2host.net)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname api.toast2host.net

# Create managed certificate (automatic SSL)
az webapp config ssl bind \
  --certificate-type ManagedCertificate \
  --webapp-name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname api.toast2host.net
```

**DNS Configuration Required:**
Add CNAME record in your DNS provider:
```
api.toast2host.net -> toast2host-backend.azurewebsites.net
```

### Frontend Custom Domain (app.toast2host.net)

```bash
# Add custom domain
az staticwebapp hostname set \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname app.toast2host.net
```

**DNS Configuration Required:**
Add CNAME record in your DNS provider:
```
app.toast2host.net -> <auto-generated-hostname>.azurestaticapps.net
```

Get the auto-generated hostname:
```bash
az staticwebapp show \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "defaultHostname" -o tsv
```

## Step 9: Update Google OAuth Configuration

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to APIs & Services → Credentials
2. Select your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://api.toast2host.net/api/connect/google/callback`
   - `https://app.toast2host.net/auth/callback`
4. Add authorized JavaScript origins:
   - `https://app.toast2host.net`

## Step 10: Verify Deployment

```bash
# Check backend status
az webapp show \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "state" -o tsv

# Check backend logs
az webapp log tail \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Test backend health
curl https://api.toast2host.net/_health

# Check frontend status
az staticwebapp show \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "status" -o tsv
```

## Environment Variables Reference

### Backend (.env)

```bash
# Database
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Strapi Secrets
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=<generated>
ADMIN_JWT_SECRET=<generated>
TRANSFER_TOKEN_SALT=<generated>
JWT_SECRET=<generated>

# Google OAuth
PROVIDER_GOOGLE_CLIENT_ID=<your-client-id>
PROVIDER_GOOGLE_CLIENT_SECRET=<your-client-secret>
PROVIDER_GOOGLE_REDIRECT_URI=https://api.toast2host.net/api/connect/google/callback

# Frontend URL
CLIENT_URL=https://app.toast2host.net

# App Settings
NODE_ENV=production
HOST=0.0.0.0
PORT=8080
CONSENT_REQUIRED=true
DAILY_CONNECT_CAP=10
```

### Frontend (.env.production)

```bash
NEXT_PUBLIC_STRAPI_URL=https://api.toast2host.net
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-api-key>
```

## Update/Redeploy

### Update Backend

```bash
cd apps/backend
pnpm build
zip -r backend-deploy.zip build/ node_modules/ package.json config/
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --src backend-deploy.zip
az webapp restart --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP
```

### Update Frontend

```bash
cd apps/frontend
export NEXT_PUBLIC_STRAPI_URL=https://api.toast2host.net
pnpm build
swa deploy --deployment-token $DEPLOYMENT_TOKEN
```

## Monitoring and Logs

### View Backend Logs (Real-time)

```bash
az webapp log tail \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### View Backend Logs (Filesystem)

```bash
az webapp log download \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --log-file logs.zip
```

### Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app $BACKEND_APP_NAME-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Get instrumentation key
APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app $BACKEND_APP_NAME-insights \
  --resource-group $RESOURCE_GROUP \
  --query "instrumentationKey" -o tsv)

# Configure backend to use Application Insights
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$APPINSIGHTS_KEY
```

## Scaling

### Scale Backend (App Service)

```bash
# Scale up (change tier)
az appservice plan update \
  --name $BACKEND_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B2

# Scale out (add instances)
az appservice plan update \
  --name $BACKEND_PLAN \
  --resource-group $RESOURCE_GROUP \
  --number-of-workers 2
```

### Scale Database

```bash
# Scale up database
az postgres flexible-server update \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku-name Standard_B2s

# Increase storage
az postgres flexible-server update \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --storage-size 64
```

## Backup and Recovery

### Database Backup

```bash
# Manual backup
az postgres flexible-server backup create \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --backup-name manual-backup-$(date +%Y%m%d)
```

### Export Database

```bash
# From local machine with pg_dump installed
pg_dump "postgresql://$DB_ADMIN_USER:$DB_ADMIN_PASSWORD@$DB_SERVER_NAME.postgres.database.azure.com:5432/$DB_NAME?sslmode=require" \
  > backup-$(date +%Y%m%d).sql
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
az webapp log tail --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP

# Check app settings
az webapp config appsettings list \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP

# SSH into container
az webapp ssh --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP
```

### Database connection issues

```bash
# Test database connectivity
az postgres flexible-server show \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP
```

### Frontend deployment issues

```bash
# Check Static Web App status
az staticwebapp show \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP

# View build logs (if using GitHub integration)
az staticwebapp show \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "buildProperties"
```

## Cost Optimization

### Current Configuration (~$26/month)

- **Frontend**: FREE (Static Web Apps Free tier)
- **Backend**: ~$13/month (B1 App Service Plan)
- **Database**: ~$13/month (B1ms PostgreSQL Flexible Server)

### Development/Testing (~$0-5/month)

```bash
# Use free tier backend
az appservice plan update --name $BACKEND_PLAN --sku F1

# Use smaller database
az postgres flexible-server update --sku-name Standard_B1ms
```

## Cleanup

To delete all resources:

```bash
# Delete resource group (deletes everything)
az group delete --name $RESOURCE_GROUP --yes --no-wait

# Or delete individual resources
az webapp delete --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP
az staticwebapp delete --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP
az postgres flexible-server delete --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP --yes
```

## Quick Reference Commands

```bash
# Resource group
export RESOURCE_GROUP="toast2host-prod"
export LOCATION="eastus"

# Database
export DB_SERVER_NAME="toast2host-db"
export DB_NAME="toast2host"

# Backend
export BACKEND_APP_NAME="toast2host-backend"
export BACKEND_PLAN="toast2host-backend-plan"

# Frontend
export FRONTEND_APP_NAME="toast2host-frontend"

# Quick status check
az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --query "state"
az staticwebapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP --query "status"
az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP --query "state"
```
