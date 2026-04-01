# Backend Setup Guide

Complete setup instructions for the Toast2Host backend application (Strapi 5 + GraphQL).

## Prerequisites

Before starting, ensure you have:

- **Node.js**: ≥22.0.0
- **pnpm**: ≥9.0.0
- **Database**: SQLite (local) or PostgreSQL (production)
- **Google OAuth Credentials**: Required for authentication

## Installation

### 1. Install Dependencies

From the **project root**, install all workspace dependencies:

```bash
pnpm install
```

This installs dependencies for all apps in the monorepo, including the backend.

### 2. Configure Environment Variables

Create environment file:

```bash
cd apps/backend
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database Configuration
# For local development (SQLite)
DATABASE_CLIENT=sqlite

# For production (PostgreSQL)
# DATABASE_CLIENT=postgres
# DATABASE_URL=postgresql://username:password@host:5432/toast2host

# Strapi Configuration
HOST=0.0.0.0
PORT=1337
APP_KEYS=generate-random-key-1,generate-random-key-2
API_TOKEN_SALT=generate-random-salt
ADMIN_JWT_SECRET=generate-random-secret
TRANSFER_TOKEN_SALT=generate-random-salt
JWT_SECRET=generate-random-jwt-secret

# Google OAuth (Required)
# Get from: https://console.cloud.google.com/
PROVIDER_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
PROVIDER_GOOGLE_CLIENT_SECRET=your-client-secret
PROVIDER_GOOGLE_REDIRECT_URI=http://localhost:1337/api/connect/google/callback

# Frontend URL (for OAuth redirects and CORS)
CLIENT_URL=http://localhost:5173

# Application Settings
CONSENT_REQUIRED=true
DAILY_CONNECT_CAP=10
NOTIFICATIONS_EMAIL_ENABLED=false
```

**Generate secure secrets:**

```bash
# Generate random secrets (macOS/Linux)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Configure Google OAuth

#### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URI:
   - Local: `http://localhost:1337/api/connect/google/callback`
   - Production: `https://your-domain.com/api/connect/google/callback`
7. Copy **Client ID** and **Client Secret** to `.env`

#### Configure in Strapi Admin

After first start, you can also configure OAuth via Strapi Admin UI:

1. Go to **Settings** → **Users & Permissions Plugin** → **Providers**
2. Enable **Google** provider
3. Enter Client ID and Secret
4. Set Redirect URL

**Note**: Database-based configuration takes precedence over `.env` values.

### 4. Initialize Database

On first run, Strapi will automatically:
- Create SQLite database at `.tmp/data.db` (if using SQLite)
- Run migrations
- Create content types

For PostgreSQL:
```bash
# Ensure PostgreSQL is running
psql -U postgres -c "CREATE DATABASE toast2host;"

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/toast2host
```

## Running the Application

### Development Mode

From the **project root**:

```bash
# Start both frontend and backend
pnpm dev

# Or start only backend
pnpm dev:backend
```

From **apps/backend** directory:

```bash
cd apps/backend
pnpm develop
```

The backend will start at:
- **API**: http://localhost:1337
- **Admin Panel**: http://localhost:1337/admin
- **GraphQL Playground**: http://localhost:1337/graphql

**First-time Admin Setup**:
On first launch, visit `/admin` and create your admin account.

### Production Mode

```bash
# Build for production
cd apps/backend
pnpm build

# Start production server
pnpm start
```

### Clean Build Cache

If you encounter build issues:

```bash
cd apps/backend
pnpm clean  # Removes .cache, build, .tmp
pnpm build  # Rebuild
```

## Project Structure

```
apps/backend/
├── config/                      # Strapi configuration
│   ├── database.ts             # Database config
│   ├── middlewares.ts          # Middleware stack
│   └── server.ts               # Server settings
├── src/
│   ├── api/                    # Content types (auto-generated routes)
│   │   ├── connection/
│   │   ├── connection-event/
│   │   ├── privacy-request/
│   │   ├── subscription/
│   │   └── user-profile/
│   ├── extensions/
│   │   └── graphql/
│   │       ├── resolvers/      # Custom GraphQL resolvers
│   │       │   ├── me.ts       # Current user identity
│   │       │   ├── profile.ts  # Profile management
│   │       │   ├── search.ts   # Alumni search
│   │       │   ├── connection.ts # Connection workflow
│   │       │   ├── universities.ts # University directory
│   │       │   └── privacy.ts  # Data export/deletion
│   │       └── schema.graphql  # GraphQL schema
│   ├── middlewares/            # Custom middlewares
│   │   └── request-id.ts       # Request tracing
│   └── utils/                  # Utilities
│       ├── email-templates/    # Email HTML templates
│       └── location.ts         # Haversine distance calculation
├── .env                        # Environment variables
└── package.json
```

