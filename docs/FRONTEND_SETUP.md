# Frontend Setup Guide

Complete setup instructions for the Toast2Host frontend (**Vite + React 19 + React Router 7** — this was migrated off Next.js; there is no Next.js in this app anymore).

## Prerequisites

- **Node.js**: ≥22.0.0
- **pnpm**: ≥9.0.0 — use pnpm, not npm (see the note in [BACKEND_SETUP.md](./BACKEND_SETUP.md#prerequisites); running `npm install` anywhere in this workspace installs a second, conflicting copy of React and breaks the app with `Invalid hook call` errors)
- **Backend**: running Strapi backend (see [BACKEND_SETUP.md](./BACKEND_SETUP.md))
- **Google Maps API Key**: only needed if you want live location autocomplete; the app degrades gracefully without one

## Installation

### 1. Install Dependencies

From the **project root**:

```bash
pnpm install
```

### 2. Configure Environment Variables

Create `apps/frontend/.env` (a plain `.env` file — there is no `.env.local.example`, and Vite's `.env.local` convention is not what this app uses):

```bash
VITE_STRAPI_URL=http://localhost:1337

# Optional — Places/Geocoding/Maps JavaScript autocomplete in LocationCombobox.
# Enable all three APIs in the same Google Cloud project used for OAuth.
# If left blank, the component just logs a console warning and the location
# field falls back to a plain text input — it does not crash the app.
VITE_GOOGLE_MAPS_API_KEY=
```

`VITE_STRAPI_URL` is **required** — `src/lib/graphql/client.ts` throws at import time if it's unset, which crashes the whole app before it mounts (blank page, no error shown on screen — check the browser console).

**Vite only reads `.env` at server startup.** If you edit it while `pnpm dev` is already running, stop and restart the dev server — a hot-reload alone won't pick up the change.

There is currently no `VITE_UNIVERSITY_SCOPE` variable read anywhere in the frontend source, despite older docs mentioning one.

### 3. Generate GraphQL Types (Optional)

```bash
cd apps/frontend
pnpm codegen
```

This reads `codegen.ts` and writes generated types to **`src/lib/graphql/generated.ts`** (not `src/gql/`). Note: `codegen.ts` reads `process.env.VITE_STRAPI_URL` directly (there's no dotenv loading in that script), so it won't pick up `apps/frontend/.env` automatically — export the variable in your shell first if the default doesn't match your backend URL:

```bash
VITE_STRAPI_URL=http://localhost:1337 pnpm codegen
```

## Running the Application

### Development Mode

From the **project root**:

```bash
pnpm dev              # both frontend and backend via turbo
pnpm dev:frontend      # frontend only
```

Or from `apps/frontend` directly:

```bash
cd apps/frontend
pnpm dev
```

**The frontend runs at http://localhost:3000** — fixed via `server.port` in `vite.config.ts`. It is not the Vite default of 5173.

### Production Build

```bash
pnpm build:frontend            # from project root
# or
cd apps/frontend && pnpm build
```

```bash
pnpm preview   # preview the production build
```

## Project Structure

```
apps/frontend/
├── src/
│   ├── components/           # Reusable UI (AuthGuard, Header, Footer, *Combobox, ui/*)
│   ├── pages/                 # Route components
│   ├── lib/
│   │   ├── auth.ts            # sessionStorage token helpers
│   │   ├── utils.ts
│   │   ├── validation/        # Zod schemas (react-hook-form resolvers)
│   │   └── graphql/
│   │       ├── client.ts       # urql client — throws if VITE_STRAPI_URL is unset
│   │       ├── operations.ts   # query/mutation functions (getMe, updateMyProfile, ...)
│   │       └── generated.ts    # output of `pnpm codegen`
│   ├── hooks/                 # useCurrentUser, useSearch, ...
│   └── App.tsx                # React Router route table
├── public/
├── .env                       # not committed — see step 2 above
└── vite.config.ts             # port 3000, PWA/compression/svgr plugins
```

## Key Features

### Authentication

Google OAuth is handled by the Strapi backend; the frontend just kicks off and completes the redirect dance.

**Token storage**: the JWT is stored in **`sessionStorage`** under the key `t2h_token` (`src/lib/auth.ts`) — **not** `localStorage`. It does not persist across browser restarts or across tabs by design.

**Sign-in flow** (`SignInPage.tsx` → `AuthCallbackPage.tsx`):
1. User clicks "Continue with Google" → browser navigates to `${VITE_STRAPI_URL}/api/connect/google` (no `callback` query param is passed)
2. Google → Strapi's own callback (`/api/connect/google/callback`) → Strapi redirects the browser to whatever's configured as **"the redirect URL to your front-end app"** in Strapi admin (Settings → Users & Permissions → Providers → Google), which must be:
   ```
   http://localhost:3000/auth/callback
   ```
   with `?access_token=...` appended. If that admin field is misconfigured, the browser lands somewhere with no matching route, React Router's catch-all redirects to `/`, and the token is silently discarded — sign-in will appear to just bounce back to the login page.
3. `AuthCallbackPage` reads `access_token` from the URL, calls `${VITE_STRAPI_URL}/api/auth/google/callback?access_token=...` to exchange it for a Strapi JWT, stores it via `setAuthToken`, then navigates to `/search` (or the user completes onboarding first via `AuthGuard`'s `requireOnboarding` check).

**Dev-mode gotcha:** `main.tsx` wraps the app in `<StrictMode>`, which deliberately double-invokes effects on mount in development. `AuthCallbackPage`'s effect is guarded with a `useRef` flag (`hasRun`) specifically to prevent the token-exchange logic from firing twice and racing itself — if you ever see the callback intermittently bounce back to `/signin` right after a real login, check that guard is still in place before assuming it's a backend problem.

### GraphQL Client

Uses **urql**, configured in `src/lib/graphql/client.ts`:

```typescript
import { createClient, cacheExchange, fetchExchange } from 'urql'
import { getAuthToken } from '@/lib/auth'

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL
if (!STRAPI_URL) throw new Error('VITE_STRAPI_URL is not defined')

export const graphqlClient = createClient({
  url: `${STRAPI_URL}/graphql`,
  exchanges: [cacheExchange, fetchExchange],
  requestPolicy: 'cache-first',
  fetchOptions: () => {
    const token = getAuthToken()
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  },
})
```

`fetchOptions` is a function, so the token is read fresh from `sessionStorage` on every request — no stale-closure risk there.

### Routes (`src/App.tsx`)

| Route | Page | Notes |
|-------|------|-------|
| `/` | `HomePage` | |
| `/signin` | `SignInPage` | |
| `/auth/callback` | `AuthCallbackPage` | must match the Strapi admin "front-end redirect URL" exactly |
| `/onboarding` | `OnboardingPage` | `AuthGuard requireOnboarding={false}` |
| `/search` | `SearchPage` | `AuthGuard` (default `requireOnboarding={true}`) |
| `/profile` | `ProfilePage` | |
| `/connections` | `RequestsPage` | (not `/requests`) |
| `/settings` | `SettingsPage` | |
| `/legal/terms`, `/legal/privacy` | static pages | |
| `*` | redirects to `/` | catch-all — lands here if you navigate to an undefined route, e.g. a misconfigured OAuth redirect URL |

### AuthGuard (`src/components/AuthGuard.tsx`)

Wraps a page, not a route. Checks `isAuthenticated()` (sessionStorage) and, unless `requireOnboarding={false}`, also checks `useCurrentUser()`'s `profile.onboarding_completed`:
- Not authenticated → redirect to `/signin`
- Authenticated but not onboarded (and `requireOnboarding` true) → redirect to `/onboarding`

## Development Workflow

### Adding a New Feature

1. Add the query/mutation function in `src/lib/graphql/operations.ts` (calls `graphqlClient`)
2. `pnpm codegen` if you need generated types
3. Build the component in `src/components/`
4. Add the route in `src/App.tsx`
5. Test in the browser

### Form Validation

React Hook Form + Zod, e.g. `src/lib/validation/profile.ts` (`onboardingSchema`):

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const { register, handleSubmit } = useForm({
  resolver: zodResolver(onboardingSchema),
})
```

### Styling

Tailwind CSS v4 + shadcn/ui-style components on Radix primitives (`src/components/ui/`).

## Common Issues

### Blank page on load

Check the browser console first. If you see `VITE_STRAPI_URL is not defined`, create/fix `apps/frontend/.env` and restart the dev server (see step 2).

### `Invalid hook call` / duplicate React

Someone ran `npm install` instead of `pnpm install` somewhere in the workspace. Fix:
```bash
rm -rf node_modules apps/frontend/node_modules apps/backend/node_modules package-lock.json
pnpm install
```

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```
Note the port is fixed to 3000 in `vite.config.ts`; if you deliberately want a different port, edit `server.port` there.

### GraphQL Connection Error

1. Confirm the backend is running: `pnpm dev:backend`
2. Confirm `VITE_STRAPI_URL` in `apps/frontend/.env`
3. Hit http://localhost:1337/graphql directly to confirm the backend's GraphQL endpoint responds

### Google Sign-In Shows "This provider is disabled"

This is a backend-side config issue, not a frontend bug — see [BACKEND_SETUP.md](./BACKEND_SETUP.md#3-configure-google-oauth). In short: the provider must be explicitly enabled in Strapi admin (Settings → Users & Permissions → Providers → Google), not just configured via `.env`.

### Sign-in completes but bounces back to `/signin`

Almost always the Strapi admin's "redirect URL to your front-end app" not matching `http://localhost:3000/auth/callback` exactly. See the Authentication section above.

### University / Location dropdowns empty

- University: the backend `universities` table is likely unseeded — see [BACKEND_SETUP.md](./BACKEND_SETUP.md#5-seed-reference-data)
- Location: `VITE_GOOGLE_MAPS_API_KEY` unset or the Places/Geocoding/Maps JavaScript APIs aren't enabled on that key's Google Cloud project

### Type Errors After Schema Changes

```bash
cd apps/frontend
pnpm codegen
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|--------------|---------|
| `VITE_STRAPI_URL` | Yes | Backend API URL — throws at import time if unset | `http://localhost:1337` |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Places/Geocoding/Maps JS key; degrades gracefully if blank | `AIza...` |

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build → `dist/` (runs `tsc -b` first) |
| `pnpm preview` | Preview production build |
| `pnpm lint` | ESLint |
| `pnpm codegen` | Generate GraphQL types → `src/lib/graphql/generated.ts` |

## Next Steps

1. Confirm Google OAuth is fully wired on the backend side (both the `.env` credentials **and** the Strapi admin "enable provider" + "front-end redirect URL" steps)
2. Set up a Google Maps API key if location autocomplete matters for your pilot
3. Review `src/App.tsx` for the current route table
4. Walk the sign-in flow end-to-end once, watching the Network tab, before assuming anything else is broken

## Additional Resources

- [Vite Documentation](https://vite.dev/)
- [React Router v7](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [urql GraphQL Client](https://commerce.nearform.com/open-source/urql/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Backend Setup Guide](./BACKEND_SETUP.md)
- [Azure Deployment Guide](./AZURE_DEPLOYMENT.md)
