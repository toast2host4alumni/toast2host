# Data Model: Toast2Host MVP — Alumni Connect

Date: 2025-11-02

## Overview

- Use Strapi v5 content-types. Leverage Strapi Users & Permissions for core user accounts
  (email, provider). Extend domain fields in a separate `UserProfile` content-type.
- All timestamps are ISO 8601 in UTC.

## Entities

### User (Strapi core)

- Provided by plugin `users-permissions.user` (email, provider, password hash/JWT).
- Used for authentication and as the canonical identity for relationships.

### UserProfile

- user (relation → users-permissions.user, one-to-one, required)
- name (string) — display name (optional; derive from Google if available)
- university_name (string, required)
- university_external_id (string, optional) — upstream API id
- linkedin_url (string, required) — format: https://linkedin.com/in/...
- location_text (string, required) — e.g., "San Jose, CA, USA"
- location_lat (number, optional)
- location_lng (number, optional)
- location_scope (enum: city|state|country, optional)
- batch_year (integer, optional, range [1900..2100])

Constraints & Indexes:
- Unique (user)
- Index (location_lat, location_lng)

### Connection

- actor_user (relation → users-permissions.user, required)
- target_user (relation → users-permissions.user, required)
- status (enum: pending|connected|rejected, required)
- created_at (datetime)
- updated_at (datetime)

Constraints & Indexes:
- Unique composite (actor_user, target_user)
- Index (actor_user, created_at)

State Transitions:
- pending → connected (on approval)
- pending → rejected (on decline)
- immediate connected when consent disabled (on request)

### ConnectionEvent

- connection (relation → Connection, required)
- actor_user (relation → users-permissions.user, required)
- target_user (relation → users-permissions.user, required)
- type (enum: requested|approved|rejected|revealed)
- created_at (datetime)
- context (string, optional) — origin, notes

### Subscription (Entitlement)

- user (relation → users-permissions.user, required)
- plan_tier (string, default: "free")
- source (enum: manual|usage_rule, default: manual)
- starts_at (datetime, default: now)
- ends_at (datetime, optional)
- active (boolean, default: true)

Notes:
- MVP: all users default to free; payments out-of-scope
- Tier → cap mapping configured via environment or Strapi config

### PrivacyRequest

- user (relation → users-permissions.user, required)
- type (enum: deletion|export, required)
- status (enum: open|completed, default: open)
- created_at (datetime)
- completed_at (datetime, optional)

Notes:
- MVP: fulfillment may be manual via Strapi admin
- Retain records for audit trail; do not log PII details in events

## Validation Rules

- linkedin_url must match a LinkedIn URL format
- batch_year must be 4-digit year within [1900..2100]
- Connection unique per (actor_user, target_user)
- Prevent self-connections (actor_user != target_user)

## Derived Views

- Search Results View: join UserProfile and Connection to compute `isConnected` for the current actor
- Connection Metrics: aggregate ConnectionEvent by day for dashboards
