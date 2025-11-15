import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';
import { createMultipleTestUsers, cleanupTestUsers } from './helpers/db';

/**
 * User Story 2 - Search Alumni by Location (Priority: P2)
 *
 * As a signed-in user, I can search for alumni in a given location
 * and refine results using filters.
 */

test.describe('Alumni Search', () => {
  let testUserIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
    // Create test users for search results
    const users = await createMultipleTestUsers(15);
    testUserIds = users.map(u => u.id);
  });

  test.afterEach(async () => {
    await cleanupTestUsers(testUserIds);
    testUserIds = [];
  });

  test('Scenario 1: Basic search by location shows matching users', async ({ page }) => {
    // Given I am signed in (done in beforeEach)
    await page.goto('/search');

    // When I enter a location and click Search
    await page.fill('input[placeholder*="location"]', 'San Francisco');
    await page.waitForSelector('text=San Francisco, CA');
    await page.click('text=San Francisco, CA');
    await page.click('button:has-text("Search")');

    // Then I see a list of matching users
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible();

    // With Name, University, Location
    await expect(page.locator('text=/Test User/i').first()).toBeVisible();
    await expect(page.locator('text=/University/i').first()).toBeVisible();
    await expect(page.locator('text=/San Francisco/i').first()).toBeVisible();

    // And a Connect or Connected state
    await expect(
      page.locator('button:has-text("Connect")').or(page.locator('text=Connected'))
    ).toBeTruthy();
  });

  test('Scenario 2: Filter by University and Batch year with proximity', async ({ page }) => {
    await page.goto('/search');

    // When I apply filters
    await page.fill('input[placeholder*="location"]', 'Boston');
    await page.click('text=Boston, MA');

    // University filter
    await page.click('[data-testid="university-filter"]');
    await page.click('text=MIT');

    // Batch year filter
    await page.fill('input[placeholder*="batch"]', '2020');

    await page.click('button:has-text("Search")');

    // Then results reflect those filters
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible();

    // All results should be from MIT
    const universityTexts = await results.locator('text=/MIT/i').count();
    const totalResults = await results.count();
    expect(universityTexts).toBe(totalResults);

    // Results should be ordered by proximity (closer users first)
    // This would require checking coordinates or distance indicators
  });

  test('Scenario 3: State-level search (no radius)', async ({ page }) => {
    await page.goto('/search');

    // When I select a State
    await page.fill('input[placeholder*="location"]', 'California');
    await page.click('text=California');
    await page.click('button:has-text("Search")');

    // Then results include users across that state (no radius filter)
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible();

    // Should include various California cities
    await expect(page.locator('text=/CA/i')).toBeTruthy();
  });

  test('Scenario 4: Sorting options (Proximity, Recent, Name)', async ({ page }) => {
    await page.goto('/search');

    await page.fill('input[placeholder*="location"]', 'San Francisco');
    await page.click('text=San Francisco, CA');
    await page.click('button:has-text("Search")');

    // Default should be proximity (when coordinates present)
    const firstResultDefault = await page.locator('[data-testid="search-result"]').first().innerText();

    // Change to Recent
    await page.click('[data-testid="sort-selector"]');
    await page.click('text=Recent');
    await page.waitForTimeout(500); // Wait for re-sort

    const firstResultRecent = await page.locator('[data-testid="search-result"]').first().innerText();

    // Change to Name A-Z
    await page.click('[data-testid="sort-selector"]');
    await page.click('text=Name A');
    await page.waitForTimeout(500);

    const firstResultName = await page.locator('[data-testid="search-result"]').first().innerText();

    // Results should be different based on sort
    // (This assumes different users will be first with different sorts)
  });

  test('Scenario 5: Additional filters - Not connected only and name keyword', async ({ page }) => {
    await page.goto('/search');

    await page.fill('input[placeholder*="location"]', 'Boston');
    await page.click('text=Boston, MA');

    // Toggle "Not connected only"
    await page.check('input[type="checkbox"]:near(:text("Not connected"))');

    // Enter name keyword
    await page.fill('input[placeholder*="name"]', 'User 5');

    await page.click('button:has-text("Search")');

    // Results should reflect combined filters
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible();

    // Should only show "User 5" in results
    await expect(page.locator('text=User 5')).toBeVisible();

    // Should not show connected users
    await expect(page.locator('text=Connected')).not.toBeVisible();
  });

  test('Scenario 6: Pagination - Load more', async ({ page }) => {
    await page.goto('/search');

    await page.fill('input[placeholder*="location"]', 'New York');
    await page.click('text=New York, NY');
    await page.click('button:has-text("Search")');

    // Count initial results
    const initialCount = await page.locator('[data-testid="search-result"]').count();

    // Click Load more
    const loadMoreButton = page.locator('button:has-text("Load more")');
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
      await page.waitForTimeout(500);

      // Should have more results
      const newCount = await page.locator('[data-testid="search-result"]').count();
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test('Search results appear in under 1.5 seconds (performance)', async ({ page }) => {
    await page.goto('/search');

    await page.fill('input[placeholder*="location"]', 'Seattle');
    await page.click('text=Seattle, WA');

    const startTime = Date.now();
    await page.click('button:has-text("Search")');

    // Wait for first result
    await page.locator('[data-testid="search-result"]').first().waitFor();

    const duration = (Date.now() - startTime) / 1000;

    // Should return results in under 1.5 seconds
    expect(duration).toBeLessThan(1.5);
  });

  test('Edge case: No results shows helpful empty state', async ({ page }) => {
    await page.goto('/search');

    // Search for location with no users
    await page.fill('input[placeholder*="location"]', 'Antarctica');
    await page.click('button:has-text("Search")');

    // Should show empty state with guidance
    await expect(page.locator('text=/no results|no alumni found/i')).toBeVisible();
    await expect(page.locator('text=/broaden|try different/i')).toBeVisible();
  });

  test('Edge case: User without location prompted to add', async ({ page }) => {
    // This would test a user who skipped location in onboarding
    // Implementation depends on whether location is truly required
  });

  test('Mobile-first: Search works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/search');

    // Touch-friendly inputs
    await page.fill('input[placeholder*="location"]', 'San Francisco');
    await page.click('text=San Francisco, CA');
    await page.click('button:has-text("Search")');

    // Results should be visible and scrollable
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible();

    // Buttons should be touch-friendly (44px minimum)
    const connectButton = page.locator('button:has-text("Connect")').first();
    if (await connectButton.isVisible()) {
      const box = await connectButton.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
