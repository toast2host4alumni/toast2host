#!/bin/bash

# Deploy WordPress on Azure App Service (Managed)
# Uses Azure's built-in WordPress template

set -e

RESOURCE_GROUP="toast2host-rg"
LOCATION="eastus"
WP_NAME="toast2host-wp"

echo "========================================="
echo "Azure WordPress on App Service"
echo "========================================="

# Create WordPress on App Service using az CLI
az webapp up \
  --name "$WP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku B1 \
  --runtime "PHP:8.2" \
  --os-type Linux

# Get URL
WP_URL=$(az webapp show \
  --name "$WP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostName" -o tsv)

echo ""
echo "========================================="
echo "WordPress URL: https://$WP_URL"
echo "========================================="
echo ""
echo "Next: Install WordPress from Azure Marketplace instead"
echo "Go to Azure Portal > Create Resource > WordPress on App Service"
echo "This includes managed MySQL database"
echo "========================================="
