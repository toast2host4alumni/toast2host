# Backend Setup Guide

Complete setup instructions for the Toast2Host backend application (Strapi 5 + `@strapi/plugin-graphql`).

## Prerequisites

- **Node.js**: ≥22.0.0
- **pnpm**: ≥9.0.0 — **use pnpm, not npm.** This is a pnpm workspace (see root `pnpm-workspace.yaml` / `pnpm-lock.yaml`); running `npm install` anywhere in the tree creates a flat, differently-deduped `node_modules` that will install a second copy of shared dependencies (React, in the frontend's case) alongside pnpm's. If you ever see an untracked `package-lock.json` show up, that's the sign — delete it and `node_modules`, then reinstall with `pnpm install` from the repo root.
- **Database**: SQLite (default, local) or PostgreSQL (production)
- **Google OAuth Credentials**: required for sign-in to work at all

## Installation

### 1. Install Dependencies

From the **project root**:

```bash
pnpm install
```

This installs dependencies for every app in the monorepo, including the backend.

### 2. Configure Environment Variables

There is **no `.env.example` checked into the repo**. Create `apps/backend/.env` yourself with at least:

```bash
# Strapi core secrets (required — no working defaults)
APP_KEYS=key1,key2
JWT_SECRET=generate-random-secret
ADMIN_JWT_SECRET=generate-random-secret
API_TOKEN_SALT=generate-random-salt
TRANSFER_TOKEN_SALT=generate-random-salt

# Google OAuth (required for sign-in — see section 3 below)
PROVIDER_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
PROVIDER_GOOGLE_CLIENT_SECRET=your-client-secret
```

Everything else below has a working default read via `env()` in `config/*.ts`, so it's safe to leave unset for local dev:

```bash
# config/server.ts
HOST=0.0.0.0                 # default: 0.0.0.0
PORT=1337                    # default: 1337
PUBLIC_URL=http://localhost:1337

# config/database.ts
DATABASE_CLIENT=sqlite       # default: sqlite. Set to "postgres" for prod.
# DATABASE_URL=postgresql://user:pass@host:5432/toast2host   (only read if DATABASE_CLIENT=postgres)
# SQLITE_FILENAME=.tmp/data.db

# config/custom.ts (app-level settings, all optional)
CONSENT_REQUIRED=true
DAILY_CONNECT_CAP=10
NOTIFICATIONS_EMAIL_ENABLED=false   # currently defined but not read anywhere that gates email sending — see EMAIL_SETUP.md

# Email (see EMAIL_SETUP.md for the full picture)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net   # used to build links inside notification emails
```

**Generate secure secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Note:** `CORS` origins for the frontend are **hardcoded** in `config/middlewares.ts` (currently `http://localhost:3000`, `http://localhost:1337`, `https://app.toast2host.net`) — there is no `CLIENT_URL` env var read anywhere in this codebase despite what older docs may say. If you serve the frontend from a different origin, edit `config/middlewares.ts` directly.

### 3. Configure Google OAuth

This is a two-part setup — Google Cloud Console **and** Strapi admin — and both parts are required. Skipping the admin part is the single most common way to get stuck (you'll see `"This provider is disabled"` on sign-in even with correct `.env` values).

#### 3a. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/), create/select a project
2. Enable Google+ API (or People/Identity API if that's what's offered for your project)
3. **OAuth consent screen**: External type, add scopes `userinfo.email` + `userinfo.profile`; add your own account under Test users while the app is in testing mode
4. **Credentials → Create Credentials → OAuth 2.0 Client ID** → Web application
5. Authorized redirect URI — this must be exactly what Strapi will send Google, which it computes internally as `{server.url}/api/connect/{provider}/callback` (see `providers.js`'s `buildRedirectUri`) — **not** whatever `redirectUri`/`PROVIDER_GOOGLE_CALLBACK` you might set in `config/plugins.ts` (that field is not actually consulted for the value sent to Google):
   ```
   Local:      http://localhost:1337/api/connect/google/callback
   Production: https://your-domain.com/api/connect/google/callback
   ```
6. Copy the Client ID and Client Secret into `apps/backend/.env` (section 2 above), then restart Strapi

#### 3b. Enable the provider in Strapi Admin (required, not optional)

Strapi's users-permissions plugin persists each provider's `enabled`/key/secret/callback fields to the database (core-store key `plugin_users-permissions_grant`) the first time it boots, and **that stored record takes precedence over `config/plugins.ts` on every subsequent boot** — changing `.env` or the config file after that point has no effect on whether the provider is enabled.

1. `/admin` → **Settings → Users & Permissions Plugin → Providers → Google**
2. Toggle **Enabled**
3. Paste Client ID + Client Secret
4. Fill in **"The redirect URL to your front-end app"** — this is a *different* URL from the one registered with Google. It's where Strapi sends the browser (with `?access_token=...`) after finishing the OAuth handshake, and must match a route your frontend actually handles (in this app, `AuthCallbackPage` at `/auth/callback`):
   ```
   http://localhost:3000/auth/callback
   ```
5. **Save**

If Save fails with `"Missing or Invalid credentials"`, that's Strapi's generic error for a `401` on the save request — your admin session has expired, not your OAuth credentials. Refresh `/admin`, log back in, and retry.

### 4. Database

On first run, Strapi auto-creates the SQLite DB at `apps/backend/.tmp/data.db` and runs migrations — nothing to do manually for local dev.

For PostgreSQL:
```bash
psql -U postgres -c "CREATE DATABASE toast2host;"
```
```bash
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://username:password@localhost:5432/toast2host
```

### 5. Seed Reference Data

The `university` content type ships **empty**. The frontend's University combobox (`universitiesUS` GraphQL query) has nothing to show until it's seeded.

The fastest path — the full ~40k-institution dataset is already prepared in `apps/backend/seeders/universities-seed-data.json` — is a direct SQLite insert (bypasses the API, much faster than round-tripping through Strapi):

```bash
cd apps/backend
node seeders/seed-db-direct.js
```

This deletes any existing rows in `universities` and bulk-inserts from the JSON file.

> **Note:** the `pnpm seed:prepare` and `pnpm seed:import` scripts defined in `package.json` reference files (`create-combined-seed.js`, `import-universities.js`) that don't currently exist in `seeders/` — only `seed-db-direct.js`, `seed-global-universities.js`, `seed-universities.ts`, `seed-users-and-connections.js`, and `import-universities.ts` exist. Fix the `package.json` script paths or use the working scripts directly.
>
> For a single-institution pilot, insert just one row instead of the full dataset (same INSERT shape as `seed-db-direct.js`), and set it as the default value in the frontend onboarding form.

## Running the Application

### Development Mode

From the **project root**:

```bash
pnpm dev              # both frontend and backend via turbo
pnpm dev:backend      # backend only
```

Or from `apps/backend` directly:

```bash
cd apps/backend
pnpm dev        # alias for `strapi develop`
```

- **API**: http://localhost:1337
- **Admin Panel**: http://localhost:1337/admin
- **GraphQL Playground**: http://localhost:1337/graphql

First launch: visit `/admin` and create your admin account.

### Production Mode

```bash
cd apps/backend
pnpm build
pnpm start
```

### Clean Build Cache

```bash
cd apps/backend
pnpm clean   # removes .cache, build, .tmp
pnpm build
```

## Project Structure

```
apps/backend/
├── config/
│   ├── database.ts             # DATABASE_CLIENT / DATABASE_URL
│   ├── server.ts                # HOST / PORT / APP_KEYS
│   ├── admin.ts                  # ADMIN_JWT_SECRET / ADMIN_API_TOKEN_SALT
│   ├── plugins.ts               # graphql, users-permissions (Google provider), email (Brevo/nodemailer)
│   ├── middlewares.ts           # CORS origins are hardcoded here
│   └── custom.ts                # CONSENT_REQUIRED / DAILY_CONNECT_CAP / NOTIFICATIONS_EMAIL_ENABLED
├── src/
│   ├── api/                     # Content types (auto-generated REST routes)
│   │   ├── connection/
│   │   ├── connection-event/
│   │   ├── health/
│   │   ├── metrics/
│   │   ├── privacy-request/
│   │   ├── subscription/
│   │   ├── university/
│   │   └── user-profile/
│   ├── extensions/graphql/
│   │   ├── config/schema.ts     # extend type Query/Mutation — see "GraphQL API" below
│   │   └── resolvers/
│   │       ├── me.ts            # currentUser
│   │       ├── profile.ts       # updateMyProfile
│   │       ├── universities.ts  # universitiesUS
│   │       ├── search.ts        # searchUsers
│   │       ├── connection.ts    # requestConnection / acceptConnection / denyConnection, sends emails
│   │       └── privacy.ts       # submitPrivacyRequest / myPrivacyRequests
│   ├── utils/
│   │   ├── email-service.ts     # sendConnectionRequestEmail / sendConnectionApprovedEmail
│   │   ├── email-templates/     # connection-request.html, connection-approved.html
│   │   └── location.ts          # Haversine distance calc for search
│   └── middlewares/request-id.ts
├── seeders/                      # university seed data + scripts (see Step 5 above)
└── .env
```

## Database Schema (actual field names)

**user-profile** (`api::user-profile.user-profile`)
`user, first_name, last_name, profile_photo_url, university_name, university_external_id, linkedin_url, location_text, location_lat, location_lng, location_scope, batch_year, onboarding_completed, host_mode, phone_number, profile_visibility`

**connection** (`api::connection.connection`)
`actor_user, target_user, status`

**connection-event** (`api::connection-event.connection-event`)
`connection, actor_user, target_user, type, context`

**subscription** (`api::subscription.subscription`)
`user, plan_tier, source, starts_at, ends_at, active`

**privacy-request** (`api::privacy-request.privacy-request`)
`user, type, status, completed_at`

**university** (`api::university.university`)
`name, country, state_province, alpha_two_code, web_pages, domains, external_id`

### Accessing the Database

**SQLite** (local):
```bash
sqlite3 apps/backend/.tmp/data.db
.tables
```

**PostgreSQL** (production):
```bash
psql $DATABASE_URL
\dt
```

## GraphQL API

Schema extensions live in `src/extensions/graphql/config/schema.ts`. Test at http://localhost:1337/graphql.

### Queries

```graphql
query {
  currentUser {
    id
    email
    profile { id first_name last_name university_name onboarding_completed }
  }

  universitiesUS(q: "Institute") {
    name
    state
    country
    external_id
  }

  searchUsers(
    location: "Boston, MA"
    lat: 42.3601
    lng: -71.0589
    scope: city
    university: "MIT"
    batch_year: 2020
    sort: proximity
    connected_only: false
    hosts_only: false
    page: 1
    pageSize: 20
  ) {
    userId
    name
    university
    location
    connectionStatus
    proximityMiles
  }

  myPendingConnections { id status createdAt requester { userId name university } }
  myOutgoingPendingConnections { id status createdAt targetUser { userId name } }
  myConnections { userId name university connectedAt }
  myPrivacyRequests { id type status createdAt completedAt }
}
```

### Mutations

```graphql
mutation {
  updateMyProfile(input: {
    first_name: "Jane"
    university_name: "MIT"
    batch_year: 2020
    location_text: "Boston, MA"
    location_lat: 42.3601
    location_lng: -71.0589
    onboarding_completed: true
  }) {
    profile { id first_name university_name onboarding_completed }
  }

  requestConnection(targetUserId: "123") { id status }
  acceptConnection(id: "456") { id status }
  denyConnection(id: "456") { id status }
  submitPrivacyRequest(type: export) { id type status }
}
```

Authenticated requests need a `Authorization: Bearer <jwt>` header — every custom query/mutation above requires a valid authenticated context (`strapi.auth.verify` is applied uniformly by the GraphQL plugin's resolver wrapper); there's no separate per-action permission toggle to configure for these.

## Custom Resolver Notes

- **`search.ts`** — location-based search; city-scope matches use a 25-mile haversine radius (`src/utils/location.ts`)
- **`connection.ts`** — enforces `DAILY_CONNECT_CAP`; also fires `sendConnectionRequestEmail` / `sendConnectionApprovedEmail` (best-effort, errors are swallowed so a broken email provider never fails the underlying connection action)
- **`universities.ts`** — simple `$containsi` filter over the `university` content type; returns `[]` on any DB error rather than throwing

## Common Issues

### Port Already in Use

```bash
lsof -ti:1337 | xargs kill -9        # macOS/Linux
```
On Windows, the Strapi child process can outlive the terminal/task that started it (observed when stopping and restarting the dev server in quick succession): `netstat -ano | findstr :1337` to find the PID, then `taskkill /PID <pid> /F`.

### Database Connection Error (PostgreSQL)

1. Ensure PostgreSQL is running
2. Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
3. `psql -U postgres -c "\l"` to confirm the database exists

### Admin Panel Issues

- **403 on `/admin`**: clear cookies/cache, `pnpm clean && pnpm build`, confirm `ADMIN_JWT_SECRET` is set
- **"Missing or Invalid credentials" saving anything in Settings**: this is almost always an expired admin session (401), not bad input — refresh and log back in

### GraphQL Plugin Not Working

- Confirm `@strapi/plugin-graphql` is installed and listed in `config/plugins.ts`
- `pnpm clean && pnpm build`

### Google OAuth Fails

See section 3 in full above. In short:
1. `"This provider is disabled"` → not enabled in Strapi admin (section 3b) — env vars alone are not enough
2. OAuth completes but you land back on the sign-in page → the admin's "redirect URL to your front-end app" doesn't match `/auth/callback` exactly
3. `"Missing or Invalid credentials"` saving the provider form → expired admin session
4. Always double check the redirect URI registered with Google is `{server.url}/api/connect/google/callback` — this is computed by Strapi and is not configurable via `config/plugins.ts`

### npm/pnpm Mismatch (duplicate React, `Invalid hook call`)

If `npm install` was ever run instead of `pnpm install` anywhere in this tree, you'll end up with two copies of React and the frontend will throw `Invalid hook call` and render a blank page. Fix:
```bash
rm -rf node_modules apps/frontend/node_modules apps/backend/node_modules package-lock.json
pnpm install
```
A leftover `.package-lock.json` file inside any `node_modules` folder (vs. pnpm's `.modules.yaml` marker) is the tell.

### TypeScript Compilation Errors

```bash
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_CLIENT` | No | `sqlite` | `sqlite` or `postgres` |
| `DATABASE_URL` | If postgres | — | Connection string |
| `SQLITE_FILENAME` | No | `.tmp/data.db` | SQLite file path |
| `HOST` | No | `0.0.0.0` | Server host |
| `PORT` | No | `1337` | Server port |
| `APP_KEYS` | Yes | — | Comma-separated Strapi session keys |
| `JWT_SECRET` | Yes | — | Users-permissions JWT secret |
| `ADMIN_JWT_SECRET` | Yes | `dev-admin-jwt-secret` (insecure) | Admin panel JWT secret |
| `ADMIN_API_TOKEN_SALT` | Yes | `dev-admin-api-salt` (insecure) | Admin API token salt |
| `API_TOKEN_SALT` | Yes | — | API token salt |
| `TRANSFER_TOKEN_SALT` | Yes | — | Data transfer token salt |
| `PROVIDER_GOOGLE_CLIENT_ID` | Yes | — | OAuth client ID |
| `PROVIDER_GOOGLE_CLIENT_SECRET` | Yes | — | OAuth secret |
| `CONSENT_REQUIRED` | No | `true` | Require approval for connections |
| `DAILY_CONNECT_CAP` | No | `10` | Max connections/day |
| `NOTIFICATIONS_EMAIL_ENABLED` | No | `false` | Defined in `config/custom.ts` but not currently read anywhere to gate email sending — treat as reserved, not functional |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` | For email | `smtp-relay.brevo.com` / `587` / — / — | Nodemailer/Brevo SMTP credentials — see `EMAIL_SETUP.md` |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` | No | `noreply@toast2host.net` / `support@toast2host.net` | Sender addresses |
| `FRONTEND_URL` | No | `https://app.toast2host.net` | Used to build links inside notification emails |

There is **no `CLIENT_URL` variable read anywhere in this codebase** — CORS origins are hardcoded in `config/middlewares.ts`.

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` / `pnpm develop` | Start dev server (port 1337) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm clean` | Remove `.cache`, `build`, `.tmp` |
| `node seeders/seed-db-direct.js` | Seed `universities` table directly from `seeders/universities-seed-data.json` |

## Next Steps

1. Create your admin account at `/admin`
2. Configure Google OAuth (both the Cloud Console side **and** the Strapi admin side — section 3)
3. Seed universities (section 5) if the pilot needs more than one institution
4. Test the GraphQL API at `/graphql`
5. Set up email if connection-request notifications matter for your pilot — see `EMAIL_SETUP.md`

## Additional Resources

- [Strapi Documentation](https://docs.strapi.io/)
- [Strapi GraphQL Plugin](https://docs.strapi.io/dev-docs/plugins/graphql)
- [Frontend Setup Guide](./FRONTEND_SETUP.md)
- [Email Setup Guide](./EMAIL_SETUP.md)
- [Azure Deployment Guide](./AZURE_DEPLOYMENT.md)
