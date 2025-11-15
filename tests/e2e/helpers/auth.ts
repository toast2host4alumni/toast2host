import { Page } from '@playwright/test';

/**
 * Mock Google OAuth authentication for testing
 * In a real environment, you'd use Playwright's authentication state or mock OAuth responses
 */
export async function mockGoogleAuth(page: Page, userEmail: string = 'test@example.com') {
  // This is a placeholder - in real tests you would:
  // 1. Mock the OAuth callback
  // 2. Set authentication cookies/tokens
  // 3. Or use Playwright's authentication state

  await page.goto('/auth/callback?mock=true');
  // Assume backend accepts mock parameter in dev/test mode
  await page.evaluate((email) => {
    localStorage.setItem('mock_user', email);
  }, userEmail);
}

/**
 * Complete onboarding flow for a test user
 */
export async function completeOnboarding(page: Page, userData: {
  university: string;
  linkedinUrl: string;
  location: string;
  batchYear?: number;
}) {
  await page.goto('/onboarding');

  // Fill university
  await page.fill('input[placeholder*="Search university"]', userData.university);
  await page.selectOption('select', { label: new RegExp(userData.university, 'i') });

  // Fill LinkedIn URL
  await page.fill('input[placeholder*="linkedin"]', userData.linkedinUrl);

  // Fill location
  await page.fill('input[placeholder*="location"]', userData.location);
  await page.click(`text=${userData.location}`);

  // Fill batch year if provided
  if (userData.batchYear) {
    await page.fill('input[type="number"]', String(userData.batchYear));
  }

  // Submit
  await page.click('button:has-text("Save and continue")');
  await page.waitForURL('/search');
}

/**
 * Login and complete onboarding in one step
 */
export async function setupAuthenticatedUser(page: Page, userEmail: string = 'test@example.com') {
  await mockGoogleAuth(page, userEmail);
  await completeOnboarding(page, {
    university: 'Stanford University',
    linkedinUrl: 'https://linkedin.com/in/testuser',
    location: 'San Francisco, CA',
    batchYear: 2020,
  });
}
