const { fetchIssues } = require('./scripts/github-api');

// Simple promise-based timeout to detect if the API call is hanging
const timeout = (ms) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
);

// Race between the API call and a timeout
(async () => {
  try {
    console.log('Starting API test...');
    // Race between the API call and a 10-second timeout
    const issues = await Promise.race([
      fetchIssues({}),
      timeout(10000)  // 10-second timeout
    ]);
    
    console.log('API call successful!');
    console.log(`Found ${issues.length} issues`);
    if (issues.length > 0) {
      console.log('First issue:', {
        number: issues[0].number,
        title: issues[0].title,
        state: issues[0].state
      });
    }
  } catch (error) {
    console.error('Error occurred:');
    console.error('Message:', error.message);
    
    // Additional debugging for API errors
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
})();