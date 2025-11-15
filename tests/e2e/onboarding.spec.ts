import { test, expect } from '@playwright/test';
import { mockGoogleAuth } from './helpers/auth';

/**
 * User Story 1 - Onboard with Google + Profile (Priority: P1)
 *
 * As a new user, I can sign in with Google and complete a minimal profile
 * so I become discoverable.
 */

test.describe('User Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Scenario 1: Complete onboarding with all required fields', async ({ page }) => {
    // Given a new visitor
    await page.goto('/signin');

    // When they choose Google Sign-In
    await page.click('button:has-text("Sign in with Google")');
    await mockGoogleAuth(page, 'newuser@example.com');

    // Then they are prompted to complete profile
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('h1')).toContainText('Complete your profile');

    // When they provide required fields
    // University (required)
    await page.fill('input[placeholder*="Search university"]', 'Stanford');
    await page.waitForSelector('select option:has-text("Stanford")');
    await page.selectOption('select', { label: /Stanford University/i });

    // LinkedIn URL (required)
    await page.fill('input[placeholder*="linkedin"]', 'https://linkedin.com/in/newuser');

    // Location (required)
    await page.fill('input[placeholder*="location"]', 'San Francisco');
    await page.waitForSelector('text=San Francisco, CA');
    await page.click('text=San Francisco, CA');

    // Batch year (optional)
    await page.fill('input[type="number"]', '2020');

    // When they submit
    await page.click('button:has-text("Save and continue")');

    // Then they are redirected to search page
    await expect(page).toHaveURL('/search');

    // And their profile is created (they appear in search results)
    await page.fill('input[placeholder*="location"]', 'San Francisco');
    await page.click('button:has-text("Search")');

    // Verify user appears in results (would need their name from OAuth)
    await expect(page.locator('text=Stanford University')).toBeVisible();
  });

  test('Scenario 2: Cannot proceed without required fields', async ({ page }) => {
    await mockGoogleAuth(page, 'incomplete@example.com');
    await page.goto('/onboarding');

    // Try to submit without filling required fields
    await page.click('button:has-text("Save and continue")');

    // Should show validation errors
    await expect(page.locator('text=required').first()).toBeVisible();

    // Fill only some required fields
    await page.fill('input[placeholder*="linkedin"]', 'https://linkedin.com/in/test');

    // Try to submit again
    await page.click('button:has-text("Save and continue")');

    // Should still show validation errors for missing fields
    await expect(page.locator('text=required')).toBeVisible();

    // Should not navigate away
    await expect(page).toHaveURL('/onboarding');
  });

  test('Edge case: Invalid LinkedIn URL format', async ({ page }) => {
    await mockGoogleAuth(page, 'badurl@example.com');
    await page.goto('/onboarding');

    // Fill with invalid LinkedIn URL
    await page.fill('input[placeholder*="linkedin"]', 'not-a-valid-url');

    // Fill other required fields
    await page.fill('input[placeholder*="Search university"]', 'MIT');
    await page.selectOption('select', { label: /MIT/i });
    await page.fill('input[placeholder*="location"]', 'Boston');
    await page.click('text=Boston, MA');

    // Try to submit
    await page.click('button:has-text("Save and continue")');

    // Should show URL validation error
    await expect(page.locator('text=/invalid|url/i')).toBeVisible();
    await expect(page).toHaveURL('/onboarding');
  });

  test('Onboarding flow under 3 minutes (performance)', async ({ page }) => {
    const startTime = Date.now();

    await mockGoogleAuth(page, 'speedtest@example.com');
    await page.goto('/onboarding');

    // Fill form quickly
    await page.fill('input[placeholder*="Search university"]', 'Harvard');
    await page.selectOption('select', { label: /Harvard/i });
    await page.fill('input[placeholder*="linkedin"]', 'https://linkedin.com/in/speed');
    await page.fill('input[placeholder*="location"]', 'Boston');
    await page.click('text=Boston, MA');
    await page.fill('input[type="number"]', '2021');

    await page.click('button:has-text("Save and continue")');
    await expect(page).toHaveURL('/search');

    const duration = (Date.now() - startTime) / 1000;

    // Should complete in under 3 minutes (180 seconds)
    // Using 30 seconds as realistic test threshold
    expect(duration).toBeLessThan(30);
  });

  test('University free-text entry when not found', async ({ page }) => {
    await mockGoogleAuth(page, 'freetext@example.com');
    await page.goto('/onboarding');

    // Try to search for university that doesn't exist
    await page.fill('input[placeholder*="Search university"]', 'Unknown University XYZ');

    // Should allow free-text entry or show message
    // Implementation depends on UniversitySelect component behavior
    // This is a placeholder for that functionality
  });
});
