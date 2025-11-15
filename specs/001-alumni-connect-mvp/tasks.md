---

description: "Task list for Toast2Host MVP — Alumni Connect"
---

# Tasks: Toast2Host MVP — Alumni Connect

**Input**: Design documents from `specs/001-alumni-connect-mvp/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. This MVP does not explicitly request test tasks; include smoke tests later if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app repo with separate frontend and backend
- Backend (Strapi v5): `backend/src/api/<name>/{controllers,routes,services}/`, content types in `backend/src/api/<name>/content-types/<name>/schema.json`
- Frontend (Next.js App Router): `frontend/src/app/`, components in `frontend/src/components/`, libs in `frontend/src/lib/`, hooks in `frontend/src/hooks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure: `backend/`, `frontend/`, `tests/e2e/`
- [X] T002 Initialize Strapi v5 app in `backend/`
- [X] T003 Initialize Next.js 14 (TypeScript) app in `frontend/`
- [X] T004 [P] Configure Tailwind + fonts in `frontend/tailwind.config.ts` and `frontend/src/styles/globals.css`
- [X] T005 [P] Add sample env files `backend/.env.example`, `frontend/.env.local.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Configure Strapi database in `backend/config/database.ts`
- [X] T007 Configure Google OAuth provider in `backend/config/plugins.js`
- [X] T006a Enable TypeScript in Strapi project: add `backend/tsconfig.json` and update Strapi configs to use TS where supported
- [X] T006b Install and configure Strapi GraphQL plugin in `backend/config/plugins.ts`
- [X] T008 [P] Create content type UserProfile in `backend/src/api/user-profile/content-types/user-profile/schema.json`
- [X] T009 [P] Create content type Connection in `backend/src/api/connection/content-types/connection/schema.json`
- [X] T010 [P] Create content type ConnectionEvent in `backend/src/api/connection-event/content-types/connection-event/schema.json`
- [X] T011 [P] Create content type Subscription in `backend/src/api/subscription/content-types/subscription/schema.json`
- [X] T012 [P] Add health/readiness endpoints in `backend/src/api/health/{controllers,routes}/health.js`
- [X] T013 [P] Configure structured JSON logging in `backend/config/server.js`
- [X] T014 [P] Add security/CORS headers in `backend/config/middlewares.js`
- [X] T015 [P] Add custom config (consent, caps, notifications) in `backend/config/custom.js`
- [X] T015a [P] Create content type PrivacyRequest in `backend/src/api/privacy-request/content-types/privacy-request/schema.json`
- [X] T016 [P] Create Zod schemas in `frontend/src/lib/validation/profile.ts` and `frontend/src/lib/validation/search.ts`
- [X] T017 [P] Create GraphQL client in `frontend/src/lib/graphql/client.ts` (urql)
- [X] T017a [P] Add GraphQL Codegen config at `frontend/codegen.ts` and script in `frontend/package.json` to generate `frontend/src/lib/graphql/generated.ts`
- [X] T017b [P] Add GraphQL type definitions (SDL) for custom operations in `backend/src/extensions/graphql/config/schema.ts`
- [X] T018 [P] Auth utilities (store Strapi JWT) in `frontend/src/lib/auth.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Onboard with Google + Profile (Priority: P1) 🎯 MVP

**Goal**: New user signs in with Google, completes profile (University, LinkedIn URL, Location; Batch year optional), and becomes discoverable

**Independent Test**: A brand-new user completes onboarding end-to-end and appears in search results for their location and university

### Implementation for User Story 1 (GraphQL)

- [X] T019 [P] [US1] Implement `Query.me` resolver (current user + profile) in `backend/src/extensions/graphql/resolvers/me.ts`
- [X] T020 [P] [US1] Implement `Mutation.updateMyProfile` resolver in `backend/src/extensions/graphql/resolvers/profile.ts`
- [X] T021 [P] [US1] Implement `Query.universitiesUS` (proxy Hipolabs US-only) in `backend/src/extensions/graphql/resolvers/universities.ts`
- [X] T022 [P] [US1] Build Sign-in page with Google button in `frontend/src/app/signin/page.tsx`
- [X] T023 [P] [US1] Build Onboarding page form (RHF+Zod) in `frontend/src/app/onboarding/page.tsx`
- [X] T024 [P] [US1] UniversitySelect component calling backend proxy in `frontend/src/components/UniversitySelect.tsx`
- [X] T025 [P] [US1] LocationAutocomplete component (Google Places) in `frontend/src/components/LocationAutocomplete.tsx`
- [X] T026 [US1] Submit onboarding via `updateMyProfile` GraphQL mutation in `frontend/src/lib/graphql/operations.ts`
- [X] T027 [US1] Post-onboarding redirect to search in `frontend/src/app/onboarding/page.tsx`
- [ ] T027a [P] [US1] Build Profile Edit page in `frontend/src/app/profile/page.tsx` (reuse form from onboarding, allow editing University, LinkedIn URL, Location, Batch year)

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Search Alumni by Location (Priority: P2)

