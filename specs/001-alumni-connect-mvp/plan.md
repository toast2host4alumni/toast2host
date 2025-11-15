# Implementation Plan: Toast2Host MVP — Alumni Connect

**Branch**: `[001-alumni-connect-mvp]` | **Date**: 2025-11-02 | **Spec**: specs/001-alumni-connect-mvp/spec.md
**Input**: Feature specification from `specs/001-alumni-connect-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

MVP web app (mobile-first) to onboard users with Google Sign-In, collect
University (required, US-only directory), LinkedIn URL (required), Location
(required), and optional Batch year. Users can search alumni by location
(city → 25-mile radius; state/country → whole region), filter by University
and Batch year, and request to connect. By default, recipient consent is
required before revealing email; can be disabled via config. Backend is Strapi
v5 with PostgreSQL; frontend is Next.js 14 + TypeScript with Tailwind theming.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x (React 18, Next.js 14 App Router), Node 18 LTS; Strapi v5 (Node 18, TypeScript)  
**Primary Dependencies**: Next.js, React, Tailwind CSS, @tanstack/react-query, react-hook-form, @hookform/resolvers, zod, zustand; shadcn/ui; urql (GraphQL client), graphql, GraphQL Code Generator; Strapi core, Strapi GraphQL plugin, Strapi Google OAuth provider  
**Storage**: PostgreSQL 14+ for Strapi (prod/stage), SQLite acceptable for local dev  
**Testing**: Vitest + React Testing Library (unit), Playwright (smoke E2E); optional backend tests later  
**Target Platform**: Web (mobile-first responsive), SSR/ISR for public pages; GraphQL API for app data  
**Project Type**: web (frontend + backend)  
**Performance Goals**: 95% of searches return results or empty state in < 1.5s; onboarding < 3 minutes  
**Constraints**: Consent required by default; email notifications optional; Google Places/Geocoding for location; US-only universities; secrets not in repo; GraphQL for app data (health/metrics may remain REST)  
**Scale/Scope**: MVP pilot targeting 500–2,000 users; peak search load ~10 req/s (tunable)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Gates derived from `.specify/memory/constitution.md`:

- MVP-First, Outcome-Driven: One P1 story (onboarding) independently testable — PASS
- Simplicity Over Abstraction: Two processes (Next.js + Strapi) — JUSTIFY in Complexity Tracking (time-to-market vs bespoke backend)
- Security & Privacy Baseline: Minimal PII, no secrets/PII in logs, TLS, Google OAuth, account deletion export path (manual acceptable) — PASS
- Operability & Observability: Structured JSON logs, request IDs, readiness/health endpoints, basic metrics (requests, latency, error rate) — PASS
- Contracts & Migrations: SemVer for public endpoints, additive changes preferred, schema migrations forward-only with rollback notes — PASS

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/                     # Strapi v5 app (Node 18)
└── src/
    ├── api/                 # content-types and custom controllers/routes
    ├── extensions/          # plugins, email provider config
    └── config/              # env, database, middleware, policies

frontend/                    # Next.js 14 (App Router) web app
└── src/
    ├── app/                 # routes, layouts, server components
    ├── components/          # UI components
    ├── lib/                 # fetchers, zod schemas, utils
    ├── hooks/               # client hooks (useQuery, forms)
    └── styles/              # Tailwind setup

tests/
└── e2e/                     # Playwright smoke: onboarding/search/connect
```

**Structure Decision**: Web application with separate frontend (Next.js) and
backend (Strapi). This leverages Strapi’s admin and auth plugins to reduce
time-to-market while keeping the frontend simple and mobile-first.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Two processes (Next.js + Strapi) | Strapi provides ready admin, content-types, OAuth, and email integration | Single-service custom backend would delay MVP; higher implementation risk and effort |
