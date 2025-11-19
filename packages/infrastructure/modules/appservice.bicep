@description('Name of the App Service')
param appName string

@description('Location for the App Service')
param location string = resourceGroup().location

@description('Name of the App Service Plan')
param planName string

@description('SKU for the App Service Plan')
param sku string = 'B1'

@description('Node.js version')
param nodeVersion string = '18-lts'

@description('Application settings')
@secure()
param appSettings object = {}

@description('Tags to apply to resources')
param tags object = {}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: planName
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: sku
  }
  properties: {
    reserved: true
  }
}

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      alwaysOn: sku != 'F1'
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
    httpsOnly: true
  }
}

resource appServiceSettings 'Microsoft.Web/sites/config@2023-01-01' = {
  parent: appService
  name: 'appsettings'
  properties: appSettings
}

resource appServiceLogs 'Microsoft.Web/sites/config@2023-01-01' = {
  parent: appService
  name: 'logs'
  properties: {
    applicationLogs: {
      fileSystem: {
        level: 'Information'
      }
    }
    httpLogs: {
      fileSystem: {
        retentionInMb: 35
        retentionInDays: 7
        enabled: true
      }
    }
    detailedErrorMessages: {
      enabled: true
    }
  }
}

@description('The default hostname of the App Service')
output hostname string = appService.properties.defaultHostName

@description('The App Service resource ID')
output resourceId string = appService.id

@description('The App Service name')
output name string = appService.name