**Goal**: Search by location with filters (University, Batch year); city → radius, state/country → region

**Independent Test**: Enter location and filters → get list with Connect/Connected state

### Implementation for User Story 2 (GraphQL)

- [X] T028 [P] [US2] Implement `Query.searchUsers` resolver in `backend/src/extensions/graphql/resolvers/search.ts`
- [X] T029 [US2] City-level 25-mile radius logic (bounding box) in `backend/src/extensions/graphql/resolvers/search.ts`
- [X] T030 [US2] State/country region scope logic in `backend/src/extensions/graphql/resolvers/search.ts`
- [X] T031 [P] [US2] Search page UI in `frontend/src/app/search/page.tsx`
- [X] T032 [P] [US2] useSearch hook with TanStack Query in `frontend/src/hooks/useSearch.ts`
- [X] T033 [P] [US2] SearchResults list with Connect/Connected state in `frontend/src/components/SearchResults.tsx`
- [X] T034 [P] [US2] Add University and Batch year filters in `frontend/src/app/search/page.tsx`
- [X] T035 [US2] Empty/loading/error states in `frontend/src/app/search/page.tsx`

### Sorting and Additional Filters for User Story 2

- [X] T059 [P] [US2] Add sort handling (`proximity|recent|name`) in `backend/src/extensions/graphql/resolvers/search.ts`
- [X] T060 [P] [US2] Add `not_connected_only` filter in `backend/src/extensions/graphql/resolvers/search.ts`
- [X] T061 [P] [US2] Add `name` keyword contains filter in `backend/src/extensions/graphql/resolvers/search.ts`
- [X] T062 [P] [US2] Add "Sort by" selector in `frontend/src/app/search/page.tsx`
- [X] T063 [P] [US2] Add "Not connected only" toggle in `frontend/src/app/search/page.tsx`
- [X] T064 [P] [US2] Add name keyword input and plumb to `frontend/src/hooks/useSearch.ts`

### Pagination for User Story 2

- [X] T065 [P] [US2] Implement page/pageSize arguments in `backend/src/extensions/graphql/resolvers/search.ts` with defaults (page=1, pageSize=20, max=50)
- [X] T066 [P] [US2] Add Load more pagination in `frontend/src/app/search/page.tsx` and wire page/pageSize to `frontend/src/hooks/useSearch.ts`

**Checkpoint**: User Stories 1 AND 2 are functional and independent

---

## Phase 5: User Story 3 - Connect with Consent and Reveal Email (Priority: P3)

**Goal**: Request connect, default consent approval; reveal email on approval; configurable to immediate reveal; record events; daily cap enforced

**Independent Test**: Click Connect → pending; target approves → Connected state + email; with consent disabled → immediate reveal

### Implementation for User Story 3 (GraphQL)

- [X] T036 [P] [US3] Implement `Mutation.createConnection` resolver in `backend/src/extensions/graphql/resolvers/connection.ts`
- [X] T037 [US3] Enforce daily cap from config in `backend/src/extensions/graphql/resolvers/connection.ts`
- [X] T038 [US3] Implement `Mutation.approveConnection` in `backend/src/extensions/graphql/resolvers/connection.ts`
- [X] T039 [US3] Implement `Mutation.rejectConnection` in `backend/src/extensions/graphql/resolvers/connection.ts`
- [X] T040 [US3] Record ConnectionEvent on request/approve/reject in resolvers
- [X] T041 [P] [US3] Implement `Query.myPendingConnections` in `backend/src/extensions/graphql/resolvers/connection.ts`
- [ ] T042 [P] [US3] Notifications email send (optional) in `backend/src/extensions/email/index.ts`
- [X] T043 [P] [US3] Show Connect/Connected state and handle click in `frontend/src/components/SearchResults.tsx`
- [X] T044 [P] [US3] Requests page to approve/deny in `frontend/src/app/requests/page.tsx` (includes in-app notification display via myPendingConnections query)
- [ ] T045 [US3] Limit reached UI for daily cap in `frontend/src/components/ConnectLimitNotice.tsx`

