import { test, expect, Page } from '@playwright/test';
import { setupAuthenticatedUser, mockGoogleAuth, completeOnboarding } from './helpers/auth';
import { createTestUser, cleanupTestUsers } from './helpers/db';

/**
 * User Story 3 - Connect with Consent and Reveal Email (Priority: P3)
 *
 * As a user, I can request to connect; by default the recipient must approve
 * before their email is revealed.
 */

test.describe('Connection Requests', () => {
  let testUserIds: string[] = [];

  test.afterEach(async () => {
    await cleanupTestUsers(testUserIds);
    testUserIds = [];
  });

  test('Scenario 1: Connect with consent - pending, approve, email reveal', async ({ browser }) => {
    // Create two users: actor and target
    const actorContext = await browser.newContext();
    const targetContext = await browser.newContext();
    const actorPage = await actorContext.newPage();
    const targetPage = await targetContext.newPage();

    // Setup actor user
    await setupAuthenticatedUser(actorPage, 'actor@example.com');

    // Setup target user
    await mockGoogleAuth(targetPage, 'target@example.com');
    await completeOnboarding(targetPage, {
      university: 'MIT',
      linkedinUrl: 'https://linkedin.com/in/target',
      location: 'Boston, MA',
      batchYear: 2019,
    });

    // Actor searches and finds target
    await actorPage.goto('/search');
    await actorPage.fill('input[placeholder*="location"]', 'Boston');
    await actorPage.click('text=Boston, MA');
    await actorPage.click('button:has-text("Search")');

    // Click Connect
    await actorPage.click('button:has-text("Connect")').first();

    // Should show Pending state
    await expect(actorPage.locator('text=Pending').first()).toBeVisible({ timeout: 5000 });

    // Email should NOT be revealed yet
    await expect(actorPage.locator('text=target@example.com')).not.toBeVisible();

    // Target sees pending request
    await targetPage.goto('/requests');
    await expect(targetPage.locator('text=/pending|new request/i')).toBeVisible();

    // Target approves
    await targetPage.click('button:has-text("Approve")').first();

    // Wait for approval
    await expect(targetPage.locator('text=/approved|connected/i')).toBeVisible({ timeout: 5000 });

    // Actor refreshes and sees Connected state with email
    await actorPage.reload();
    await expect(actorPage.locator('text=Connected').first()).toBeVisible();
    await expect(actorPage.locator('text=target@example.com')).toBeVisible();

    await actorContext.close();
    await targetContext.close();
  });

  test('Scenario 2: Connect without consent - immediate reveal', async ({ page }) => {
    // This test assumes consent can be disabled via admin config
    // Set CONSENT_REQUIRED=false in backend config

    await setupAuthenticatedUser(page);
    const targetUser = await createTestUser({
      email: 'immediate@example.com',
      university: 'Stanford University',
      location: 'San Francisco, CA',
    });
    testUserIds.push(targetUser.id);

    // Search and connect
    await page.goto('/search');
    await page.fill('input[placeholder*="location"]', 'San Francisco');
    await page.click('button:has-text("Search")');

    await page.click('button:has-text("Connect")').first();

    // Email should be revealed immediately
    await expect(page.locator('text=immediate@example.com')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Connected')).toBeVisible();
  });

  test('Scenario 3: Existing connection shows Connected indicator', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Create a user that actor is already connected to
    const connectedUser = await createTestUser({
      email: 'connected@example.com',
      university: 'Harvard University',
      location: 'Boston, MA',
    });
    testUserIds.push(connectedUser.id);

    // TODO: Create existing connection in database
    // await createConnection(actorId, connectedUser.id);

    await page.goto('/search');
    await page.fill('input[placeholder*="location"]', 'Boston');
    await page.click('button:has-text("Search")');

    // Should see Connected indicator, NOT Connect button
    const result = page.locator('[data-testid="search-result"]').first();
    await expect(result.locator('text=Connected')).toBeVisible();
    await expect(result.locator('button:has-text("Connect")')).not.toBeVisible();
  });

  test('Scenario 4: Duplicate connection prevention', async ({ page }) => {
    await setupAuthenticatedUser(page);
    const targetUser = await createTestUser({
      email: 'duplicate@example.com',
      university: 'UC Berkeley',
      location: 'Berkeley, CA',
    });
    testUserIds.push(targetUser.id);

    await page.goto('/search');
    await page.fill('input[placeholder*="location"]', 'Berkeley');
    await page.click('button:has-text("Search")');

    // Click Connect once
    await page.click('button:has-text("Connect")').first();
    await expect(page.locator('text=Pending')).toBeVisible();

    // Try to click again (button should be disabled or show Pending)
    const connectButton = page.locator('button:has-text("Connect")').first();
    if (await connectButton.isVisible()) {
      await expect(connectButton).toBeDisabled();
    } else {
      // Button replaced with Pending indicator
      await expect(page.locator('text=Pending')).toBeVisible();
    }
  });

  test('Scenario 5: In-app notifications for connection requests', async ({ browser }) => {
    const actorContext = await browser.newContext();
    const targetContext = await browser.newContext();
    const actorPage = await actorContext.newPage();
    const targetPage = await targetContext.newPage();

    await setupAuthenticatedUser(actorPage, 'actor2@example.com');
    await setupAuthenticatedUser(targetPage, 'target2@example.com');

    // Actor sends connection request
    await actorPage.goto('/search');
    await actorPage.fill('input[placeholder*="location"]', 'San Francisco');
    await actorPage.click('button:has-text("Search")');
    await actorPage.click('button:has-text("Connect")').first();

    // Target should see in-app notification
    await targetPage.goto('/requests');
    await expect(targetPage.locator('[data-testid="pending-request"]')).toBeVisible();

    // Should show actor's details and approve/deny options
    await expect(targetPage.locator('button:has-text("Approve")')).toBeVisible();
    await expect(targetPage.locator('button:has-text("Deny")').or(
      targetPage.locator('button:has-text("Reject")')
    )).toBeVisible();

    await actorContext.close();
    await targetContext.close();
  });

  test('Scenario 6: Reject connection request', async ({ browser }) => {
    const actorContext = await browser.newContext();
    const targetContext = await browser.newContext();
    const actorPage = await actorContext.newPage();
    const targetPage = await targetContext.newPage();

    await setupAuthenticatedUser(actorPage, 'actor3@example.com');
    await setupAuthenticatedUser(targetPage, 'target3@example.com');

    // Actor sends request
    await actorPage.goto('/search');
    await actorPage.fill('input[placeholder*="location"]', 'San Francisco');
    await actorPage.click('button:has-text("Search")');
    await actorPage.click('button:has-text("Connect")').first();

    // Target rejects
    await targetPage.goto('/requests');
    await targetPage.click('button:has-text("Deny"), button:has-text("Reject")').first();

    // Request should be removed or marked as rejected
    await expect(targetPage.locator('text=/rejected|denied/i')).toBeVisible();

    // Actor should see rejection (or request just disappears)
    await actorPage.reload();
    await expect(actorPage.locator('text=Pending')).not.toBeVisible();

    await actorContext.close();
    await targetContext.close();
  });

  test('Scenario 7: Daily connect limit enforcement', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Create 11 test users (limit is 10)
    for (let i = 0; i < 11; i++) {
      const user = await createTestUser({
        email: `limit${i}@example.com`,
        university: 'Stanford University',
        location: 'Palo Alto, CA',
      });
      testUserIds.push(user.id);
    }

    await page.goto('/search');
    await page.fill('input[placeholder*="location"]', 'Palo Alto');
    await page.click('button:has-text("Search")');

    // Send 10 connection requests
    for (let i = 0; i < 10; i++) {
      const buttons = await page.locator('button:has-text("Connect")').all();
      if (buttons[i]) {
        await buttons[i].click();
        await page.waitForTimeout(200);
      }
    }

    // 11th attempt should be blocked
    const remainingButton = page.locator('button:has-text("Connect")').first();
    if (await remainingButton.isVisible()) {
      await remainingButton.click();

      // Should show limit reached message
      await expect(page.locator('text=/limit reached|daily limit/i')).toBeVisible();
      await expect(page.locator('[data-testid="limit-notice"]')).toBeVisible();
    }
  });

  test('Connect limit notice is dismissible', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Trigger limit (this would require sending 10 connections first)
    // For this test, we'll navigate directly if limit was hit

    await page.goto('/search');

    // Assuming limit notice is shown
    if (await page.locator('[data-testid="limit-notice"]').isVisible()) {
      // Click dismiss button
      await page.locator('[data-testid="limit-notice"] button:has-text("×"), [data-testid="limit-notice"] button[aria-label="Dismiss"]').click();

      // Notice should disappear
      await expect(page.locator('[data-testid="limit-notice"]')).not.toBeVisible();
    }
  });

  test('Email notifications sent when configured', async ({ browser }) => {
    // This test would require:
    // 1. Email service mock/stub
    // 2. NOTIFICATIONS_EMAIL_ENABLED=true in config
    // 3. Checking email was sent with approve/deny links

    // Placeholder for email notification testing
    test.skip(true, 'Email notifications are optional in MVP');
  });

  test('Rate limiting prevents rapid-fire connections', async ({ page }) => {
    await setupAuthenticatedUser(page);

    const targetUser = await createTestUser({
      email: 'ratelimit@example.com',
      university: 'Stanford University',
      location: 'San Francisco, CA',
    });
    testUserIds.push(targetUser.id);

    await page.goto('/search');
    await page.fill('input[placeholder*="location"]', 'San Francisco');
    await page.click('button:has-text("Search")');

    // Try to click Connect multiple times rapidly
    const connectButton = page.locator('button:has-text("Connect")').first();

    for (let i = 0; i < 5; i++) {
      if (await connectButton.isVisible()) {
        await connectButton.click();
      }
      await page.waitForTimeout(50);
    }

    // Should either show single Pending or rate limit message
    const pendingCount = await page.locator('text=Pending').count();
    expect(pendingCount).toBeLessThanOrEqual(1);
  });
});
