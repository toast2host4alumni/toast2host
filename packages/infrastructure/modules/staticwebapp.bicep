@description('Name of the Static Web App')
param appName string

@description('Location for the Static Web App')
param location string = resourceGroup().location

@description('SKU for the Static Web App')
@allowed(['Free', 'Standard'])
param sku string = 'Free'

@description('GitHub repository URL')
param repositoryUrl string = ''

@description('GitHub branch')
param branch string = 'main'

@description('App location in repository')
param appLocation string = 'apps/frontend'

@description('Output location for build')
param outputLocation string = '.next'

@description('Tags to apply to resources')
param tags object = {}

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: appName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    repositoryUrl: repositoryUrl != '' ? repositoryUrl : null
    branch: repositoryUrl != '' ? branch : null
    buildProperties: {
      appLocation: appLocation
      outputLocation: outputLocation
      appBuildCommand: 'npm run build'
    }
  }
}

@description('The default hostname of the Static Web App')
output hostname string = staticWebApp.properties.defaultHostname

@description('The Static Web App resource ID')
output resourceId string = staticWebApp.id

@description('The Static Web App name')
output name string = staticWebApp.name

@description('The deployment token for CI/CD')
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