## Database Schema

### Content Types

**UserProfile** (`api::user-profile.user-profile`)
- Links to Strapi User
- Fields: `university`, `batch_year`, `linkedin_url`, `city`, `state`, `country`, `latitude`, `longitude`, `bio`, `consent_search`

**Connection** (`api::connection.connection`)
- Relationship between users
- Fields: `actor_user`, `target_user`, `status` (pending|connected|rejected), `consent_obtained`, `message`

**ConnectionEvent** (`api::connection-event.connection-event`)
- Audit trail for connections
- Fields: `connection`, `from_status`, `to_status`, `actor_user`, `notes`

**Subscription** (`api::subscription.subscription`)
- User subscription tiers
- Fields: `user`, `plan_tier` (free|premium|enterprise), `starts_at`, `ends_at`, `status`

**PrivacyRequest** (`api::privacy-request.privacy-request`)
- GDPR compliance
- Fields: `user`, `request_type` (export|delete), `status`, `processed_at`, `data_url`

### Accessing the Database

**SQLite** (local):
```bash
sqlite3 apps/backend/.tmp/data.db
.tables  # List tables
```

**PostgreSQL** (production):
```bash
psql $DATABASE_URL
\dt  # List tables
```

## GraphQL API

### Available Queries

```graphql
query {
  # Get current user
  me {
    id
    username
    email
    profile { ... }
  }

  # Search alumni
  searchAlumni(
    university: "MIT"
    location: { city: "Boston", state: "MA" }
    batchYear: 2020
    page: 1
    pageSize: 20
  ) {
    data { ... }
    total
  }

  # Get my connections
  myConnections(status: "connected") { ... }

  # Get connection requests
  myConnectionRequests { ... }

  # Search universities
  searchUniversities(query: "Stanford") { ... }
}
```

### Available Mutations

```graphql
mutation {
  # Update profile
  updateMyProfile(data: {
    university: "MIT"
    batchYear: 2020
    city: "Boston"
    state: "MA"
  }) { ... }

  # Create connection request
  createConnection(
    targetUserId: "123"
    message: "Let's connect!"
  ) { ... }

  # Approve connection
  approveConnection(connectionId: "456") { ... }

  # Reject connection
  rejectConnection(connectionId: "456") { ... }

  # Request data export
  requestDataExport { ... }

  # Request account deletion
  requestAccountDeletion { ... }
}
```

### Test GraphQL API

Visit http://localhost:1337/graphql in your browser for the GraphQL Playground.

**Example test query:**
```graphql
query {
  me {
    id
    username
    email
  }
}
```

Add authentication header:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## Custom Resolvers

Located in `src/extensions/graphql/resolvers/`:

### Search Resolver (`search.ts`)

Implements location-based search with 25-mile radius for cities:

```typescript
// City search uses haversine distance
if (location.city) {
  // Find users within 25-mile radius
  const nearbyUsers = users.filter(user => {
    const distance = calculateDistance(
      location.latitude, location.longitude,
      user.latitude, user.longitude
    );
    return distance <= 25; // miles
  });
}
```

### Connection Resolver (`connection.ts`)

Enforces daily connection cap:

```typescript
// Check daily cap
const todayCount = await strapi.db.query('api::connection.connection')
  .count({ where: { actor_user: userId, createdAt: todayStart } });

if (todayCount >= DAILY_CONNECT_CAP) {
  throw new Error('Daily connection limit reached');
}
```

## Configuration

### CORS Settings

Edit `config/middlewares.ts`:

```typescript
export default [
  'strapi::cors',  // Allow all origins in dev
  // Or configure specifically:
  {
    name: 'strapi::cors',
    config: {
      origin: [process.env.CLIENT_URL],
      credentials: true,
    }
  }
];
```

### Email Notifications

To enable email notifications (connection requests):

1. Update `.env`:
```bash
NOTIFICATIONS_EMAIL_ENABLED=true
```

