#!/bin/bash

# Azure CLI Profile Management
# Source this file in your .bashrc or .zshrc: source ~/Projects/Toast2Host/mvp/azure-profiles.sh

# Profile 1: Personal Account
azure-personal() {
    echo "Switching to Personal Azure Account..."
    az logout 2>/dev/null
    az login
    # Optionally set a specific subscription
    # az account set --subscription "Personal Subscription"
}

# Profile 2: Work Account
azure-work() {
    echo "Switching to Work Azure Account..."
    az logout 2>/dev/null
    az login --tenant "YOUR_WORK_TENANT_ID"
    # az account set --subscription "Work Subscription"
}

# Profile 3: Client Account
azure-client() {
    echo "Switching to Client Azure Account..."
    az logout 2>/dev/null
    az login --tenant "CLIENT_TENANT_ID"
    # az account set --subscription "Client Subscription"
}

# Show current account
azure-current() {
    echo "Current Azure Account:"
    az account show --output table
}

# List all available accounts
azure-list() {
    echo "Available Azure Accounts:"
    az account list --output table
}

# Quick switch between subscriptions (without re-login)
azure-switch() {
    if [ -z "$1" ]; then
        echo "Usage: azure-switch <subscription-name-or-id>"
        echo "Available subscriptions:"
        az account list --query "[].{Name:name, ID:id, State:state}" --output table
    else
        az account set --subscription "$1"
        echo "Switched to subscription: $1"
        az account show --output table
    fi
}