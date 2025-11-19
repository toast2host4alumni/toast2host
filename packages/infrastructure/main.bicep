targetScope = 'resourceGroup'

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Base name for resources')
param baseName string = 't2h'

@description('Location for resources')
param location string = resourceGroup().location

@description('PostgreSQL administrator username')
param dbAdminUsername string = 'strapiuser'

@description('PostgreSQL administrator password')
@secure()
param dbAdminPassword string

@description('Strapi JWT secret')
@secure()
param jwtSecret string

@description('Strapi admin JWT secret')
@secure()
param adminJwtSecret string

@description('Strapi app keys (comma-separated)')
@secure()
param appKeys string

@description('Strapi API token salt')
@secure()
param apiTokenSalt string

@description('Strapi transfer token salt')
@secure()
param transferTokenSalt string

@description('Google OAuth Client ID')
param googleClientId string

@description('Google OAuth Client Secret')
@secure()
param googleClientSecret string

@description('Google Maps API Key')
@secure()
param googleMapsApiKey string

@description('Daily connection cap')
param dailyConnectCap int = 10

@description('Require consent for connections')
param consentRequired bool = true

@description('GitHub repository URL for Static Web App')
param repositoryUrl string = ''

var resourceBaseName = '${baseName}-${environment}'
var tags = {
  environment: environment
  project: 'toast2host'
  managedBy: 'bicep'
}

// PostgreSQL Database
module database 'modules/postgresql.bicep' = {
  name: 'database-deployment'
  params: {
    serverName: '${resourceBaseName}-db'
    location: location
    administratorLogin: dbAdminUsername
    administratorPassword: dbAdminPassword
    databaseName: 'strapi'
    skuName: environment == 'prod' ? 'Standard_B2s' : 'Standard_B1ms'
    skuTier: 'Burstable'
    storageSizeGB: environment == 'prod' ? 64 : 32
    tags: tags
  }
}

// Backend App Service (Strapi)
module backend 'modules/appservice.bicep' = {
  name: 'backend-deployment'
  params: {
    appName: '${resourceBaseName}-backend'
    planName: '${resourceBaseName}-plan'
    location: location
    sku: environment == 'prod' ? 'B2' : 'B1'
    nodeVersion: '18-lts'
    appSettings: {
      NODE_ENV: 'production'
      DATABASE_CLIENT: 'postgres'
      DATABASE_URL: database.outputs.connectionString
      JWT_SECRET: jwtSecret
      ADMIN_JWT_SECRET: adminJwtSecret
      APP_KEYS: appKeys
      API_TOKEN_SALT: apiTokenSalt
      TRANSFER_TOKEN_SALT: transferTokenSalt
      PROVIDER_GOOGLE_CLIENT_ID: googleClientId
      PROVIDER_GOOGLE_CLIENT_SECRET: googleClientSecret
      CONSENT_REQUIRED: string(consentRequired)
      DAILY_CONNECT_CAP: string(dailyConnectCap)
      WEBSITE_NODE_DEFAULT_VERSION: '18-lts'
    }
    tags: tags
  }
  dependsOn: [
    database
  ]
}

// Frontend Static Web App
module frontend 'modules/staticwebapp.bicep' = {
  name: 'frontend-deployment'
  params: {
    appName: '${resourceBaseName}-frontend'
    location: location
    sku: environment == 'prod' ? 'Standard' : 'Free'
    repositoryUrl: repositoryUrl
    branch: 'main'
    appLocation: 'apps/frontend'
    outputLocation: '.next'
    tags: tags
  }
}

// Outputs
output backendUrl string = 'https://${backend.outputs.hostname}'
output frontendUrl string = 'https://${frontend.outputs.hostname}'
output databaseFqdn string = database.outputs.fqdn
output staticWebAppDeploymentToken string = frontend.outputs.deploymentToken
output backendAppName string = backend.outputs.name
output frontendAppName string = frontend.outputs.name
