# Toast2Host Alumni Connect MVP

A consent-based alumni networking platform built with React (Vite) frontend and Strapi backend, connected via GraphQL. Organized as a Turborepo monorepo.

## Prerequisites

- **Node.js**: ≥22.0.0
- **pnpm**: ≥9.0.0
- **Database**: SQLite (local) or PostgreSQL (production)
- **Google OAuth credentials** (for authentication)
- **Google Maps API key** (for location features)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

**Backend** (`apps/backend/.env`):
```bash
cd apps/backend
cp .env.example .env
```

Edit `.env` with your configuration (see [Backend Setup Guide](./docs/BACKEND_SETUP.md) for details).

**Frontend** (`apps/frontend/.env.local`):
```bash
cd apps/frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```bash
VITE_STRAPI_URL=http://localhost:1337
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_UNIVERSITY_SCOPE=US
```

### 3. Start Development Servers

```bash
# From project root - starts both apps
pnpm dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:1337
- Backend Admin: http://localhost:1337/admin
- GraphQL Playground: http://localhost:1337/graphql

## Project Structure

```
toast2host/
├── apps/
│   ├── frontend/          # React + Vite frontend
│   └── backend/           # Strapi 5 backend
├── packages/
│   ├── infrastructure/    # Azure Bicep IaC
│   └── typescript-config/ # Shared TS configs
├── docs/                  # Detailed setup guides
├── tests/                 # E2E tests (Playwright)
└── scripts/               # Utility scripts
```

## Tech Stack

**Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS v4, React Router v7, React Hook Form, Zod, TanStack Query, urql GraphQL client

**Backend**: Strapi 5, GraphQL plugin, PostgreSQL/SQLite, Google OAuth 2.0, Nodemailer

**Infrastructure**: Azure Static Web Apps (frontend), Azure App Service (backend), Azure PostgreSQL Flexible Server

## Common Commands

```bash
# Development
pnpm dev                 # Start both apps
pnpm dev:frontend        # Start only frontend (port 5173)
pnpm dev:backend         # Start only backend (port 1337)

# Build
pnpm build               # Build all apps
pnpm build:frontend      # Build frontend only
pnpm build:backend       # Build backend only

# Testing
pnpm test:e2e            # Run E2E tests (headless)
pnpm test:e2e:ui         # Interactive test UI
pnpm test:e2e:headed     # Browser visible during tests

# Linting
pnpm lint                # Lint all packages

# Frontend specific
cd apps/frontend
pnpm codegen             # Generate GraphQL types

# Backend specific
cd apps/backend
pnpm develop             # Start Strapi dev mode
pnpm clean               # Clean cache and build artifacts
pnpm seed:db             # Seed database with test data
```

## Detailed Setup Guides

For comprehensive setup instructions, see:

- **[Frontend Setup](./docs/FRONTEND_SETUP.md)** - Complete React/Vite setup guide
- **[Backend Setup](./docs/BACKEND_SETUP.md)** - Strapi configuration and GraphQL API
- **[Azure Deployment](./docs/AZURE_CLI_DEPLOYMENT.md)** - Production deployment guide
- **[Email Setup](./docs/EMAIL_SETUP.md)** - Email notification configuration

## Deployment Notes

This project deploys to Azure:

- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service (deployed to `backend/` directory)
- **Database**: Azure PostgreSQL Flexible Server (`toast2host-database`)
- **Resource Group**: `toast2host-rg`

**Important deployment considerations:**
- Use pnpm for package management
- Don't copy `node_modules` or `dist` folders (rebuild on server)
- Backend `.env` should not be overwritten (server is pre-configured)
- Use `rsync --exclude .env` when deploying backend code
- Run `npm run build` on the server after code deployment
- Frontend deployment is manual via Azure CLI

## Authentication Flow

1. User clicks "Sign in with Google" → `/signin`
2. Redirects to backend OAuth endpoint
3. Backend validates with Google and redirects to `/auth/callback` with JWT token
4. Token stored in localStorage as `t2h_token`
5. New users redirected to `/onboarding`, existing users to `/search`

## GraphQL API

Backend exposes GraphQL API at `/graphql` with custom resolvers:

- **me**: Current user identity
- **profile**: Profile management (`updateMyProfile`)
- **search**: Alumni search with location-based filtering (25-mile radius)
- **connection**: Connection workflow (create, approve, reject) with daily cap
- **universities**: University directory proxy
- **privacy**: Data export/deletion requests (GDPR)

## Key Features

- **Consent-based connections**: Default requires recipient approval
- **Location search**: 25-mile radius for cities, haversine distance calculation
- **Daily connect cap**: Server-enforced limit (default: 10/day for free tier)
- **Client-side pagination**: Infinite scroll with "Load More" pattern
- **Google OAuth**: JWT-based authentication
- **Email notifications**: Optional connection request alerts

## Troubleshooting

### Port conflicts
```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 1337 (backend)
lsof -ti:1337 | xargs kill -9
```

### GraphQL connection errors
1. Ensure backend is running: `pnpm dev:backend`
2. Check `VITE_STRAPI_URL` in `apps/frontend/.env.local`
3. Verify backend GraphQL endpoint: http://localhost:1337/graphql

### Build errors
```bash
cd apps/backend
pnpm clean
pnpm build
```

### TypeScript errors after schema changes
```bash
cd apps/frontend
pnpm codegen  # Regenerate GraphQL types
```

## Contributing

Before making changes:
1. Create a feature branch
2. Run tests: `pnpm test:e2e`
3. Ensure lint passes: `pnpm lint`
4. Follow existing code patterns

## Additional Resources

- [Vite Documentation](https://vite.dev/)
- [Strapi Documentation](https://docs.strapi.io/)
- [React Router v7](https://reactrouter.com/)
- [urql GraphQL Client](https://commerce.nearform.com/open-source/urql/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS v4](https://tailwindcss.com/)
