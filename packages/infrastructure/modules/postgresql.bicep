@description('Name of the PostgreSQL server')
param serverName string

@description('Location for the server')
param location string = resourceGroup().location

@description('Administrator username')
param administratorLogin string

@description('Administrator password')
@secure()
param administratorPassword string

@description('Database name')
param databaseName string = 'strapi'

@description('SKU name for the server')
param skuName string = 'Standard_B1ms'

@description('SKU tier')
param skuTier string = 'Burstable'

@description('Storage size in GB')
param storageSizeGB int = 32

@description('PostgreSQL version')
param version string = '14'

@description('Tags to apply to resources')
param tags object = {}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: serverName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: version
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource firewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

@description('The fully qualified domain name of the server')
output fqdn string = postgresServer.properties.fullyQualifiedDomainName

@description('The connection string for the database')
output connectionString string = 'postgres://${administratorLogin}:${administratorPassword}@${postgresServer.properties.fullyQualifiedDomainName}/${databaseName}?sslmode=require'

@description('The server name')
output serverNameOutput string = postgresServer.name
