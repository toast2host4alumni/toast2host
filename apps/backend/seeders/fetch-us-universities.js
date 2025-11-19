/**
 * Fetch US Universities from Hipolabs API
 * Saves to a separate file for combining later
 */

const fs = require('fs');
const path = require('path');

async function fetchUSUniversitiesWithRetry(retries = 3) {
  console.log('Fetching US universities from Hipolabs API...');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${retries}...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('http://universities.hipolabs.com/search?country=United%20States', {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const universities = data.map((u) => ({
        name: u.name,
        country: u.country,
        state_province: u['state-province'],
        alpha_two_code: u.alpha_two_code,
        web_pages: u.web_pages,
        domains: u.domains,
        external_id: `hipolabs-${u.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      }));

      console.log(`✓ Successfully fetched ${universities.length} US universities`);

      // Save to file
      const outputPath = path.join(__dirname, 'us-universities.json');
      fs.writeFileSync(outputPath, JSON.stringify(universities, null, 2));
      console.log(`✓ Saved to ${outputPath}`);

      return universities;
    } catch (error) {
      console.error(`✗ Attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        console.error('All retry attempts failed. Continuing without US data...');
        return [];
      }

      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${waitTime/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return [];
}

fetchUSUniversitiesWithRetry().catch(console.error);
