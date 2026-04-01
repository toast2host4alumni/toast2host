# Frontend Setup Guide

Complete setup instructions for the Toast2Host frontend application (Next.js/React + Vite).

## Prerequisites

Before starting, ensure you have:

- **Node.js**: ≥22.0.0
- **pnpm**: ≥9.0.0
- **Backend**: Running Strapi backend (see [BACKEND_SETUP.md](./BACKEND_SETUP.md))
- **Google Maps API Key**: Required for location search features

## Installation

### 1. Install Dependencies

From the **project root**, install all workspace dependencies:

```bash
pnpm install
```

This installs dependencies for all apps in the monorepo, including the frontend.

### 2. Configure Environment Variables

Create environment file:

```bash
cd apps/frontend
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Backend API URL (local development)
VITE_STRAPI_URL=http://localhost:1337

# Google Maps API Key
# Get from: https://console.cloud.google.com/
# Enable: Places API, Geocoding API, Maps JavaScript API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# University Search Scope (US, UK, IN, etc.)
VITE_UNIVERSITY_SCOPE=US
```

### 3. Generate GraphQL Types (Optional)

If you modify GraphQL queries or the backend schema changes, regenerate types:

```bash
cd apps/frontend
pnpm codegen
```

This generates TypeScript types from your GraphQL schema in `src/gql/`.

## Running the Application

### Development Mode

From the **project root**:

```bash
# Start both frontend and backend
pnpm dev

# Or start only frontend
pnpm dev:frontend
```

From **apps/frontend** directory:

```bash
cd apps/frontend
pnpm dev
```

The frontend will start at **http://localhost:5173**

### Production Build

```bash
# From project root
pnpm build:frontend

# Or from apps/frontend
cd apps/frontend
pnpm build
```

Preview production build:

```bash
pnpm preview
```

## Project Structure

```
apps/frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route pages
│   ├── lib/              # Utilities and GraphQL client
│   ├── gql/              # Generated GraphQL types
│   ├── hooks/            # Custom React hooks
│   └── App.tsx           # Main app component
├── public/               # Static assets
├── .env.local           # Environment variables
└── vite.config.ts       # Vite configuration
```

## Key Features

### Authentication

Frontend uses Google OAuth via the backend. Token stored in `localStorage` as `t2h_token`.

**Sign-in flow:**
1. User clicks "Sign in with Google" → `/signin`
2. Redirects to backend OAuth endpoint
3. Backend redirects back to `/auth/callback` with token
4. Token stored, user redirected to `/search` or `/onboarding`

### GraphQL Client

Uses **urql** for GraphQL queries. Client configured in `src/lib/graphql.tsx`:

```typescript
import { Client, cacheExchange, fetchExchange } from 'urql';

const client = new Client({
  url: import.meta.env.VITE_STRAPI_URL + '/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => ({
    headers: {
      authorization: `Bearer ${localStorage.getItem('t2h_token')}`,
    },
  }),
});
```

### Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signin` | Google Sign-In |
| `/auth/callback` | OAuth callback handler |
| `/onboarding` | New user profile setup |
| `/search` | Alumni search interface |
| `/requests` | Pending connection requests |
| `/profile` | Edit user profile |
| `/settings` | Privacy settings |

## Development Workflow

### Adding a New Feature

1. **Create GraphQL query/mutation** in `src/lib/graphql/` or inline
2. **Generate types**: `pnpm codegen`
3. **Create components** in `src/components/`
4. **Add route** in `src/App.tsx` (React Router)
5. **Test** in browser

### Form Validation

Uses **React Hook Form** + **Zod** for form validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

### Styling

Uses **Tailwind CSS v4** with custom configuration. UI components from **shadcn/ui** (Radix UI primitives).

## Common Issues

### Port Already in Use

If port 5173 is occupied:

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or set custom port in vite.config.ts
export default defineConfig({
  server: { port: 3000 }
});
```

### GraphQL Connection Error

**Error**: `Network request failed`

**Solutions**:
1. Ensure backend is running: `pnpm dev:backend`
2. Check `VITE_STRAPI_URL` in `.env.local`
3. Verify backend GraphQL endpoint: http://localhost:1337/graphql

### Google Maps Not Loading

**Error**: `Google Maps API error`

**Solutions**:
1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set
2. Enable required APIs in Google Cloud Console:
   - Places API
   - Geocoding API
   - Maps JavaScript API
3. Check API key restrictions (HTTP referrers)

### Authentication Fails

**Error**: `Unauthorized` or token issues

**Solutions**:
1. Clear localStorage: `localStorage.clear()`
2. Verify backend Google OAuth is configured
3. Check backend `.env` has correct `PROVIDER_GOOGLE_CLIENT_ID/SECRET`
4. Ensure `CLIENT_URL` in backend matches your frontend URL

### Type Errors After Schema Changes

**Error**: TypeScript errors in GraphQL queries

**Solution**:
```bash
cd apps/frontend
pnpm codegen  # Regenerate types from schema
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_STRAPI_URL` | Yes | Backend API URL | `http://localhost:1337` |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key | `AIza...` |
| `VITE_UNIVERSITY_SCOPE` | No | University search filter | `US` (default) |

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (port 5173) |
| `pnpm build` | Production build → `dist/` |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm codegen` | Generate GraphQL types |

## Next Steps

1. **Configure Google OAuth**: See backend setup for OAuth configuration
2. **Set up Google Maps API**: Enable required APIs in Google Cloud Console
3. **Review Routes**: Check `src/App.tsx` for route structure
4. **Test Authentication**: Try sign-in flow end-to-end
5. **Explore Components**: Check `src/components/` for reusable UI

## Additional Resources

- [Vite Documentation](https://vite.dev/)
- [React Router v7](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [urql GraphQL Client](https://commerce.nearform.com/open-source/urql/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Backend Setup Guide](./BACKEND_SETUP.md)
- [Azure Deployment Guide](./AZURE_DEPLOYMENT.md)
