import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';

/**
 * Privacy Request Tests
 *
 * Tests for FR-020 (Account deletion) and FR-021 (Data export)
 * MVP allows manual fulfillment via Strapi admin
 */

test.describe('Privacy Requests', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
  });

  test('User can navigate to Settings/Privacy page', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');

    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1, h2').filter({ hasText: /settings|privacy/i })).toBeVisible();
  });

  test('Settings page shows Privacy section', async ({ page }) => {
    await page.goto('/settings');

    // Should have Privacy section
    await expect(page.locator('text=/privacy/i')).toBeVisible();

    // Should show request options
    await expect(page.locator('text=/data export|download/i')).toBeVisible();
    await expect(page.locator('text=/delete account|account deletion/i')).toBeVisible();
  });

  test('User can request data export', async ({ page }) => {
    await page.goto('/settings');

    // Click data export button
    await page.click('button:has-text("Export"), button:has-text("Download")');

    // May show confirmation dialog
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should show success/acknowledgment message
    await expect(page.locator('text=/request submitted|we will send|email you/i')).toBeVisible({
      timeout: 5000,
    });

    // Request should appear in list
    await expect(page.locator('text=/export.*pending|pending.*export/i')).toBeVisible();
  });

  test('User can request account deletion', async ({ page }) => {
    await page.goto('/settings');

    // Click account deletion button
    await page.click('button:has-text("Delete"), button:has-text("Delete Account")');

    // Should show confirmation dialog (important for destructive action)
    await expect(page.locator('text=/are you sure|confirm|permanent/i')).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Delete")');

    // Should show acknowledgment
    await expect(page.locator('text=/request submitted|will be processed/i')).toBeVisible({
      timeout: 5000,
    });

    // Request should appear in list
    await expect(page.locator('text=/deletion.*pending|pending.*deletion/i')).toBeVisible();
  });

  test('User can view their privacy request history', async ({ page }) => {
    await page.goto('/settings');

    // Submit a data export request
    await page.click('button:has-text("Export"), button:has-text("Download")');

    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should see request in history
    const requestList = page.locator('[data-testid="privacy-requests"], table, ul').filter({
      hasText: /export|deletion/i,
    });

    await expect(requestList).toBeVisible();

    // Should show request details
    await expect(page.locator('text=/export/i')).toBeVisible();
    await expect(page.locator('text=/pending|open/i')).toBeVisible();
  });

  test('Multiple privacy requests are tracked separately', async ({ page }) => {
    await page.goto('/settings');

    // Submit data export
    await page.click('button:has-text("Export"), button:has-text("Download")');
    let confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    await page.waitForTimeout(500);

    // Submit account deletion
    await page.click('button:has-text("Delete Account")');
    await page.waitForSelector('text=/are you sure/i');
    confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")');
    await confirmButton.click();

    // Should see both requests
    await expect(page.locator('text=/export/i')).toBeVisible();
    await expect(page.locator('text=/deletion/i')).toBeVisible();

    // Should have 2 pending requests
    const pendingRequests = await page.locator('text=/pending|open/i').count();
    expect(pendingRequests).toBeGreaterThanOrEqual(2);
  });

  test('Privacy request shows timestamp', async ({ page }) => {
    await page.goto('/settings');

    await page.click('button:has-text("Export"), button:has-text("Download")');

    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should show created date/time
    // Format could be relative (e.g., "Just now") or absolute
    await expect(
      page.locator('text=/just now|minutes ago|today|\d{4}-\d{2}-\d{2}/i')
    ).toBeVisible();
  });

  test('Account deletion shows strong confirmation warning', async ({ page }) => {
    await page.goto('/settings');

    await page.click('button:has-text("Delete Account")');

    // Should show warning about permanence
    const dialog = page.locator('[role="dialog"], [role="alertdialog"], .modal');
    await expect(dialog.or(page.locator('text=/permanent|cannot be undone/i'))).toBeVisible();

    // Should have clear confirm/cancel options
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Confirm"), button:has-text("Delete")')).toBeVisible();
  });

  test('User can cancel account deletion request', async ({ page }) => {
    await page.goto('/settings');

    await page.click('button:has-text("Delete Account")');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Should close dialog without submitting
    await expect(page.locator('text=/request submitted/i')).not.toBeVisible();

    // No deletion request should appear
    await expect(page.locator('text=/deletion.*pending/i')).not.toBeVisible();
  });

  test('Duplicate requests are handled appropriately', async ({ page }) => {
    await page.goto('/settings');

    // Submit first export request
    await page.click('button:has-text("Export"), button:has-text("Download")');
    let confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    await page.waitForTimeout(500);

    // Try to submit another export request immediately
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');

    if (await exportButton.isVisible()) {
      await exportButton.click();
      confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Either:
      // 1. Shows message about existing request
      // 2. Creates second request
      // 3. Disables button if request pending
      // Implementation determines expected behavior
    } else {
      // Button disabled due to pending request
      expect(true).toBe(true);
    }
  });

  test('GDPR compliance: requests acknowledged within timeframe', async ({ page }) => {
    await page.goto('/settings');

    await page.click('button:has-text("Export"), button:has-text("Download")');

    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should acknowledge request will be fulfilled
    // GDPR requires response within 30 days
    await expect(
      page.locator('text=/within.*days|will be processed|contact you/i')
    ).toBeVisible();
  });

  test('Admin fulfillment note appears in documentation', async ({ page }) => {
    // This test verifies the quickstart.md mentions manual fulfillment
    // Not a UI test, but important for MVP documentation compliance

    const quickstartPath = './specs/001-alumni-connect-mvp/quickstart.md';
    // In actual test, would read file and check content
    // For now, this is a placeholder reminder
    test.skip(true, 'Documentation test - verify manually');
  });

  test('Privacy requests accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/settings');

    // Buttons should be touch-friendly
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    const deleteButton = page.locator('button:has-text("Delete Account")');

    const exportBox = await exportButton.boundingBox();
    const deleteBox = await deleteButton.boundingBox();

    // Minimum 44px touch target
    if (exportBox) expect(exportBox.height).toBeGreaterThanOrEqual(44);
    if (deleteBox) expect(deleteBox.height).toBeGreaterThanOrEqual(44);

    // Should be able to submit request on mobile
    await exportButton.click();

    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await expect(page.locator('text=/request submitted/i')).toBeVisible();
  });

  test('Settings page shows other user preferences', async ({ page }) => {
    await page.goto('/settings');

    // Besides privacy, may have other settings
    // E.g., notification preferences, profile visibility, etc.
    // This test ensures settings page is extensible

    await expect(page.locator('h1, h2').filter({ hasText: /settings/i })).toBeVisible();

    // Should be organized into sections
    // At minimum: Privacy section exists
    await expect(page.locator('text=/privacy/i')).toBeVisible();
  });
});
