/**
 * Combine Universities from Multiple Sources
 * - World universities from Hipolabs GitHub repo (10,191 universities)
 * - Indian colleges from VarthanV repo (38,714 institutions)
 */

const fs = require('fs');
const path = require('path');

function cleanName(name) {
  // Remove leading/trailing quotes and extra whitespace
  return name
    .replace(/^["'\s]+|["'\s]+$/g, '') // Remove leading/trailing quotes and spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
}

function loadWorldUniversities() {
  console.log('Loading world universities from Hipolabs data...');

  try {
    const filePath = path.join(__dirname, 'world-universities-raw.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const universities = data.map((u) => ({
      name: cleanName(u.name),
      country: u.country,
      state_province: u['state-province'] || null,
      alpha_two_code: u.alpha_two_code,
      web_pages: u.web_pages,
      domains: u.domains,
      external_id: `hipolabs-${u.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
    }));

    console.log(`Loaded ${universities.length} universities from Hipolabs data`);

    // Show breakdown by country
    const countryCounts = {};
    universities.forEach(u => {
      countryCounts[u.country] = (countryCounts[u.country] || 0) + 1;
    });

    console.log('\nTop 10 countries by university count:');
    Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([country, count]) => {
        console.log(`  ${country}: ${count}`);
      });

    return universities;
  } catch (error) {
    console.error('Error loading world universities:', error);
    return [];
  }
}

function loadIndianColleges() {
  console.log('\nLoading Indian colleges from VarthanV data...');

  try {
    const filePath = path.join(__dirname, '..', 'indian-colleges-raw.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Extract unique universities and colleges
    const uniqueInstitutions = new Set();
    const universities = [];

    data.forEach((entry) => {
      // Clean the names
      const cleanUniversity = cleanName(entry.university);
      const cleanCollege = cleanName(entry.college);

      // Add university
      if (!uniqueInstitutions.has(cleanUniversity)) {
        uniqueInstitutions.add(cleanUniversity);
        universities.push({
          name: cleanUniversity,
          country: 'India',
          state_province: entry.state,
          alpha_two_code: 'IN',
          external_id: `india-univ-${cleanUniversity.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        });
      }

      // Add college as separate entry
      const collegeName = `${cleanCollege} (${entry.district})`;
      if (!uniqueInstitutions.has(collegeName)) {
        uniqueInstitutions.add(collegeName);
        universities.push({
          name: collegeName,
          country: 'India',
          state_province: entry.state,
          alpha_two_code: 'IN',
          external_id: `india-college-${cleanCollege.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        });
      }
    });

    console.log(`Loaded ${universities.length} Indian institutions from ${data.length} entries`);
    return universities;
  } catch (error) {
    console.error('Error loading Indian colleges:', error);
    return [];
  }
}

function createCombinedSeed() {
  console.log('Creating combined university seed data...\n');
  console.log('=' .repeat(60));

  // Load world universities from Hipolabs
  const worldUniversities = loadWorldUniversities();

  // Load Indian colleges
  const indianInstitutions = loadIndianColleges();

  // Combine all
  const allUniversities = [...worldUniversities, ...indianInstitutions];

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total universities to seed: ${allUniversities.length}`);
  console.log(`  - World (Hipolabs): ${worldUniversities.length}`);
  console.log(`  - India (VarthanV): ${indianInstitutions.length}`);
  console.log('='.repeat(60));

  // Save to JSON file
  const outputPath = path.join(__dirname, 'universities-seed-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(allUniversities, null, 2));

  console.log(`\n✓ Seed data saved to: ${outputPath}`);
  console.log(`✓ File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

  console.log('\nNext steps:');
  console.log('1. Review the generated file if needed');
  console.log('2. Import into Strapi using: pnpm seed:import');
  console.log('   (Note: This will take several minutes for ~48K records)\n');
}

createCombinedSeed();
