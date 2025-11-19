# University Seeder

This directory contains scripts to seed the Strapi database with university data from multiple sources.

## Data Sources

1. **World Universities (10,191)**: From Hipolabs GitHub repository
   - Includes 2,349 US universities
   - 474 Indian universities from Hipolabs
   - Universities from 200+ countries
2. **Indian Colleges (38,714)**: From VarthanV/Indian-Colleges-List GitHub repository
   - AISHE survey data from data.gov.in
   - Both universities and affiliated colleges

**Total: 48,905 institutions**

## Prerequisites

1. Strapi backend must be running
2. University content type must be created in Strapi
3. Dependencies must be installed: `pnpm install`

## Usage

### Step 1: Prepare Seed Data

This step downloads US universities from Hipolabs API and processes Indian colleges data:

```bash
pnpm seed:prepare
```

This will create `seeders/universities-seed-data.json` containing all universities to import.

### Step 2: Import into Strapi

Make sure your Strapi backend is running, then:

```bash
pnpm seed:import
```

This will import all universities into your Strapi database via the API.

**Note**: For production deployments, you may need to:
1. Generate an API token in Strapi admin panel (Settings > API Tokens)
2. Update the import script to include the token in the Authorization header

## Data Structure

Each university record contains:

```typescript
{
  name: string              // University/college name
  country: string           // Country (e.g., "United States", "India")
  state_province?: string   // State or province
  alpha_two_code?: string   // ISO country code (e.g., "US", "IN")
  web_pages?: string[]      // Array of web URLs
  domains?: string[]        // Array of domain names
  external_id?: string      // Unique identifier from source
}
```

## Indian Colleges Data

The Indian colleges data includes:
- 43,000+ institutions from AISHE survey data
- Both universities and affiliated colleges
- State and district information
- Sourced from data.gov.in via GitHub repository

## Troubleshooting

### "Seed data file not found"
Run `pnpm seed:prepare` first to generate the seed data.

### "Error importing universities"
- Ensure Strapi is running on localhost:1337
- Check that the University content type exists
- Verify you have the correct permissions

### Large dataset taking too long
The import processes universities in batches of 100. For faster imports, you can:
1. Filter the data before importing
2. Increase the BATCH_SIZE constant in import-universities.ts
3. Use direct database imports instead of API calls

## Manual Import Alternative

If the API import fails, you can manually import using:

1. Strapi Admin Panel: Content Manager > Universities > Import from file
2. Database tools: Import `universities-seed-data.json` directly into your database
3. Custom migration script using Strapi's database lifecycle hooks
