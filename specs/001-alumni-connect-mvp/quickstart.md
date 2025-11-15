# Quickstart: Toast2Host MVP — Alumni Connect

Date: 2025-11-02

## Prerequisites

- Node.js 18.x
- pnpm or yarn or npm
- PostgreSQL 14+ (for prod/stage). Local dev can use SQLite for Strapi.
- Google Cloud project with Places/Maps Geocoding API key
- (Optional) Email provider for notifications (deferred; in-app only for MVP)

## Environment Variables

Frontend (Next.js): `.env.local`

- `NEXT_PUBLIC_STRAPI_URL` = http://localhost:1337
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = <your-key>
- `NEXT_PUBLIC_UNIVERSITY_SCOPE` = US

Backend (Strapi): `.env`

- `DATABASE_CLIENT` = postgres | sqlite
- `DATABASE_URL` = postgres://user:pass@host:5432/dbname (if postgres)
- `CONSENT_REQUIRED` = true
- `DAILY_CONNECT_CAP` = 10
- `NOTIFICATIONS_EMAIL_ENABLED` = false
- `PROVIDER_GOOGLE_CLIENT_ID` = <your-google-client-id>
- `PROVIDER_GOOGLE_CLIENT_SECRET` = <your-google-client-secret>

## Local Development

1) Backend (Strapi)

```bash
cd backend
# If using Postgres, ensure DATABASE_URL is set; otherwise switch to SQLite in config
pnpm install  # or yarn / npm install
pnpm develop  # starts Strapi at http://localhost:1337
```

- Create a Strapi admin user
- Enable Google provider in Users & Permissions, set client ID/secret
- Enable GraphQL plugin in `backend/config/plugins.ts`
- Create content-types: UserProfile, Connection, ConnectionEvent, Subscription (per data-model.md)
- Create content-type: PrivacyRequest (deletion|export), and publish permissions for authenticated users to create requests

2) Frontend (Next.js)

```bash
cd frontend
pnpm install
pnpm dev  # starts Next.js at http://localhost:3000
```

- Verify Tailwind styles load
- Confirm theme (yellow primary) and fonts match https://toast2host.net/
- Configure GraphQL client (urql) in `src/lib/graphql/client.ts`
- Run GraphQL codegen to generate TS types: `pnpm codegen` (configured in `frontend/codegen.ts`)

## Smoke Test (Playwright)

- Onboard: Google sign-in → fill University, LinkedIn URL, Location → appear in search
- Search: Enter a city → results appear within 1.5s (target)
- Connect: Click Connect → pending request (consent=true) → approve from target → email revealed
- Privacy: In Settings, submit Data Export and Account Deletion requests → verify records appear in Strapi admin

## Notes

- If `NOTIFICATIONS_EMAIL_ENABLED=false`, approvals are in-app only
- Universities are US-only via Hipolabs; free-text fallback allowed and flagged
- City searches use 25-mile default radius; state/country searches use region scope

## Admin Fulfillment (MVP manual)

- Data export: In Strapi admin, fetch UserProfile + Connections for the user and provide JSON to the requester via support channel
- Account deletion: In Strapi admin, delete the user’s content (UserProfile, Connections/Events) and user account. Confirm completion to the requester
- Mark PrivacyRequest as completed with timestamp
