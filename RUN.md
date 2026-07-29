# How to Run Toast2Host Alumni Connect

This is a **pnpm workspace monorepo** (`apps/backend` = Strapi 5, `apps/frontend` = Vite + React + React Router). It is **not** Next.js — the frontend was migrated from Next.js to Vite; ignore any older docs/screenshots that say otherwise.

## Prerequisites

- Node.js ≥22, pnpm ≥9 (`"packageManager": "pnpm@9.0.0"` in the root `package.json`)
- **Always use `pnpm`, never `npm`, in this repo.** Running `npm install` anywhere creates a flat `node_modules` that conflicts with pnpm's structure and silently installs a second copy of React, which breaks the frontend with `Invalid hook call` errors and a blank page. If you ever see a `package-lock.json` appear, that's a sign `npm` was run by mistake — delete it and re-run `pnpm install`.

## Quick Start

### Step 1: Install dependencies (from the repo root)

```bash
pnpm install
```

### Step 2: Backend environment

`apps/backend/.env` must exist before starting Strapi. There is no `.env.example` checked in — create one with at least:

```bash
APP_KEYS=key1,key2
JWT_SECRET=<random string>
ADMIN_JWT_SECRET=<random string>
API_TOKEN_SALT=<random string>
TRANSFER_TOKEN_SALT=<random string>

# Google OAuth (see Step 4 — can be added after first boot too)
PROVIDER_GOOGLE_CLIENT_ID=
PROVIDER_GOOGLE_CLIENT_SECRET=
```

Everything else (`DATABASE_CLIENT`, `HOST`, `PORT`, `CONSENT_REQUIRED`, `DAILY_CONNECT_CAP`, ...) has a working default (see `config/*.ts`) and can be left unset for local dev — SQLite at `apps/backend/.tmp/data.db` is used automatically.

### Step 3: Frontend environment

`apps/frontend/.env` (plain `.env`, **not** `.env.local`) must exist before starting Vite, or the app throws on load and shows a blank page:

```bash
VITE_STRAPI_URL=http://localhost:1337
VITE_GOOGLE_MAPS_API_KEY=
```

`VITE_GOOGLE_MAPS_API_KEY` can stay blank — `LocationCombobox` degrades gracefully (logs a console warning, no autocomplete) rather than crashing. `VITE_STRAPI_URL` is required; its absence is a hard crash (`client.ts` throws at import time).

**Vite only reads `.env` at server startup** — if you edit it while `vite` is already running, restart the dev server for the change to take effect.

### Step 4: Start both servers

From the repo root:

```bash
pnpm dev                # both apps via turbo
# or individually:
pnpm dev:backend         # Strapi only
pnpm dev:frontend        # Vite only
```

- **Backend**: http://localhost:1337 (admin at `/admin`, GraphQL Playground at `/graphql`)
- **Frontend**: http://localhost:3000 (fixed in `apps/frontend/vite.config.ts`, **not** 5173)

First run: visit `/admin` and create your Strapi admin account.

### Step 5: Configure Google OAuth

Sign-in won't work until this is done — you'll otherwise see `{"error":{"message":"This provider is disabled"}}`.

