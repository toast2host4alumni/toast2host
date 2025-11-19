/**
 * University Import Script for Strapi
 *
 * This script imports universities directly into Strapi database using Strapi's API
 * Run this after Strapi is running: node --loader ts-node/esm seeders/import-universities.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const BATCH_SIZE = 100;

interface UniversityRecord {
  name: string;
  country: string;
  state_province?: string;
  alpha_two_code?: string;
  web_pages?: string[];
  domains?: string[];
  external_id?: string;
}

async function importUniversities() {
  console.log('Reading seed data...');

  const seedDataPath = path.join(__dirname, 'universities-seed-data.json');

  if (!fs.existsSync(seedDataPath)) {
    console.error('Seed data file not found. Run seed-universities.ts first!');
    process.exit(1);
  }

  const universities: UniversityRecord[] = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

  console.log(`Found ${universities.length} universities to import`);
  console.log(`Importing to ${STRAPI_URL}/api/universities`);

  // NOTE: This requires authentication. For production, you'll need to:
  // 1. Generate an API token in Strapi admin panel
  // 2. Pass it as Authorization: Bearer <token>

  let imported = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < universities.length; i += BATCH_SIZE) {
    const batch = universities.slice(i, i + BATCH_SIZE);

    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(universities.length / BATCH_SIZE)}`);

    for (const university of batch) {
      try {
        const response = await fetch(`${STRAPI_URL}/api/universities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: university }),
        });

        if (response.ok) {
          imported++;
          if (imported % 100 === 0) {
            console.log(`  Imported ${imported} universities...`);
          }
        } else {
          errors++;
          if (errors <= 5) {
            // Only log first 5 errors to avoid spam
            console.error(`  Error importing ${university.name}: ${response.statusText}`);
          }
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.error(`  Error importing ${university.name}:`, error);
        }
      }
    }
  }

  console.log(`\nImport complete!`);
  console.log(`  Successfully imported: ${imported}`);
  console.log(`  Errors: ${errors}`);
}

importUniversities().catch(console.error);
