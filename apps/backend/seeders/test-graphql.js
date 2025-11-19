/**
 * Test GraphQL Universities Query
 */

async function testQuery() {
  console.log('Testing GraphQL universitiesUS query...\n');

  try {
    const response = await fetch('http://localhost:1337/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{
          universitiesUS(q: "Harvard") {
            name
            country
            state
          }
        }`
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(data.errors, null, 2));
    } else {
      console.log('✅ Query successful!\n');
      console.log('Results:', JSON.stringify(data.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testQuery();
