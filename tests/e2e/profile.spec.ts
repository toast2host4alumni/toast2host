import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';

/**
 * Profile Editing Tests
 *
 * Tests for FR-006: System MUST allow users to edit University, LinkedIn URL,
 * Location, and Batch year in Profile after onboarding.
 */

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('User can navigate to profile edit page', async ({ page }) => {
    // From any page, navigate to profile
    await page.goto('/search');

    // Click profile link (could be in nav/menu)
    await page.click('a[href="/profile"], button:has-text("Profile")');

    await expect(page).toHaveURL('/profile');
    await expect(page.locator('h1')).toContainText(/Edit Profile|Profile/i);
  });

  test('Profile page loads with existing user data', async ({ page }) => {
    await page.goto('/profile');

    // Should show loading state initially
    // Then show pre-filled form

    // Check that fields are populated
    const universitySelect = page.locator('select');
    await expect(universitySelect).not.toHaveValue('');

    const linkedinInput = page.locator('input[placeholder*="linkedin"]');
    await expect(linkedinInput).toHaveValue(/linkedin\.com/i);

    const locationInput = page.locator('input[placeholder*="location"]');
    await expect(locationInput).not.toHaveValue('');

    // Batch year may or may not be filled
  });

  test('User can update University', async ({ page }) => {
    await page.goto('/profile');

    // Change university
    await page.fill('input[placeholder*="Search university"]', 'Harvard');
    await page.waitForSelector('select option:has-text("Harvard")');
    await page.selectOption('select', { label: /Harvard University/i });

    // Save changes
    await page.click('button:has-text("Save")');

    // Should show success message
    await expect(page.locator('text=/updated|success/i')).toBeVisible({ timeout: 5000 });

    // Reload and verify change persisted
    await page.reload();
    const universitySelect = page.locator('select');
    await expect(universitySelect).toHaveValue(/Harvard/i);
  });

  test('User can update LinkedIn URL', async ({ page }) => {
    await page.goto('/profile');

    const newUrl = 'https://linkedin.com/in/updatedprofile';

    // Update LinkedIn URL
    await page.fill('input[placeholder*="linkedin"]', newUrl);

    // Save
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=/updated|success/i')).toBeVisible();

    // Verify persisted
    await page.reload();
    await expect(page.locator('input[placeholder*="linkedin"]')).toHaveValue(newUrl);
  });

  test('User can update Location', async ({ page }) => {
    await page.goto('/profile');

    // Change location
    await page.fill('input[placeholder*="location"]', 'Seattle');
    await page.waitForSelector('text=Seattle, WA');
    await page.click('text=Seattle, WA');

    // Save
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=/updated|success/i')).toBeVisible();

    // Verify persisted
    await page.reload();
    await expect(page.locator('input[placeholder*="location"]')).toHaveValue(/Seattle/i);
  });

  test('User can update Batch year', async ({ page }) => {
    await page.goto('/profile');

    const newYear = '2022';

    // Update batch year
    await page.fill('input[type="number"]', newYear);

    // Save
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=/updated|success/i')).toBeVisible();

    // Verify persisted
    await page.reload();
    await expect(page.locator('input[type="number"]')).toHaveValue(newYear);
  });

  test('User can clear optional Batch year', async ({ page }) => {
    await page.goto('/profile');

    // Clear batch year
    await page.fill('input[type="number"]', '');

    // Save
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=/updated|success/i')).toBeVisible();

    // Verify persisted
    await page.reload();
    await expect(page.locator('input[type="number"]')).toHaveValue('');
  });

  test('Profile validation - required fields enforced', async ({ page }) => {
    await page.goto('/profile');

    // Try to clear required fields
    await page.fill('input[placeholder*="linkedin"]', '');

    // Try to save
    await page.click('button:has-text("Save")');

    // Should show validation error
    await expect(page.locator('text=required').first()).toBeVisible();

    // Should not show success message
    await expect(page.locator('text=/updated|success/i')).not.toBeVisible();
  });

  test('Profile validation - LinkedIn URL format', async ({ page }) => {
    await page.goto('/profile');

    // Enter invalid URL
    await page.fill('input[placeholder*="linkedin"]', 'not-a-valid-url');

    // Try to save
    await page.click('button:has-text("Save")');

    // Should show validation error
    await expect(page.locator('text=/invalid|url/i')).toBeVisible();
  });

  test('Cancel button returns without saving', async ({ page }) => {
    await page.goto('/profile');

    const originalValue = await page.locator('input[type="number"]').inputValue();

    // Make a change
    await page.fill('input[type="number"]', '2025');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Should navigate away (or show confirmation)
    // If navigated away, go back to profile
    await page.goto('/profile');

    // Original value should be preserved
    const currentValue = await page.locator('input[type="number"]').inputValue();
    expect(currentValue).toBe(originalValue);
  });

  test('Success notification auto-dismisses after 3 seconds', async ({ page }) => {
    await page.goto('/profile');

    // Make a small change
    await page.fill('input[type="number"]', '2023');
    await page.click('button:has-text("Save")');

    // Success message appears
    const successMessage = page.locator('text=/updated|success/i');
    await expect(successMessage).toBeVisible();

    // Wait 3.5 seconds
    await page.waitForTimeout(3500);

    // Should auto-dismiss
    await expect(successMessage).not.toBeVisible();
  });

  test('Profile updates reflect in search results', async ({ page }) => {
    await page.goto('/profile');

    // Update to a unique university
    await page.fill('input[placeholder*="Search university"]', 'Yale');
    await page.selectOption('select', { label: /Yale/i });
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=/updated|success/i')).toBeVisible();

    // Go to search and find self
    await page.goto('/search');
    await page.fill('input[placeholder*="location"]', 'New Haven');
    await page.click('button:has-text("Search")');

    // Should see Yale University in results (user's own profile)
    await expect(page.locator('text=Yale')).toBeVisible();
  });

  test('Mobile: Profile editing works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/profile');

    // Form should be responsive
    const linkedinInput = page.locator('input[placeholder*="linkedin"]');
    const box = await linkedinInput.boundingBox();

    // Should be full width on mobile
    expect(box?.width).toBeGreaterThan(300);

    // Can update field
    await linkedinInput.fill('https://linkedin.com/in/mobile');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=/updated|success/i')).toBeVisible();
  });

  test('Error handling - network failure', async ({ page }) => {
    await page.goto('/profile');

    // Simulate network failure
    await page.route('**/graphql', route => route.abort());

    await page.fill('input[type="number"]', '2024');
    await page.click('button:has-text("Save")');

    // Should show error message (not success)
    await expect(page.locator('text=/error|failed/i')).toBeVisible();
    await expect(page.locator('text=/success/i')).not.toBeVisible();
  });
});
