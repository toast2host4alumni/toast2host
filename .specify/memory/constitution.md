<!--
Sync Impact Report - Constitution v1.0.0 (Initial Ratification)
==================================================================
Version Change: Template → 1.0.0 (MINOR: Initial ratification)
Modified Principles: None (initial creation)
Added Sections:
  - Core Principles: I-V (MVP-First, Simplicity, Security & Privacy, Operability, Contracts)
  - Security & Privacy Requirements
  - Quality Gates
  - Governance
Removed Sections: None
Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section aligns
  ✅ .specify/templates/spec-template.md - Requirements sections align
  ✅ .specify/templates/tasks-template.md - Task categorization aligns
Follow-up TODOs: None
-->

# Toast2Host MVP Constitution

## Core Principles

### I. MVP-First, Outcome-Driven

Every feature MUST be deliverable as an independently testable user story with clear acceptance criteria. Features MUST be prioritized by user value (P1/P2/P3). Implementation MUST proceed incrementally: P1 story implemented → validated → deployed before P2 begins.

**Rationale**: Rapid iteration and early validation prevent over-engineering. Independent stories enable parallel work and phased releases.

**Testable Gates**:
- Each user story has explicit "Independent Test" scenario
- No task begins without its story's acceptance criteria defined
- Each phase has a validation checkpoint before proceeding

### II. Simplicity Over Abstraction

Favor simple, direct solutions over premature abstraction. When complexity is unavoidable (e.g., multiple services), it MUST be justified in plan.md "Complexity Tracking" section with rationale and rejected alternatives.

**Rationale**: Simple systems are faster to build, easier to debug, and cheaper to maintain. Complexity compounds over time—avoid it unless strictly necessary.

**Rules**:
- Single-service solutions preferred over microservices
- Off-the-shelf solutions (Strapi, Next.js) preferred over custom builds
- Every architectural decision justified against simpler alternatives
- YAGNI principle: build what's needed today, not what might be needed

### III. Security & Privacy Baseline (NON-NEGOTIABLE)

All applications MUST meet baseline security and privacy standards:

**Security**:
- TLS required for all production traffic
- Secrets MUST NOT be committed to repository (use .env, vault, or config management)
- Authentication required for all user data access
- CORS policies configured restrictively

**Privacy**:
- Collect minimal PII necessary for functionality
- Emails and PII MUST NOT appear in application logs
- User-initiated data export MUST be supported (manual fulfillment acceptable for MVP)
- User-initiated account deletion MUST be supported (manual fulfillment acceptable for MVP)
- Consent required for data sharing by default (may be configurable)

**Rationale**: Security breaches and privacy violations are existential risks. Baseline protections are non-negotiable, even in MVP.

### IV. Operability & Observability

Applications MUST be observable and operable in production:

**Logging**:
- Structured JSON logging required for all services
- Request IDs tracked across service boundaries
- Log levels: ERROR (actionable), WARN (investigate), INFO (audit trail), DEBUG (development only)
- No PII in logs (email, passwords, tokens)

**Health & Metrics**:
- `/health` endpoint (readiness check)
- Basic metrics exposed: request count, p50/p95 latency, error rate
- KPI metrics for business monitoring (e.g., connections_today, onboarded_users)

**Error Handling**:
- Errors return consistent structure (message, code, requestId)
- Client errors (4xx) vs server errors (5xx) distinguished
- Retryable errors indicated

**Rationale**: You cannot improve what you cannot measure. Observability enables fast issue detection and data-driven optimization.

### V. Contracts & Migrations

Public APIs and data schemas MUST follow versioning and migration discipline:

**API Versioning**:
- Use SemVer (MAJOR.MINOR.PATCH) for public endpoints
- MAJOR: breaking changes (remove fields, change types, remove endpoints)
- MINOR: additive changes (new fields, new endpoints)
- PATCH: bug fixes, documentation
- GraphQL: document breaking changes in CHANGELOG; prefer additive changes

**Database Migrations**:
- Forward-only migrations preferred
- Include rollback notes if data transformations irreversible
- Test migrations on staging before production
- No destructive migrations without backup confirmation

**Rationale**: Breaking changes cascade to clients and cause outages. Disciplined versioning and migrations prevent production incidents.

## Security & Privacy Requirements

### Data Handling

- **Encryption**: All data in transit encrypted (TLS 1.2+). Data at rest encryption for production databases.
- **Authentication**: Google OAuth for MVP; support for additional providers in future.
- **Authorization**: Role-based access control via Strapi permissions; authenticated users can only access their own data and public search results.
- **Rate Limiting**: Per-user daily caps enforced (e.g., 10 connections/day for free tier).

### Privacy Compliance

- **Right to Access**: Users can request data export (JSON of profile + connections).
- **Right to Deletion**: Users can request account deletion (removes profile, connections, events).
- **Consent Management**: Connection consent required by default; email reveal only after approval (configurable).
- **Audit Trail**: PrivacyRequest records retained for compliance; fulfillment tracked with timestamps.

### Secrets Management

- Development: `.env` files (gitignored)
- Production: Environment variables via hosting platform or secrets manager
- Never commit: API keys, OAuth secrets, database credentials, JWT secrets

## Quality Gates

### Pre-Implementation

- [ ] Feature has spec.md with user stories and acceptance criteria
- [ ] Plan.md passes Constitution Check
- [ ] Tasks.md complete with dependency order and file paths

### Pre-Deployment

- [ ] All P1 user stories independently tested
- [ ] No secrets or PII in logs (validated via grep)
- [ ] Health endpoint returns 200
- [ ] Metrics endpoint exposes basic stats
- [ ] Quickstart validation steps pass

### Optional (MVP Deferred)

- Unit test coverage >70%
- E2E smoke tests (Playwright) passing
- Performance benchmarks met (95% searches <1.5s)

## Governance

### Amendment Process

1. Propose change with rationale and impact analysis
2. Update constitution.md with version bump:
   - MAJOR: Remove/redefine core principle (requires team approval)
   - MINOR: Add new principle or section (document decision)
   - PATCH: Clarify wording, fix typos
3. Update dependent templates (plan, spec, tasks) for consistency
4. Commit with message: `docs: amend constitution to vX.Y.Z (summary)`

### Compliance Review

- All PRs MUST verify constitution compliance (run checklist in plan.md)
- Complexity deviations MUST be justified in plan.md Complexity Tracking
- Security/privacy violations are blocking (cannot merge until resolved)

### Runtime Guidance

For day-to-day development practices and agent-specific instructions, see `CLAUDE.md` (if present) or project-specific documentation. Constitution defines **what** must be done; runtime guidance defines **how**.

**Version**: 1.0.0 | **Ratified**: 2025-01-02 | **Last Amended**: 2025-01-02
