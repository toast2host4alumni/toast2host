import { Page } from '@playwright/test';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const FRONTEND_URL = process.env.BASE_URL || 'http://localhost:3000';

interface AuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * Create a test user and authenticate via Strapi
 * Uses Strapi's local registration endpoint to bypass Google OAuth
 */
export async function mockGoogleAuth(page: Page, userEmail: string = 'test@example.com'): Promise<string> {
  const username = userEmail.split('@')[0] + '_' + Date.now();
  const password = 'TestPassword123!';

  try {
    // Register a new test user via Strapi
    const response = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: userEmail,
        password,
      }),
    });

    if (!response.ok) {
      // User might already exist, try to login
      const loginResponse = await fetch(`${STRAPI_URL}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: userEmail,
          password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(`Failed to authenticate: ${loginResponse.statusText}`);
      }

      const loginData: AuthResponse = await loginResponse.json();
      await setAuthToken(page, loginData.jwt);
      return loginData.jwt;
    }

    const data: AuthResponse = await response.json();

    // Set JWT in the browser
    await setAuthToken(page, data.jwt);

    return data.jwt;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

/**
 * Set authentication token in the browser
 * Uses 't2h_token' key to match frontend implementation
 */
async function setAuthToken(page: Page, jwt: string) {
  await page.goto(FRONTEND_URL);

  // Set JWT in localStorage using the correct key from frontend/src/lib/auth.ts
  await page.evaluate((token) => {
    localStorage.setItem('t2h_token', token);
  }, jwt);

  // Reload to apply authentication
  await page.reload();
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

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Complete your profile")', { timeout: 10000 });

  // Fill university
  await page.fill('input[placeholder*="Search university"]', userData.university);
  await page.waitForSelector('select option', { timeout: 5000 });

  // Select from dropdown (try exact match or partial)
  const options = await page.locator('select option').allTextContents();
  const matchingOption = options.find(opt => opt.includes(userData.university));

  if (matchingOption) {
    await page.selectOption('select', { label: matchingOption });
  } else {
    // Fallback: select first option if available
    await page.selectOption('select', { index: 1 });
  }

  // Fill LinkedIn URL
  await page.fill('input[placeholder*="linkedin"]', userData.linkedinUrl);

  // Fill location (simplified - just fill the text)
  await page.fill('input[placeholder*="location"]', userData.location);

  // Wait a bit for location autocomplete to appear
  await page.waitForTimeout(1000);

  // Try to click the location suggestion if it appears
  const locationSuggestion = page.locator(`text=${userData.location}`).first();
  if (await locationSuggestion.isVisible({ timeout: 2000 }).catch(() => false)) {
    await locationSuggestion.click();
  }

  // Fill batch year if provided
  if (userData.batchYear) {
    await page.fill('input[type="number"]', String(userData.batchYear));
  }

  // Submit
  await page.click('button:has-text("Save and continue"), button:has-text("Save")');

  // Wait for navigation
  await page.waitForURL('/search', { timeout: 10000 });
}

/**
 * Login and complete onboarding in one step
 */
export async function setupAuthenticatedUser(page: Page, userEmail: string = 'test@example.com'): Promise<string> {
  const jwt = await mockGoogleAuth(page, userEmail);

  // Check if user needs onboarding
  await page.goto('/');

  const currentUrl = page.url();
  if (currentUrl.includes('/onboarding')) {
    await completeOnboarding(page, {
      university: 'Stanford University',
      linkedinUrl: 'https://linkedin.com/in/testuser',
      location: 'San Francisco, CA',
      batchYear: 2020,
    });
  }

  return jwt;
}

/**
 * Get current authenticated user's JWT from the page
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('t2h_token');
  });
}

/**
 * Logout and clear authentication
 */
export async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('t2h_token');
  });
  await page.goto('/');
}
