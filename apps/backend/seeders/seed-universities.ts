/**
 * University Seeder Script
 *
 * This script seeds the database with universities from:
 * 1. Hipolabs API (US universities)
 * 2. Indian colleges JSON (downloaded data)
 *
 * Usage: node --loader ts-node/esm seeders/seed-universities.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IndianCollege {
  university: string;
  college: string;
  college_type: string;
  state: string;
  district: string;
}

interface HipolabsUniversity {
  name: string;
  'state-province'?: string;
  country: string;
  alpha_two_code: string;
  web_pages?: string[];
  domains?: string[];
}

interface UniversityRecord {
  name: string;
  country: string;
  state_province?: string;
  alpha_two_code?: string;
  web_pages?: string[];
  domains?: string[];
  external_id?: string;
}

async function fetchUSUniversities(): Promise<UniversityRecord[]> {
  console.log('Fetching US universities from Hipolabs API...');

  try {
    const response = await fetch('http://universities.hipolabs.com/search?country=United%20States');
    const data: HipolabsUniversity[] = await response.json();

    const universities: UniversityRecord[] = data.map((u) => ({
      name: u.name,
      country: u.country,
      state_province: u['state-province'],
      alpha_two_code: u.alpha_two_code,
      web_pages: u.web_pages,
      domains: u.domains,
      external_id: `hipolabs-${u.alpha_two_code}`,
    }));

    console.log(`Fetched ${universities.length} US universities`);
    return universities;
  } catch (error) {
    console.error('Error fetching US universities:', error);
    return [];
  }
}

function loadIndianColleges(): UniversityRecord[] {
  console.log('Loading Indian colleges from JSON file...');

  try {
    const filePath = path.join(__dirname, '..', 'indian-colleges-raw.json');
    const data: IndianCollege[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Extract unique universities and colleges
    const uniqueInstitutions = new Set<string>();
    const universities: UniversityRecord[] = [];

    data.forEach((entry) => {
      // Add university
      if (!uniqueInstitutions.has(entry.university)) {
        uniqueInstitutions.add(entry.university);
        universities.push({
          name: entry.university,
          country: 'India',
          state_province: entry.state,
          alpha_two_code: 'IN',
          external_id: `india-${entry.university.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        });
      }

      // Add college as separate entry if it's different from university
      const collegeName = `${entry.college} (${entry.district})`;
      if (!uniqueInstitutions.has(collegeName)) {
        uniqueInstitutions.add(collegeName);
        universities.push({
          name: collegeName,
          country: 'India',
          state_province: entry.state,
          alpha_two_code: 'IN',
          external_id: `india-${entry.college.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
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

async function seedUniversities() {
  console.log('Starting university seeding...\n');

  // Fetch US universities
  const usUniversities = await fetchUSUniversities();

  // Load Indian colleges
  const indianInstitutions = loadIndianColleges();

  // Combine all universities
  const allUniversities = [...usUniversities, ...indianInstitutions];

  console.log(`\nTotal universities to seed: ${allUniversities.length}`);
  console.log(`  - US: ${usUniversities.length}`);
  console.log(`  - India: ${indianInstitutions.length}`);

  // Save to JSON file for manual import
  const outputPath = path.join(__dirname, 'universities-seed-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(allUniversities, null, 2));

  console.log(`\nSeed data saved to: ${outputPath}`);
  console.log('\nTo import this data into Strapi:');
  console.log('1. Start your Strapi server: pnpm develop');
  console.log('2. Use the Strapi admin panel or run the import script');
  console.log('3. Or use the Strapi data import plugin');
}

// Run the seeder
seedUniversities().catch(console.error);