2. Configure email provider in Strapi Admin:
   - **Settings** → **Email Plugin**
   - Choose provider (default: Nodemailer)
   - Configure SMTP settings

See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for detailed instructions.

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `CONSENT_REQUIRED` | `true` | Require approval for connections |
| `DAILY_CONNECT_CAP` | `10` | Max connections per day (free tier) |
| `NOTIFICATIONS_EMAIL_ENABLED` | `false` | Send email notifications |

## Common Issues

### Port Already in Use

**Error**: `Port 1337 is already in use`

```bash
# Find process using port 1337
lsof -ti:1337

# Kill the process
lsof -ti:1337 | xargs kill -9
```

### Database Connection Error

**PostgreSQL error**: `Connection refused`

**Solutions**:
1. Ensure PostgreSQL is running: `brew services start postgresql`
2. Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
3. Check database exists: `psql -U postgres -c "\l"`

### Admin Panel 403 Forbidden

**Error**: Cannot access `/admin`

**Solutions**:
1. Clear cookies and cache
2. Rebuild admin panel: `pnpm clean && pnpm build`
3. Check `ADMIN_JWT_SECRET` is set in `.env`

### GraphQL Plugin Not Working

**Error**: `/graphql` returns 404

**Solutions**:
1. Verify `@strapi/plugin-graphql` is installed
2. Rebuild: `pnpm clean && pnpm build`
3. Check `config/plugins.ts` (should be auto-configured)

### Google OAuth Fails

**Error**: `Invalid redirect URI` or `Unauthorized`

**Solutions**:
1. Check `PROVIDER_GOOGLE_REDIRECT_URI` matches Google Console
2. Verify `CLIENT_URL` matches frontend URL
3. In Google Console, add authorized redirect URI exactly as configured
4. Ensure Google+ API is enabled

### TypeScript Compilation Errors

**Error**: TS errors during build

**Solutions**:
```bash
# Clean and rebuild
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_CLIENT` | Yes | Database type | `sqlite` or `postgres` |
| `DATABASE_URL` | For PostgreSQL | Connection string | `postgresql://user:pass@host:5432/db` |
| `HOST` | Yes | Server host | `0.0.0.0` |
| `PORT` | Yes | Server port | `1337` |
| `APP_KEYS` | Yes | Strapi session keys | `key1,key2` |
| `API_TOKEN_SALT` | Yes | API token salt | Random string |
| `ADMIN_JWT_SECRET` | Yes | Admin JWT secret | Random string |
| `JWT_SECRET` | Yes | User JWT secret | Random string |
| `PROVIDER_GOOGLE_CLIENT_ID` | Yes | OAuth client ID | `xxx.apps.googleusercontent.com` |
| `PROVIDER_GOOGLE_CLIENT_SECRET` | Yes | OAuth secret | Random string |
| `PROVIDER_GOOGLE_REDIRECT_URI` | Yes | OAuth callback URL | `http://localhost:1337/api/connect/google/callback` |
| `CLIENT_URL` | Yes | Frontend URL | `http://localhost:5173` |
| `CONSENT_REQUIRED` | No | Connection approval | `true` (default) |
| `DAILY_CONNECT_CAP` | No | Daily connection limit | `10` (default) |
| `NOTIFICATIONS_EMAIL_ENABLED` | No | Email notifications | `false` (default) |

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm develop` | Start development server (port 1337) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm clean` | Clean cache and build artifacts |
| `pnpm seed:db` | Seed database with test data |

## Seeding the Database

For development, you can seed the database with test data:

```bash
cd apps/backend
pnpm seed:db
```

This creates sample users, profiles, and connections for testing.

## Next Steps

1. **Create Admin Account**: Visit http://localhost:1337/admin
2. **Configure Google OAuth**: Set up credentials in Google Console
3. **Test GraphQL API**: Use GraphQL Playground at `/graphql`
4. **Set Up Email**: Configure email provider (optional)
5. **Review Custom Resolvers**: Check `src/extensions/graphql/resolvers/`
6. **Connect Frontend**: Ensure frontend can communicate with backend

## Additional Resources

- [Strapi Documentation](https://docs.strapi.io/)
- [Strapi GraphQL Plugin](https://docs.strapi.io/dev-docs/plugins/graphql)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Frontend Setup Guide](./FRONTEND_SETUP.md)
- [Email Setup Guide](./EMAIL_SETUP.md)
- [Azure Deployment Guide](./AZURE_DEPLOYMENT.md)
