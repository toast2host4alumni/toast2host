/**
 * Database helpers for test setup and teardown
 * These would interact with your test database to create/cleanup test data
 */

export interface TestUser {
  id: string;
  email: string;
  name: string;
  university: string;
  location: string;
  batchYear?: number;
}

/**
 * Create a test user in the database
 * In real implementation, this would use Strapi API or direct DB access
 */
export async function createTestUser(userData: Partial<TestUser>): Promise<TestUser> {
  // Placeholder - implement with actual Strapi API calls
  const user: TestUser = {
    id: `test-${Date.now()}`,
    email: userData.email || `test-${Date.now()}@example.com`,
    name: userData.name || 'Test User',
    university: userData.university || 'Stanford University',
    location: userData.location || 'San Francisco, CA',
    batchYear: userData.batchYear,
  };

  // TODO: Call Strapi API to create user
  // const response = await fetch('http://localhost:1337/api/user-profiles', {...});

  return user;
}

/**
 * Clean up test users after tests
 */
export async function cleanupTestUsers(userIds: string[]) {
  // Placeholder - implement with actual Strapi API calls
  // TODO: Delete users and their associated data
}

/**
 * Create multiple test users for search testing
 */
export async function createMultipleTestUsers(count: number): Promise<TestUser[]> {
  const users: TestUser[] = [];
  const universities = ['Stanford University', 'MIT', 'Harvard University', 'UC Berkeley'];
  const locations = ['San Francisco, CA', 'Boston, MA', 'New York, NY', 'Seattle, WA'];

  for (let i = 0; i < count; i++) {
    users.push(await createTestUser({
      email: `testuser${i}@example.com`,
      name: `Test User ${i}`,
      university: universities[i % universities.length],
      location: locations[i % locations.length],
      batchYear: 2015 + (i % 8),
    }));
  }

  return users;
}