---

## Phase 6: Privacy Requests (Constitution Compliance, GraphQL)

**Goal**: Provide user-initiated account deletion and data export requests; allow manual fulfillment via Strapi admin in MVP

- [X] T051 [P] Implement `Mutation.createPrivacyRequest` resolver in `backend/src/extensions/graphql/resolvers/privacy.ts`
- [X] T052 [P] Settings page with Privacy section in `frontend/src/app/settings/page.tsx` (Request Data Export, Request Account Deletion)
- [X] T053 Track and list user's PrivacyRequests in `frontend/src/app/settings/page.tsx`
- [X] T054 Admin notes: Document manual fulfillment steps in `specs/001-alumni-connect-mvp/quickstart.md` (Strapi admin export JSON, delete user)

**Checkpoint**: All three user stories independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T046 [P] Documentation updates per quickstart in `specs/001-alumni-connect-mvp/quickstart.md`
- [ ] T047 Add structured request ID logging middleware in `backend/config/middlewares.js`
- [X] T047a [P] Add basic metrics (request count, p50/p95 latency, error rate) via middleware and expose `/metrics` JSON in `backend/src/api/metrics/{controllers,routes}/metrics.js`
- [ ] T048 [P] Verify no emails/secrets in logs across `backend/`
- [ ] T049 UI polish for mobile-first spacing/typography in `frontend/src/styles/globals.css`
- [ ] T050 Run quickstart validation steps in `specs/001-alumni-connect-mvp/quickstart.md`
- [X] T055 [P] Extend `/metrics` to include KPIs (onboarded_users, connections_today) in `backend/src/api/metrics/controllers/metrics.js`
- [X] T056 [P] Add Terms of Service and Privacy Policy pages and footer links in `frontend/src/app/(marketing)/legal/{terms,privacy}/page.tsx` and `frontend/src/components/Footer.tsx`
- [ ] T057 [P] Add OSS license inventory script in `scripts/licenses/generate-licenses.sh` and generate `THIRD_PARTY_LICENSES.md` at repo root (frontend + backend deps)
- [X] T058 Add API versioning checklist to `specs/001-alumni-connect-mvp/contracts/README.md` and policy to bump `contracts/openapi.yaml` info.version on breaking changes

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies - can start immediately
- Foundational (Phase 2): Depends on Setup completion - BLOCKS all user stories
- User Stories (Phase 3+): Depend on Foundational phase completion; implement in priority order or parallel with staffing
- Polish (Final Phase): Depends on desired user stories being complete

### User Story Dependencies

- User Story 1 (P1): Can start after Foundational (Phase 2) - no dependencies on other stories
- User Story 2 (P2): Can start after Foundational (Phase 2) - independent of US1 outputs
- User Story 3 (P3): Can start after Foundational (Phase 2) - integrates with US2 list UI but independently testable

### Within Each User Story

- Models/content types before controllers/routes
- Controllers/services before UI integration
- Core implementation before integration polish

### Parallel Opportunities

- Setup tasks T004-T005 in parallel
- Foundational content types (T008-T011) and frontend libs (T016-T018) in parallel
- US1 frontend components (T022-T025) in parallel with backend routes (T019-T021)
- US2 UI (T031-T034) in parallel with backend search (T028-T030)
- US3 UI (T043-T045) in parallel with backend connections (T036-T042)

---

## Parallel Example: User Story 1

```bash
# Parallelizable tasks for US1
Task: T019 Implement universities proxy in backend/src/api/universities/{controllers,routes}/universities.js
Task: T020 Implement me endpoints in backend/src/api/me/{controllers,routes}/me.js
Task: T022 Build Sign-in page in frontend/src/app/signin/page.tsx
Task: T024 UniversitySelect component in frontend/src/components/UniversitySelect.tsx
Task: T025 LocationAutocomplete component in frontend/src/components/LocationAutocomplete.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: Verify User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Validate → Deploy/Demo (MVP!)
3. Add User Story 2 → Validate → Deploy/Demo
4. Add User Story 3 → Validate → Deploy/Demo
