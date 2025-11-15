# Feature Specification: Toast2Host MVP — Alumni Connect

**Feature Branch**: `[001-alumni-connect-mvp]`  
**Created**: 2025-11-02  
**Status**: Draft  
**Input**: User description: "MVP to help users find university alumni and connect with them. Google Sign-In onboarding with mandatory University selection and LinkedIn profile URL, optional batch year, and location capture. Mobile-first UI using existing Toast2Host theme (yellow primary, same fonts as website). After onboarding, a search page lets users enter a location (Google API) and filter by university and batch year. Results list shows name, university, location, and a Connect button; clicking Connect reveals the email address and records a metrics event. Backend preference: Strapi. Use an open-source University API if available."

## Clarifications

### Session 2025-11-02

- Q: How does the recipient get notified of pending connection requests? → A: In-app + Email when configured; if email is not configured, in-app only.
- Q: How do we enable premium capability without payments in MVP? → A: Introduce a Subscription table (plan_tier entitlement) with default tier=free for all users; derive daily connect caps from tier config (free=10/day). Allow manual admin assignment; optional usage-based promotion rule (disabled by default). Payments are explicitly out-of-scope.
- Q: What pagination model should search use? → A: Page + pageSize (default 20, max 50).

## User Scenarios & Testing (mandatory)

### User Story 1 - Onboard with Google + Profile (Priority: P1)

As a new user, I can sign in with Google and complete a minimal profile so I become discoverable.

**Why this priority**: Enables initial user value and data population; required for search and connections.

**Independent Test**: A brand-new user completes onboarding end-to-end and appears in search results for their location and university.

**Acceptance Scenarios**:

1. Given a new visitor, when they choose Google Sign-In and grant permissions, then a profile is created and the user is prompted to provide: University (required), LinkedIn URL (required), Location (required), Batch year (optional).
2. Given a partially completed profile, when required fields are missing, then the user cannot proceed until required fields are provided and validated (including URL format for LinkedIn).

---

### User Story 2 - Search Alumni by Location (Priority: P2)

As a signed-in user, I can search for alumni in a given location and refine results using filters.

**Why this priority**: Core discovery workflow that delivers the primary value proposition.

**Independent Test**: From the search page, entering a location and applying filters returns a list of matching registered users with expected fields.

**Acceptance Scenarios**:

1. Given I am signed in, when I enter a location and click Search, then I see a list of matching users with Name, University, Location, and a Connect or Connected state.
2. Given I apply filters for University and Batch year, when I search again, then results reflect those filters and are ordered by proximity for city-level locations.
3. Given I select a State, when I search, then results include users across that state (no radius filter). If I select a Country, results include users across that country.
4. Given sorting options are available, when I choose Proximity (default with coordinates), Recent, or Name A–Z, then results are ordered accordingly; if coordinates are unavailable, Recent is the default.
5. Given additional filters, when I toggle "Not connected only" and/or enter a name keyword, then results reflect those constraints in combination with University and Batch year filters.
6. Given there are more results than fit on one page, when I click Load more, then the next page (page+1) of results is appended until fewer than `pageSize` are returned.

---

### User Story 3 - Connect with Consent and Reveal Email (Priority: P3)

As a user, I can request to connect; by default the recipient must approve before their email is revealed. Admins can disable consent to allow immediate reveal.

**Why this priority**: Enables the actual connection between users and provides measurable engagement signals.

**Independent Test**: Clicking Connect creates a pending connection; upon recipient approval, the actor sees the email and both users show as Connected in results. With consent disabled, email is revealed immediately and the connection is recorded.

**Acceptance Scenarios**:

1. Given consent is required, when I click Connect, then a pending connection is created and the target can approve; once approved, the email is revealed to the actor and both users display Connected in search results.
2. Given consent is disabled, when I click Connect, then the email is revealed immediately and a connection with status connected is recorded.
3. Given an existing connection, when I see the user again in results, then the Connect button is not shown and I see a Connected indicator.
4. Given repeated Connect clicks on the same user, when I attempt again, then duplicate connections are prevented and actions are idempotent or rate limited.
5. Given email notifications are configured, when I send a connection request, then the recipient receives an in-app notification and an email with approve/deny link.
6. Given email notifications are not configured, when I send a connection request, then the recipient receives an in-app notification and can approve/deny in-app.
7. Given I have reached the daily connect limit, when I try to connect again, then the Connect action is blocked and I see a limit reached message.

---

### Edge Cases

