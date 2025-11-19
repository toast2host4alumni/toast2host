# Azure Deployment Guide (Infrastructure as Code)

This guide explains how to deploy Toast2Host to Azure using Bicep IaC and GitHub Actions.

## Architecture

```
┌─────────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Azure Static Web   │     │  App Service    │     │   Azure DB   │
│  Apps (Frontend)    │────▶│  (Backend)      │────▶│  PostgreSQL  │
│  Next.js + CDN      │     │  Strapi         │     │  Flexible    │
│  FREE tier          │     │  ~$13/month     │     │  ~$13/month  │
└─────────────────────┘     └─────────────────┘     └──────────────┘
```

**Total Cost**: ~$26/month (Frontend is FREE)

## Prerequisites

- Azure subscription
- GitHub repository
- Azure CLI installed (`az --version`)

## Step 1: Generate Secrets

Run these locally to generate required secrets:

```bash
# Generate random secrets
echo "DB_ADMIN_PASSWORD: $(openssl rand -base64 24)"
echo "JWT_SECRET: $(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET: $(openssl rand -base64 32)"
echo "API_TOKEN_SALT: $(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT: $(openssl rand -base64 32)"

# Generate 4 app keys (comma-separated)
echo "APP_KEYS: $(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
```

## Step 2: Create Azure Service Principal

```bash
# Login to Azure
az login

# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "t2h-github-actions" \
  --role contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID> \
  --sdk-auth
```

Copy the entire JSON output - this is your `AZURE_CREDENTIALS` secret.

## Step 3: Configure GitHub Secrets

Go to: Repository → Settings → Secrets and variables → Actions → Secrets

**Required Secrets:**
- `AZURE_CREDENTIALS` - Service principal JSON from Step 2
- `DB_ADMIN_PASSWORD` - Database password
- `JWT_SECRET` - Strapi JWT secret
- `ADMIN_JWT_SECRET` - Strapi admin JWT secret
- `APP_KEYS` - Strapi app keys (comma-separated)
- `API_TOKEN_SALT` - Strapi API token salt
- `TRANSFER_TOKEN_SALT` - Strapi transfer token salt
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Same as above (for frontend build)

## Step 4: Configure GitHub Variables

Go to: Repository → Settings → Secrets and variables → Actions → Variables

**Required Variables:**
- `AZURE_RESOURCE_GROUP` - e.g., `t2h-prod`
- `AZURE_LOCATION` - e.g., `eastus`
- `NEXT_PUBLIC_STRAPI_URL` - Will be set after first infrastructure deployment

## Step 5: Deploy Infrastructure

**Option A: Manual trigger**
1. Go to Actions tab
2. Select "Deploy Infrastructure"
3. Click "Run workflow"
4. Select environment (prod/staging/dev)

**Option B: Push to main**
```bash
git add infrastructure/
git commit -m "Add Azure infrastructure"
git push origin main
```

The workflow will:
1. Create resource group
2. Deploy PostgreSQL database
3. Deploy App Service for backend
4. Deploy Static Web App for frontend
5. Output the deployment URLs and token

## Step 6: Save Static Web App Token

After infrastructure deployment:
1. Check workflow output for the Static Web App deployment token
2. Add it as `AZURE_STATIC_WEB_APP_TOKEN` secret in GitHub

## Step 7: Update Variables

After infrastructure deployment, update:
- `NEXT_PUBLIC_STRAPI_URL` = `https://t2h-prod-backend.azurewebsites.net`

## Step 8: Deploy Applications

Push code changes to trigger deployments:

```bash
# Deploy backend
git add backend/
git commit -m "Deploy backend"
git push

# Deploy frontend
git add frontend/
git commit -m "Deploy frontend"
git push
```

Or trigger manually via Actions tab.

## Step 9: Configure Backend Startup

After first backend deployment, set startup command:

```bash
az webapp config set \
  --name t2h-prod-backend \
  --resource-group t2h-prod \
  --startup-file "cd backend && npm run start"
```

## Step 10: Update Google OAuth

In Google Cloud Console, add redirect URI:
```
https://t2h-prod-backend.azurewebsites.net/api/connect/google/callback
```

## Workflow Summary

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `deploy-infrastructure.yml` | Push to `infrastructure/` or manual | Creates/updates Azure resources |
| `deploy-backend.yml` | Push to `backend/` | Deploys Strapi to App Service |
| `deploy-frontend.yml` | Push to `frontend/` | Deploys Next.js to Static Web Apps |

## Environment Scaling

Modify `infrastructure/parameters.prod.json` to adjust:
- Database size (skuName, storageSizeGB)
- App Service tier (sku)
- Static Web App tier (sku)

For production traffic, consider:
```json
{
  "parameters": {
    "environment": { "value": "prod" }
  }
}
```

This automatically:
- Uses larger database (Standard_B2s)
- Uses higher App Service tier (B2)
- Uses Standard tier for Static Web Apps

## Monitoring

- **Backend Logs**: Azure Portal → App Service → Log stream
- **Frontend**: Azure Portal → Static Web App → Monitoring
- **Database**: Azure Portal → PostgreSQL → Metrics

## Troubleshooting

### Infrastructure deployment fails
- Check Azure credentials are valid
- Ensure subscription has quota for resources
- Verify resource group name is unique

### Backend won't start
- Check startup command is set
- Verify all environment variables are configured
- Review App Service logs

### Frontend 404 errors
- Check `staticwebapp.config.json` is deployed
- Verify navigation fallback is configured
- Ensure build output location is correct

### Database connection issues
- Firewall allows Azure services (0.0.0.0)
- Connection string uses SSL (`?sslmode=require`)
- Admin credentials are correct

## Custom Domains

### Frontend (Static Web Apps)
```bash
az staticwebapp hostname set \
  --name t2h-prod-frontend \
  --resource-group t2h-prod \
  --hostname www.yourdomain.com
```

### Backend (App Service)
```bash
az webapp config hostname add \
  --webapp-name t2h-prod-backend \
  --resource-group t2h-prod \
  --hostname api.yourdomain.com

az webapp config ssl bind \
  --certificate-type ManagedCertificate \
  --webapp-name t2h-prod-backend \
  --resource-group t2h-prod \
  --hostname api.yourdomain.com
```

## Cleanup

To delete all resources:
```bash
az group delete --name t2h-prod --yes --no-wait
```

## Files Structure

```
infrastructure/
  main.bicep                    # Main orchestrator
  parameters.prod.json          # Production parameters
  modules/
    postgresql.bicep            # Database module
    appservice.bicep            # Backend module
    staticwebapp.bicep          # Frontend module

.github/workflows/
  deploy-infrastructure.yml     # Infrastructure deployment
  deploy-backend.yml            # Backend deployment
  deploy-frontend.yml           # Frontend deployment

frontend/
  staticwebapp.config.json      # Static Web App configuration
```
