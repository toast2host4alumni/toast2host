/**
 * Seed dummy users and connections for testing
 * Creates test users with profiles and connects some to the current user
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', '.tmp', 'data.db');

function generateDocumentId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 25; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomLocation() {
  const locations = [
    { text: 'New York, NY, USA', lat: 40.7128, lng: -74.0060, scope: 'city' },
    { text: 'San Francisco, CA, USA', lat: 37.7749, lng: -122.4194, scope: 'city' },
    { text: 'Los Angeles, CA, USA', lat: 34.0522, lng: -118.2437, scope: 'city' },
    { text: 'Chicago, IL, USA', lat: 41.8781, lng: -87.6298, scope: 'city' },
    { text: 'Boston, MA, USA', lat: 42.3601, lng: -71.0589, scope: 'city' },
    { text: 'Seattle, WA, USA', lat: 47.6062, lng: -122.3321, scope: 'city' },
    { text: 'Austin, TX, USA', lat: 30.2672, lng: -97.7431, scope: 'city' },
    { text: 'Denver, CO, USA', lat: 39.7392, lng: -104.9903, scope: 'city' },
    { text: 'Miami, FL, USA', lat: 25.7617, lng: -80.1918, scope: 'city' },
    { text: 'Portland, OR, USA', lat: 45.5152, lng: -122.6784, scope: 'city' },
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function generateRandomUniversity() {
  const universities = [
    'Stanford University',
    'Harvard University',
    'MIT',
    'UC Berkeley',
    'Princeton University',
    'Yale University',
    'Columbia University',
    'University of Chicago',
    'Cornell University',
    'University of Pennsylvania',
    'Duke University',
    'Northwestern University',
    'Johns Hopkins University',
    'Caltech',
    'Carnegie Mellon University',
  ];
  return universities[Math.floor(Math.random() * universities.length)];
}

function seedUsersAndConnections() {
  console.log('User & Connection Seeder\n');
  console.log('='.repeat(60));

  if (!require('fs').existsSync(DB_PATH)) {
    console.error('❌ Database not found! Run Strapi first.');
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  try {
    // Find the current logged-in user (get the first user that has a profile)
    const currentUser = db.prepare(`
      SELECT u.id, u.email, up.id as profile_id
      FROM up_users u
      INNER JOIN user_profiles_user_lnk lnk ON lnk.user_id = u.id
      INNER JOIN user_profiles up ON up.id = lnk.user_profile_id
      WHERE up.onboarding_completed = 1
      LIMIT 1
    `).get();

    if (!currentUser) {
      console.error('❌ No user with profile found! Please log in and complete onboarding first.');
      process.exit(1);
    }

    console.log(`👤 Current user: ${currentUser.email} (ID: ${currentUser.id})`);
    console.log('');

    const now = new Date().toISOString();
    const dummyUsers = [];
    const NUM_USERS = 15;
    const NUM_CONNECTED = 5;

    // Create dummy users
    console.log(`Creating ${NUM_USERS} dummy users...`);

    const insertUser = db.prepare(`
      INSERT INTO up_users (
        document_id, username, email, provider, confirmed, blocked,
        created_at, updated_at, published_at
      ) VALUES (
        @document_id, @username, @email, 'local', 1, 0,
        @created_at, @updated_at, @published_at
      )
    `);

    const insertProfile = db.prepare(`
      INSERT INTO user_profiles (
        document_id, first_name, last_name, university_name, location_text,
        location_lat, location_lng, location_scope, batch_year,
        onboarding_completed,
        created_at, updated_at, published_at, locale
      ) VALUES (
        @document_id, @first_name, @last_name, @university_name, @location_text,
        @location_lat, @location_lng, @location_scope, @batch_year,
        1,
        @created_at, @updated_at, @published_at, NULL
      )
    `);

    const linkProfileToUser = db.prepare(`
      INSERT INTO user_profiles_user_lnk (user_profile_id, user_id)
      VALUES (@profile_id, @user_id)
    `);

    const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

    db.transaction(() => {
      for (let i = 0; i < NUM_USERS; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;
        const email = `${username}@test.com`;
        const location = generateRandomLocation();
        const university = generateRandomUniversity();
        const batchYear = 2015 + Math.floor(Math.random() * 10);

        // Insert user
        const userResult = insertUser.run({
          document_id: generateDocumentId(),
          username,
          email,
          created_at: now,
          updated_at: now,
          published_at: now,
        });

        const userId = userResult.lastInsertRowid;

        // Insert profile
        const profileResult = insertProfile.run({
          document_id: generateDocumentId(),
          first_name: firstName,
          last_name: lastName,
          university_name: university,
          location_text: location.text,
          location_lat: location.lat,
          location_lng: location.lng,
          location_scope: location.scope,
          batch_year: batchYear,
          created_at: now,
          updated_at: now,
          published_at: now,
        });

        const profileId = profileResult.lastInsertRowid;

        // Link profile to user
        linkProfileToUser.run({
          profile_id: profileId,
          user_id: userId,
        });

        dummyUsers.push({ userId, name: `${firstName} ${lastName}` });
      }
    })();

    console.log(`✅ Created ${NUM_USERS} dummy users`);
    console.log('');

    // Create connections with some users
    console.log(`Creating ${NUM_CONNECTED} connections...`);

    const insertConnection = db.prepare(`
      INSERT INTO connections (
        document_id, status,
        created_at, updated_at, published_at, locale
      ) VALUES (
        @document_id, 'connected',
        @created_at, @updated_at, @published_at, NULL
      )
    `);

    const linkActorUser = db.prepare(`
      INSERT INTO connections_actor_user_lnk (connection_id, user_id)
      VALUES (@connection_id, @user_id)
    `);

    const linkTargetUser = db.prepare(`
      INSERT INTO connections_target_user_lnk (connection_id, user_id)
      VALUES (@connection_id, @user_id)
    `);

    db.transaction(() => {
      for (let i = 0; i < NUM_CONNECTED; i++) {
        const connResult = insertConnection.run({
          document_id: generateDocumentId(),
          created_at: now,
          updated_at: now,
          published_at: now,
        });

        const connectionId = connResult.lastInsertRowid;

        // Link actor and target users
        linkActorUser.run({
          connection_id: connectionId,
          user_id: currentUser.id,
        });

        linkTargetUser.run({
          connection_id: connectionId,
          user_id: dummyUsers[i].userId,
        });

        console.log(`  ✓ Connected to ${dummyUsers[i].name}`);
      }
    })();

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`👥 Total users created: ${NUM_USERS}`);
    console.log(`🔗 Connections created: ${NUM_CONNECTED}`);
    console.log(`📊 Unconnected users: ${NUM_USERS - NUM_CONNECTED}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    db.close();
  }
}

seedUsersAndConnections();
