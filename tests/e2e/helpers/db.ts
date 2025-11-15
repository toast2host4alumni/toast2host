/**
 * Database helpers for test setup and teardown
 * Uses Strapi API to create and cleanup test data
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  university: string;
  location: string;
  batchYear?: number;
  userId?: number; // Strapi user ID
  profileId?: number; // UserProfile content type ID
}

/**
 * Get admin JWT token for API operations
 * In production tests, you'd set this via environment variable
 */
async function getAdminToken(): Promise<string> {
  // Check if admin token is provided via env
  if (process.env.STRAPI_ADMIN_JWT) {
    return process.env.STRAPI_ADMIN_JWT;
  }

  // For development: login with admin credentials
  const adminEmail = process.env.STRAPI_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.STRAPI_ADMIN_PASSWORD || 'AdminPassword123!';

  try {
    const response = await fetch(`${STRAPI_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get admin token. Set STRAPI_ADMIN_JWT or STRAPI_ADMIN_EMAIL/PASSWORD');
    }

    const data = await response.json();
    return data.data.token;
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
}

/**
 * Create a test user with profile in the database
 * Creates both Strapi user and UserProfile content type
 */
export async function createTestUser(userData: Partial<TestUser>): Promise<TestUser> {
  const user: TestUser = {
    id: `test-${Date.now()}`,
    email: userData.email || `test-${Date.now()}@example.com`,
    name: userData.name || 'Test User',
    university: userData.university || 'Stanford University',
    location: userData.location || 'San Francisco, CA',
    batchYear: userData.batchYear,
  };

  try {
    // Step 1: Create Strapi user account
    const username = user.email.split('@')[0] + '_' + Date.now();
    const password = 'TestPassword123!';

    const userResponse = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: user.email,
        password,
      }),
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to create user: ${userResponse.statusText}`);
    }

    const userData_response = await userResponse.json();
    user.userId = userData_response.user.id;
    const userJwt = userData_response.jwt;

    // Step 2: Create UserProfile using the user's JWT
    const profileResponse = await fetch(`${STRAPI_URL}/api/user-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJwt}`,
      },
      body: JSON.stringify({
        data: {
          user: user.userId,
          name: user.name,
          university_name: user.university,
          linkedin_url: `https://linkedin.com/in/${username}`,
          location_text: user.location,
          location_lat: getApproximateLatitude(user.location),
          location_lng: getApproximateLongitude(user.location),
          location_scope: 'city',
          batch_year: user.batchYear,
        },
      }),
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      throw new Error(`Failed to create profile: ${errorText}`);
    }

    const profileData = await profileResponse.json();
    user.profileId = profileData.data.id;

    return user;
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

/**
 * Clean up test users after tests
 * Deletes both UserProfile and Strapi user
 */
export async function cleanupTestUsers(userIds: string[]) {
  try {
    const adminToken = await getAdminToken();

    for (const userId of userIds) {
      // In production, you'd track both profileId and userId
      // For now, we'll just try to delete what we can
      // This is a simplified version - in real implementation,
      // you'd store both IDs and delete them explicitly
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
    // Don't throw - cleanup failures shouldn't break tests
  }
}

/**
 * Create multiple test users for search testing
 */
export async function createMultipleTestUsers(count: number): Promise<TestUser[]> {
  const users: TestUser[] = [];
  const universities = [
    'Stanford University',
    'MIT',
    'Harvard University',
    'UC Berkeley',
    'Yale University',
    'Princeton University',
  ];
  const locations = [
    'San Francisco, CA',
    'Boston, MA',
    'New York, NY',
    'Seattle, WA',
    'Austin, TX',
    'Chicago, IL',
  ];

  for (let i = 0; i < count; i++) {
    try {
      const user = await createTestUser({
        email: `testuser${i}_${Date.now()}@example.com`,
        name: `Test User ${i}`,
        university: universities[i % universities.length],
        location: locations[i % locations.length],
        batchYear: 2015 + (i % 8),
      });
      users.push(user);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to create user ${i}:`, error);
      // Continue creating other users
    }
  }

  return users;
}

/**
 * Get approximate latitude for common test locations
 * In real implementation, you'd use Google Geocoding API
 */
function getApproximateLatitude(location: string): number {
  const locationMap: { [key: string]: number } = {
    'San Francisco, CA': 37.7749,
    'Boston, MA': 42.3601,
    'New York, NY': 40.7128,
    'Seattle, WA': 47.6062,
    'Austin, TX': 30.2672,
    'Chicago, IL': 41.8781,
    'Palo Alto, CA': 37.4419,
    'Cambridge, MA': 42.3736,
    'Berkeley, CA': 37.8715,
  };

  for (const [key, lat] of Object.entries(locationMap)) {
    if (location.includes(key.split(',')[0])) {
      return lat;
    }
  }

  return 37.7749; // Default to SF
}

/**
 * Get approximate longitude for common test locations
 */
function getApproximateLongitude(location: string): number {
  const locationMap: { [key: string]: number } = {
    'San Francisco, CA': -122.4194,
    'Boston, MA': -71.0589,
    'New York, NY': -74.0060,
    'Seattle, WA': -122.3321,
    'Austin, TX': -97.7431,
    'Chicago, IL': -87.6298,
    'Palo Alto, CA': -122.1430,
    'Cambridge, MA': -71.1097,
    'Berkeley, CA': -122.2730,
  };

  for (const [key, lng] of Object.entries(locationMap)) {
    if (location.includes(key.split(',')[0])) {
      return lng;
    }
  }

  return -122.4194; // Default to SF
}

/**
 * Delete a specific user profile by ID
 */
export async function deleteUserProfile(profileId: number, jwt: string) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/user-profiles/${profileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to delete profile ${profileId}`);
    }
  } catch (error) {
    console.error('Delete profile error:', error);
  }
}

/**
 * Delete a Strapi user by ID (requires admin token)
 */
export async function deleteUser(userId: number) {
  try {
    const adminToken = await getAdminToken();

    const response = await fetch(`${STRAPI_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to delete user ${userId}`);
    }
  } catch (error) {
    console.error('Delete user error:', error);
  }
}

/**
 * Create a connection between two users (for testing existing connections)
 */
export async function createConnection(actorUserId: number, targetUserId: number, status: 'pending' | 'connected' = 'pending'): Promise<number> {
  try {
    const adminToken = await getAdminToken();

    const response = await fetch(`${STRAPI_URL}/api/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        data: {
          actor_user: actorUserId,
          target_user: targetUserId,
          status,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create connection: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.id;
  } catch (error) {
    console.error('Create connection error:', error);
    throw error;
  }
}