**5a. Google Cloud Console** (https://console.cloud.google.com/)
1. Create/select a project → enable an identity API (Google+ API, or People API/Identity if that's retired in your project)
2. **OAuth consent screen**: External, add scopes `userinfo.email` + `userinfo.profile`; while in testing mode, add your own account under Test users
3. **Credentials → Create Credentials → OAuth client ID**, type **Web application**
4. Authorized redirect URI — this is the URL Google itself redirects to, which Strapi computes as `{server.url}/api/connect/{provider}/callback` regardless of what's in `config/plugins.ts`:
   ```
   http://localhost:1337/api/connect/google/callback
   ```
5. Copy the Client ID and Client Secret

**5b. Add credentials to `apps/backend/.env`:**
```bash
PROVIDER_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
PROVIDER_GOOGLE_CLIENT_SECRET=xxxx
```
Restart Strapi after editing.

**5c. Enable the provider in Strapi admin — this step is easy to miss and required every time, even with the env vars set:**

Strapi's users-permissions plugin stores each OAuth provider's `enabled`/key/secret/redirect fields in the database (`plugin_users-permissions_grant` core-store key) on first bootstrap, and **that database record always overrides `config/plugins.ts`** on every subsequent boot — `.env` alone will never flip it on.

1. Go to `/admin` → **Settings → Users & Permissions Plugin → Providers → Google**
2. Toggle **Enabled** on
3. Paste the Client ID + Client Secret
4. There are **two different redirect-URL concepts** on this screen, easy to conflate:
   - The URL to register with Google (informational) → `http://localhost:1337/api/connect/google/callback`
   - **"The redirect URL to your front-end app"** (editable) → this is where Strapi sends the browser, with `?access_token=...`, after finishing the OAuth handshake. It must point at the frontend route that actually handles it:
     ```
     http://localhost:3000/auth/callback
     ```
     Set this to anything else (e.g. it defaults to a placeholder value) and the browser lands somewhere with no matching frontend route, the access token is silently discarded, and sign-in appears to just bounce back to the login page.
5. Click **Save**

If Save fails with **"Missing or Invalid credentials"**, that's usually not about the Google credentials at all — it's a generic toast Strapi shows for a `401` on the save request, meaning your **admin session expired** (default admin JWT lifetime is short). Refresh `/admin`, log back in, and redo this step.

### Step 6: Seed reference data

**Universities** — the `universities` content type ships empty. Either:
- Seed the full dataset (~40k institutions, already prepared in `apps/backend/seeders/universities-seed-data.json`) directly into SQLite (fast, bypasses the API):
  ```bash
  cd apps/backend
  node seeders/seed-db-direct.js
  ```
- Or, for a single-institution pilot, insert just the one row you need directly (see `apps/backend/seeders/seed-db-direct.js` for the insert shape) and set it as the default in `OnboardingPage.tsx`'s form `defaultValues`.

(Note: the `pnpm seed:prepare` / `pnpm seed:import` scripts in `package.json` reference files that don't currently exist in `seeders/` — use `seed-db-direct.js` instead, or regenerate the missing scripts before relying on them.)

## Manual Testing

1. **Sign in**: http://localhost:3000/signin → Continue with Google
2. **Onboarding**: fill in University (autocomplete via GraphQL `universitiesUS`), Location (Google Places autocomplete, requires the Maps key), LinkedIn URL, Batch Year
3. **Search**: http://localhost:3000/search
4. **Connect**: request a connection from a profile card
5. **Profile / Settings**: http://localhost:3000/profile, http://localhost:3000/settings

## E2E Testing (Playwright)

```bash
npm run test:install   # one-time browser download
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Blank white page on http://localhost:3000 | Missing `apps/frontend/.env` (`VITE_STRAPI_URL` throws on import if unset) |
| `Invalid hook call` / React errors in console | Dependencies installed with `npm` instead of `pnpm` somewhere in the tree — delete `node_modules` (root + each app) and any stray `package-lock.json`, then `pnpm install` from the root |
| `Port 1337 (or 3000) is already in use` right after stopping the dev server | The Node child process sometimes outlives the shell wrapper on Windows — find it with `netstat -ano \| findstr :1337` (or `:3000`) and kill the PID directly, then restart |
| `This provider is disabled` on Google sign-in | Provider not enabled in Strapi admin — see Step 5c |
| OAuth completes but you land back on the sign-in page | The "redirect URL to your front-end app" in Strapi admin doesn't match `/auth/callback` exactly — see Step 5c |
| `Missing or Invalid credentials` saving provider settings in admin | Expired admin session, not bad OAuth credentials — refresh `/admin` and retry |
| University / Location dropdowns empty | `universities` table not seeded (Step 6), or `VITE_GOOGLE_MAPS_API_KEY` unset |
| GraphQL "Cannot query field X on type Y" | Regenerate types: `cd apps/frontend && pnpm codegen` |

## Tech Stack

- **Backend**: Strapi 5.41.x, Node ≥22, SQLite (dev) / PostgreSQL (prod), `@strapi/plugin-graphql`, `@strapi/plugin-users-permissions`, `@strapi/provider-email-nodemailer` (Brevo SMTP)
- **Frontend**: Vite 7, React 19, TypeScript 5.9, React Router 7
- **Styling**: Tailwind CSS v4
- **GraphQL client**: urql 5
- **Forms**: React Hook Form + Zod
- **Testing**: Playwright

## Further Reading

- [docs/BACKEND_SETUP.md](docs/BACKEND_SETUP.md)
- [docs/FRONTEND_SETUP.md](docs/FRONTEND_SETUP.md)
- [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)
- `specs/001-alumni-connect-mvp/spec.md`
