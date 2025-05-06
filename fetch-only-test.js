const { fetchIssues } = require('./scripts/github-api');

console.log('==== FETCH ONLY TEST STARTED ====');

// Make the async function and call it immediately
(async function() {
  try {
    console.log('Attempting to fetch issues...');
    const issues = await fetchIssues({});
    console.log('Success! Retrieved', issues.length, 'issues');
    
    if (issues.length > 0) {
      const issue = issues[0];
      console.log('First issue:', {
        number: issue.number,
        title: issue.title,
        state: issue.state
      });
    }
    console.log('==== TEST COMPLETED SUCCESSFULLY ====');
  } catch (error) {
    console.error('==== TEST FAILED ====');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
})();