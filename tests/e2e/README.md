# E2E Tests (Playwright)

Comprehensive end-to-end tests for the Toast2Host Alumni Connect MVP.

## Test Coverage

### Test Suites

1. **onboarding.spec.ts** - User Story 1 (P1)
   - Google Sign-In flow
   - Complete profile with required fields
   - Field validation
   - Invalid LinkedIn URL handling
   - Performance testing (< 3 minutes)

2. **search.spec.ts** - User Story 2 (P2)
   - Basic location search
   - University and batch year filters
   - State/country scope searches
   - Sorting (Proximity, Recent, Name A-Z)
   - Additional filters (Not connected only, name keyword)
   - Pagination (Load more)
   - Performance testing (< 1.5 seconds)
   - Empty state handling
   - Mobile responsiveness

3. **connect.spec.ts** - User Story 3 (P3)
   - Connection request with consent
   - Connection approval workflow
   - Email reveal after approval
   - Immediate reveal (consent disabled)
   - Duplicate prevention
   - Daily limit enforcement (10/day)
   - In-app notifications
   - Reject connection requests
   - Rate limiting

4. **profile.spec.ts** - Profile Management
   - Navigate to profile page
   - Load existing profile data
   - Update University, LinkedIn URL, Location, Batch year
   - Field validation
   - Cancel without saving
   - Success notification auto-dismiss
   - Mobile responsiveness

5. **privacy.spec.ts** - Privacy Requests
   - Request data export
   - Request account deletion
   - View request history
   - Confirmation dialogs
   - Multiple requests tracking
   - GDPR compliance messaging
   - Mobile accessibility

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Backend running on http://localhost:1337
- Frontend running on http://localhost:3000

### Installation

```bash
# Install root dependencies (includes Playwright)
pnpm install

# Install Playwright browsers
pnpm test:install
```

### Running Tests

```bash
# Run all tests (headless)
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm playwright test tests/e2e/onboarding.spec.ts

# Run tests matching pattern
pnpm playwright test --grep "User can update"

# Run on specific browser
pnpm playwright test --project=chromium
pnpm playwright test --project="Mobile Chrome"
pnpm playwright test --project="Mobile Safari"
```

### Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browsers**: Desktop Chrome, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure only
- **Traces**: On first retry
- **Web Server**: Auto-starts frontend dev server

## Test Helpers

### Authentication (`helpers/auth.ts`)

```typescript
// Mock Google OAuth for testing
await mockGoogleAuth(page, 'user@example.com');

// Complete onboarding flow
await completeOnboarding(page, {
  university: 'Stanford University',
  linkedinUrl: 'https://linkedin.com/in/test',
  location: 'San Francisco, CA',
  batchYear: 2020,
});

// Setup authenticated user (auth + onboarding)
await setupAuthenticatedUser(page);
```

### Database (`helpers/db.ts`)

```typescript
// Create test user
const user = await createTestUser({
  email: 'test@example.com',
  university: 'MIT',
  location: 'Boston, MA',
});

// Create multiple test users for search
const users = await createMultipleTestUsers(20);

// Cleanup after tests
await cleanupTestUsers(userIds);
```

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup common to all tests
    await setupAuthenticatedUser(page);
  });

  test('Scenario description', async ({ page }) => {
    // Arrange
    await page.goto('/page');

    // Act
    await page.click('button');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use test IDs**: Add `data-testid` attributes for reliable selectors
2. **Wait for elements**: Use `waitFor()` or `expect().toBeVisible()` instead of `waitForTimeout()`
3. **Cleanup**: Always cleanup test data in `afterEach`
4. **Isolate tests**: Each test should be independent
5. **Mobile testing**: Test on both desktop and mobile viewports
6. **Performance**: Track timing for critical user flows
7. **Accessibility**: Verify touch targets (44px minimum)

### Test Data

Mock data should be:
- **Realistic**: Use actual-looking emails, names, locations
- **Isolated**: Don't rely on data from other tests
- **Cleaned up**: Remove test data after tests complete

## CI/CD Integration

Set environment variable `CI=true` to:
- Enable 2 retries on failures
- Run with 1 worker (serial execution)
- Generate test reports

Example GitHub Actions:

```yaml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: pnpm test:install

- name: Run E2E tests
  run: pnpm test:e2e
  env:
    CI: true

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Debugging Tests

```bash
# Debug mode (opens inspector)
pnpm playwright test --debug

# Debug specific test
pnpm playwright test onboarding.spec.ts --debug

# Show browser console
pnpm playwright test --headed --slowmo=1000

# Generate trace
pnpm playwright test --trace on
npx playwright show-trace trace.zip
```

## Test Coverage Goals

- **Acceptance Scenarios**: All scenarios from spec.md covered
- **Edge Cases**: Empty states, validation, errors
- **Performance**: Critical paths under target times
- **Mobile**: Touch targets, responsive layout
- **Accessibility**: WCAG compliance for key interactions

## Known Limitations

1. **OAuth Mocking**: Tests use mocked Google OAuth (not real OAuth flow)
2. **Email Testing**: Email notifications are skipped (optional in MVP)
3. **Database**: Requires manual Strapi API implementation in `helpers/db.ts`
4. **Admin Functions**: Manual fulfillment workflows not tested (admin UI only)

## Future Enhancements

- [ ] Visual regression testing
- [ ] API contract testing
- [ ] Performance benchmarking
- [ ] Accessibility audits (axe-core)
- [ ] Cross-browser compatibility matrix
- [ ] Load testing for search endpoints
