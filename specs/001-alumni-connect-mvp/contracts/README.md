# Contracts — Toast2Host MVP

This feature uses GraphQL (Strapi GraphQL plugin) for app data. See `operations.graphql` for the core queries and mutations used by the frontend. Health and metrics endpoints may remain REST.

API Versioning Checklist
- Bump `info.version` in `openapi.yaml` when REST endpoints change (e.g., `/metrics`).
- For GraphQL, document breaking changes in `CHANGELOG.md` and coordinate frontend codegen updates.
- Prefer additive changes (new fields/types) for MVP. Avoid breaking schema changes.
- Regenerate TS types after schema changes: `pnpm codegen` in `frontend/`.

Files
- contracts/openapi.yaml — REST endpoints (metrics/health)
- contracts/operations.graphql — GraphQL document operations
