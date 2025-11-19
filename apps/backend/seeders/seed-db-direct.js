/**
 * Direct Database Seeder for Universities
 * Much faster than API import - seeds directly into SQLite
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', '.tmp', 'data.db');
const SEED_FILE = path.join(__dirname, 'universities-seed-data.json');

function seedUniversities() {
  console.log('Direct Database Seeding\n');
  console.log('='.repeat(60));

  // Check if seed file exists
  if (!fs.existsSync(SEED_FILE)) {
    console.error('❌ Seed data file not found!');
    console.error('   Run: pnpm seed:prepare first');
    process.exit(1);
  }

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found!');
    console.error('   Make sure Strapi has been run at least once');
    process.exit(1);
  }

  console.log('📁 Database:', DB_PATH);
  console.log('📄 Seed file:', SEED_FILE);
  console.log('');

  // Open database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  try {
    // First, clean existing universities
    console.log('🧹 Cleaning existing universities...');
    const deleteResult = db.prepare('DELETE FROM universities').run();
    console.log(`   Deleted ${deleteResult.changes} existing records\n`);

    // Load seed data
    console.log('📖 Loading seed data...');
    const universities = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    console.log(`   Found ${universities.length} universities to import\n`);

    // Prepare insert statement
    const insert = db.prepare(`
      INSERT INTO universities (
        document_id, name, country, state_province, alpha_two_code,
        web_pages, domains, external_id,
        created_at, updated_at, published_at,
        created_by_id, updated_by_id, locale
      ) VALUES (
        @document_id, @name, @country, @state_province, @alpha_two_code,
        @web_pages, @domains, @external_id,
        @created_at, @updated_at, @published_at,
        NULL, NULL, NULL
      )
    `);

    // Insert in transaction for speed
    console.log('💾 Inserting universities...');
    const now = new Date().toISOString();

    // Helper function to generate unique document_id
    function generateDocumentId() {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 25; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    const insertMany = db.transaction((universities) => {
      for (const university of universities) {
        insert.run({
          document_id: generateDocumentId(),
          name: university.name,
          country: university.country,
          state_province: university.state_province || null,
          alpha_two_code: university.alpha_two_code || null,
          web_pages: university.web_pages ? JSON.stringify(university.web_pages) : null,
          domains: university.domains ? JSON.stringify(university.domains) : null,
          external_id: university.external_id || null,
          created_at: now,
          updated_at: now,
          published_at: now,
        });
      }
    });

    const startTime = Date.now();
    insertMany(universities);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ IMPORT COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Imported: ${universities.length} universities`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`⚡ Speed: ${Math.round(universities.length / duration)} records/sec`);
    console.log('='.repeat(60));

    // Verify
    const count = db.prepare('SELECT COUNT(*) as count FROM universities').get();
    console.log(`\n✓ Verification: ${count.count} universities in database`);

  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

seedUniversities();
