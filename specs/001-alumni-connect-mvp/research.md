# Research & Decisions: Toast2Host MVP — Alumni Connect

Date: 2025-11-02

## Frontend Stack

- Decision: Next.js 14 (React 18, App Router) + TypeScript
- Rationale: Fast DX, SSR/ISR capability, first-class routing, edge-friendly deploys
- Alternatives: CRA (deprecated), Vite + React Router (needs more wiring), Remix (similar value)

- Decision: Tailwind CSS 3 + Tailwind Typography; theme via `tailwind.config.js`
- Rationale: Rapid UI iteration; easy mobile-first; simple theming
- Alternatives: CSS Modules (slower), Styled Components (runtime cost)

- Decision: React Hook Form + Zod (via `@hookform/resolvers/zod`)
- Rationale: Declarative schema validation, shared types; great perf
- Alternatives: Yup (less type-safe), custom validators (more code)

- Decision: TanStack Query for server state; Zustand for minimal global UI state
- Rationale: Proven patterns; caching and async orchestration; small UI store
- Alternatives: Redux Toolkit (heavier), SWR (similar but fewer features)

## Backend Stack

- Decision: Strapi v5 (Node 18) + PostgreSQL 14+
- Rationale: Built-in Users & Permissions, OAuth providers, content-types, admin UI
- Alternatives: Custom Node/Express + Prisma (slower to MVP), Supabase (auth great, admin less tailored)

- Decision: Strapi Google OAuth provider for login
- Rationale: Matches requirement; reduces custom auth work
- Alternatives: Auth0 (paid), Firebase Auth (extra moving parts)

- Decision: Strapi Email plugin (optional) with provider (e.g., SendGrid)
- Rationale: Support consent approvals via email when configured; fallback to in-app
- Alternatives: SMTP service; defer entirely (in-app only)

## Integrations

- Decision: Location via Google Places Autocomplete + Geocoding
- Rationale: Quality data; easy to capture city/state/country; derive radius or region scope
- Behavior: city → 25-mile radius; state → whole state; country → whole country

- Decision: Universities via Hipolabs Universities API (US-only)
- Rationale: Open source and adequate; US-only aligns with MVP scope
- Handling: Allow free-text fallback if not found; flag for curation

- Decision: LinkedIn URL validation only (no OAuth)
- Rationale: Scope control; URL format check is sufficient

## Product Behavior

- Decision: Consent required by default; config `CONSENT_REQUIRED=true`
- Rationale: Privacy-friendly; aligns with constitution; can be disabled in config
- Flow: Request → pending → target approves → reveal email; if disabled → immediate reveal

- Decision: Daily connect cap: `DAILY_CONNECT_CAP=10`
- Rationale: Abuse prevention; growth control; configurable via env

- Decision: Entitlements via Subscription (admin-assigned); payments out-of-scope
- Rationale: Future premium-ready without integrating billing now

## Data & Search

- Decision: Store `location_text`, `location_lat`, `location_lng`; optional `location_scope` (city|state|country)
- Rationale: Supports semantics for radius vs region queries; simplest index strategy initially
- Alternatives: PostGIS (powerful, more setup) — defer for MVP

- Decision: Unique constraint on Connection (actor, target)
- Rationale: Prevent duplicates; idempotency

## Testing

- Decision: Vitest + RTL unit; Playwright smoke E2E (onboarding, search, connect)
- Rationale: Balance of speed and coverage for MVP

## Open Questions (Deferred)

- Payment integration and premium tiers
- Geospatial indexing upgrade (PostGIS) if search performance demands
- Email provider choice (SendGrid vs SES) — optional for MVP