- No results for a given location or filters → show helpful empty state with guidance to broaden filters.
- User has not set location in profile → prompt to add location before searching.
- Invalid LinkedIn URL format → validation error with example format.
- University not found in API → allow free-text entry with warning; flag for later curation.
- Duplicate connection attempts to the same target → prevent duplicates or mark as idempotent.
- Extremely dense areas (many results) → paginate or lazy-load results.

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: System MUST support Google Sign-In for authentication during onboarding.
- **FR-002**: On first sign-in, system MUST require University selection using an open-source directory restricted to US institutions for MVP (default: Hipolabs Universities API with `country=United States`). Allow free-text entry only if not found, flagged for later curation.
- **FR-003**: System MUST require a LinkedIn profile URL and validate basic URL format (https://linkedin.com/in/... or company profiles if applicable).
- **FR-004**: System MUST capture and store user Location during onboarding (free-text plus normalized coordinates if available from Google Places/Geocoding).
- **FR-005**: System MUST allow optional Batch year entry; value may be a single year (YYYY).
- **FR-006**: System MUST allow users to edit University, LinkedIn URL, Location, and Batch year in Profile after onboarding.
- **FR-007**: System MUST provide a Search page with a Location input leveraging Google Places/Maps APIs for suggestions/geocoding.
- **FR-008**: Location semantics: If the input resolves to a city (or finer), use a default 25-mile radius (US units) for proximity search; if a State is selected, return results across that state (no radius); if a Country is selected, return results across that country.
- **FR-009**: System MUST support filters: University (exact match selection) and Batch year (exact or range). Default to current user’s university preselected.
- **FR-010**: System MUST present results with Name, University, coarse Location (city/region), and a Connect or Connected state; results SHOULD be sorted by proximity for city-level searches.
- **FR-011**: Consent-first by default: On Connect, create a pending connection requiring recipient approval; upon approval, reveal the target’s email to the actor and record the action. Admins MAY disable consent via configuration to allow immediate reveal.
- **FR-012**: Rate limiting: The system MUST enforce a per-user daily cap on new connect requests derived from the user's effective plan tier; MVP default tier free=10/day (configurable). Actions MUST be idempotent for the same target and SHOULD be rate limited to mitigate abuse.
- **FR-013**: System MUST implement a Strapi backend with content types for UserProfile, Connection (actor, target, status: pending|connected|rejected, timestamps), and ConnectionEvent (timeline for metrics), and secure endpoints for search and connect actions.
- **FR-016**: When a connection exists (status connected), the search result MUST hide the Connect button and display a Connected indicator.
- **FR-014**: System MUST be mobile-first; UI MUST use the Toast2Host site’s primary yellow color and the same fonts from https://toast2host.net/.
- **FR-015**: System MUST avoid storing or logging secrets/PII beyond what is necessary; emails MUST not appear in logs; use minimal data collection.
- **FR-020**: Account deletion (MVP-ready): The system MUST provide a user-initiated way to request account deletion (in-app settings). Fulfillment MAY be manual via Strapi admin in MVP; the request MUST be tracked and acknowledged to the user.
- **FR-021**: Data export (MVP-ready): The system MUST provide a user-initiated way to request a copy of their personal data (JSON of profile and connections). Fulfillment MAY be manual via Strapi admin in MVP; the request MUST be tracked and acknowledged.
- **FR-022**: Sorting: The search endpoint MUST support `sort=proximity|recent|name`. Default is proximity when coordinates are present; otherwise recent (by profile `updated_at` or recent activity). The UI MUST expose a “Sort by” selector.
- **FR-023**: Additional filters: The search endpoint and UI MUST support additional filters beyond University and Batch year: (a) `not_connected_only` boolean, (b) `name` keyword (case-insensitive contains). Filters MUST combine with existing filters.
 - **FR-024**: API style: The application MUST use GraphQL for app data queries and mutations (via Strapi GraphQL plugin). Health and metrics MAY remain REST endpoints.
- **FR-025**: Pagination: `searchUsers` MUST accept `page` (default 1) and `pageSize` (default 20, max 50). The UI MUST implement incremental loading (Load more) until the final page.
 - **FR-017**: Notifications: The system MUST provide in-app notifications for pending connection requests and SHOULD send email notifications with approve/deny links when email is configured; if email is not configured, only in-app notifications are used.
 - **FR-018**: Entitlements (MVP-ready): The system MUST include a Subscription entitlement model to assign a plan tier per user (e.g., free). All users default to free in MVP. Tier-to-cap mapping (e.g., free=10/day) MUST be configurable. No payment flows in MVP; admin assignment via Strapi is sufficient.
 - **FR-019**: Usage-based promotion (optional, disabled by default): The system SHOULD support (via configuration) an optional usage-based rule that upgrades a user's tier (e.g., to pilot_premium) when thresholds are met (e.g., X accepted connections in Y days). When disabled, all users remain free.
 

### Key Entities (include if feature involves data)

- **UserProfile**: id, auth_provider (google), email, name, university_name, university_external_id?, linkedin_url, location_text, location_lat, location_lng, batch_year?, created_at, updated_at
- **Subscription**: id, user_id, plan_tier (e.g., free), source (manual|usage_rule), starts_at, ends_at?, active (bool), created_at, updated_at
- **Connection**: id, actor_user_id, target_user_id, status (pending|connected|rejected), created_at, updated_at
- **ConnectionEvent**: id, actor_user_id, target_user_id, created_at, origin (search), location_context?, notes?
- **University (external reference)**: name, country, state/province?, domain(s), external_id (if provided by API)
- **PrivacyRequest**: id, user_id, type (deletion|export), status (open|completed), created_at, completed_at?

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: ≥85% of new users complete onboarding (required fields) in under 3 minutes.
- **SC-002**: 95% of searches return a page of results or a clear empty state in under 1.5 seconds.
- **SC-003**: ≥70% of users who complete onboarding perform at least one search within their first session.
- **SC-004**: ≥30% of search sessions include at least one Connect action; all such actions are recorded with zero duplicates.
- **SC-005**: 0 instances of email addresses or secrets appearing in application logs during testing and pilot.
