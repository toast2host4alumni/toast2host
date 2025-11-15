# How to Run Toast2Host Alumni Connect

## Quick Start (5 minutes)

### Step 1: Setup Backend (Strapi)

```bash
# Navigate to backend directory
cd backend

# Copy environment template
cp .env.example .env

# Install dependencies (already done)
# npm install

# Start Strapi in development mode
npm run develop
```

**First time setup:**
1. Strapi will start at **http://localhost:1337/admin**
2. Create an admin account (save these credentials!)
3. You'll see the Strapi admin dashboard

### Step 2: Configure Google OAuth (Required)

**Get Google OAuth Credentials:**
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → Create Credentials → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:1337/api/connect/google/callback`
   - `http://localhost:3000/auth/callback`
7. Copy **Client ID** and **Client Secret**

**Configure in Strapi:**
1. In Strapi admin, go to **Settings** → **Users & Permissions** → **Providers**
2. Click on **Google**
3. Enable the provider
4. Paste your **Client ID** and **Client Secret**
5. The callback URL should be: `http://localhost:1337/api/connect/google/callback`
6. Click **Save**

**Update backend/.env:**
```bash
PROVIDER_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
PROVIDER_GOOGLE_CLIENT_SECRET=your-client-secret
```

### Step 3: Setup Frontend (Next.js)

Open a **new terminal** (keep Strapi running):

```bash
# Navigate to frontend directory
cd frontend

# Copy environment template
cp .env.local.example .env.local

# Install dependencies (already done)
# npm install

# Start Next.js in development mode
npm run dev
```

**Configure .env.local:**
```bash
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_UNIVERSITY_SCOPE=US
```

**Get Google Maps API Key:**
1. Go to https://console.cloud.google.com/ (same project as OAuth)
2. Go to **APIs & Services** → **Library**
3. Enable these APIs:
   - **Places API**
   - **Geocoding API**
   - **Maps JavaScript API**
4. Go to **Credentials** → Create Credentials → **API Key**
5. Copy the API key to `.env.local`

### Step 4: Access the Application

The app will be running at:
- **Frontend**: http://localhost:3000
- **Backend Admin**: http://localhost:1337/admin
- **GraphQL Playground**: http://localhost:1337/graphql

## Development Workflow

### Starting the servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run develop
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Building for production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## Testing the Application

### Manual Testing

1. **Sign In**: Go to http://localhost:3000/signin → Click "Sign in with Google"
2. **Onboarding**: Fill in University, LinkedIn URL, Location, Batch Year
3. **Search**: Search for alumni by location
4. **Connect**: Click Connect on a profile → Request should be created
5. **Profile**: Edit your profile at http://localhost:3000/profile
6. **Settings**: Request data export/deletion at http://localhost:3000/settings

### E2E Testing with Playwright

```bash
# Install Playwright browsers (one-time)
npm run test:install

# Run E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

## Troubleshooting

### Backend won't start

**Issue**: Port 1337 already in use
```bash
# Find and kill the process
lsof -ti:1337 | xargs kill -9
```

**Issue**: SQLite database locked
```bash
cd backend
rm -rf .tmp
npm run develop
```

### Frontend won't start

**Issue**: Port 3000 already in use
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

### Google OAuth not working

**Check:**
1. Redirect URIs are exactly: `http://localhost:1337/api/connect/google/callback`
2. Client ID and Secret are correct in Strapi admin
3. Google+ API is enabled in Google Cloud Console
4. Test domain `localhost` is added to authorized domains

### Location search not working

**Check:**
1. Google Maps API key is set in `frontend/.env.local`
2. Places API, Geocoding API, Maps JavaScript API are enabled
3. API key has no restrictions or allows `localhost`

### GraphQL errors

**Issue**: "Cannot query field X on type Y"
```bash
# Regenerate GraphQL types
cd frontend
npm run codegen
```

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_CLIENT` | No | `sqlite` | Database type: `sqlite` or `postgres` |
| `DATABASE_URL` | If postgres | - | PostgreSQL connection string |
| `HOST` | No | `0.0.0.0` | Strapi host |
| `PORT` | No | `1337` | Strapi port |
| `APP_KEYS` | Yes | - | Strapi app keys (comma-separated) |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `PROVIDER_GOOGLE_CLIENT_ID` | Yes | - | Google OAuth client ID |
| `PROVIDER_GOOGLE_CLIENT_SECRET` | Yes | - | Google OAuth client secret |
| `CONSENT_REQUIRED` | No | `true` | Require approval for connections |
| `DAILY_CONNECT_CAP` | No | `10` | Daily connection limit per user |

### Frontend (.env.local)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_STRAPI_URL` | Yes | `http://localhost:1337` | Backend API URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | - | Google Maps API key |
| `NEXT_PUBLIC_UNIVERSITY_SCOPE` | No | `US` | University search scope |

## Tech Stack

- **Backend**: Strapi v5.31.0, Node.js 18+, SQLite/PostgreSQL
- **Frontend**: Next.js 16.0.3, React 19.2.0, TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.1.17
- **GraphQL**: urql 5.0.1
- **Forms**: React Hook Form 7.66.0 + Zod 4.1.12
- **Testing**: Playwright 1.40.0

## Next Steps

1. **Set up Google OAuth** - Required for authentication
2. **Get Google Maps API key** - Required for location search
3. **Start both servers** - Backend on 1337, Frontend on 3000
4. **Test the flow** - Sign in → Onboard → Search → Connect
5. **Review the code** - Explore specs/ directory for requirements

## Getting Help

- **Specifications**: See `specs/001-alumni-connect-mvp/spec.md`
- **Gap Analysis**: See `GAP_ANALYSIS.md`
- **Quickstart Guide**: See `specs/001-alumni-connect-mvp/quickstart.md`
- **Test Documentation**: See `tests/e2e/README.md`
