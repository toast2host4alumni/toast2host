/**
 * Global University Seeder
 *
 * Seeds database with curated universities from:
 * - Americas (US, Canada, Latin America)
 * - EMEA (Europe, Middle East, Africa)
 * - APAC (Asia Pacific)
 *
 * Usage: node seeders/seed-global-universities.js
 */

const fs = require('fs');
const path = require('path');

// Load combined global university data
const allUniversities = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../universities-global.json'), 'utf8'));

console.log(`\nGlobal University Seeder`);
console.log(`========================`);
console.log(`Total: ${allUniversities.length} universities`);

// Count by region
const byCountry = allUniversities.reduce((acc, uni) => {
  acc[uni.country] = (acc[uni.country] || 0) + 1;
  return acc;
}, {});
console.log(`Countries: ${Object.keys(byCountry).length}`);
Object.entries(byCountry).forEach(([country, count]) => {
  console.log(`  ${country}: ${count}`);
});
console.log(``);

async function seedUniversities() {
  const dbPath = path.join(__dirname, '../.tmp/data.db');

  if (!fs.existsSync(dbPath)) {
    console.error('Database not found. Please run Strapi first to create the database.');
    process.exit(1);
  }

  const sqlite3 = require('better-sqlite3');
  const db = sqlite3(dbPath);

  try {
    // Delete all existing universities
    console.log('Deleting existing universities...');
    const deleteResult = db.prepare('DELETE FROM universities').run();
    console.log(`Deleted ${deleteResult.changes} existing universities\n`);

    // Insert new universities
    console.log('Inserting new universities...');

    const insertStmt = db.prepare(`
      INSERT INTO universities (name, country, state_province, alpha_two_code, external_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const insertMany = db.transaction((universities) => {
      for (const uni of universities) {
        insertStmt.run(
          uni.name,
          uni.country,
          uni.state_province,
          uni.alpha_two_code,
          uni.external_id
        );
      }
    });

    insertMany(allUniversities);

    // Verify insertion
    const count = db.prepare('SELECT COUNT(*) as count FROM universities').get();
    console.log(`\n✅ Successfully seeded ${count.count} universities`);

    // Show sample by region
    console.log('\nSample universities by region:');

    const sampleUS = db.prepare(`SELECT name FROM universities WHERE country = 'United States' LIMIT 3`).all();
    console.log('\nAmericas:');
    sampleUS.forEach(u => console.log(`  - ${u.name}`));

    const sampleEU = db.prepare(`SELECT name FROM universities WHERE alpha_two_code IN ('GB', 'DE', 'FR', 'CH') LIMIT 3`).all();
    console.log('\nEMEA:');
    sampleEU.forEach(u => console.log(`  - ${u.name}`));

    const sampleAPAC = db.prepare(`SELECT name FROM universities WHERE alpha_two_code IN ('IN', 'SG', 'AU', 'NZ') LIMIT 3`).all();
    console.log('\nAPAC:');
    sampleAPAC.forEach(u => console.log(`  - ${u.name}`));

    db.close();
    console.log('\n✅ Database seeding complete!\n');
  } catch (error) {
    console.error('Error seeding universities:', error);
    db.close();
    process.exit(1);
  }
}

seedUniversities();
