const { commentOnIssue } = require('../src/github-api');

console.log('==== COMMENT TEST STARTED ====');

// Make the async function and call it immediately
(async function() {
  try {
    // Get the first open issue from the fetchIssues function
    const { fetchIssues } = require('../src/github-api');
    const issues = await fetchIssues({ state: 'open' });
    
    if (issues.length === 0) {
      console.log('No open issues found. Skipping comment test.');
      return;
    }
    
    const issue_number = issues[0].number;
    console.log(`Attempting to add comment to issue #${issue_number}...`);
    
    const result = await commentOnIssue({ 
      issue_number, 
      body: 'Comment added via API test ✅' 
    });
    
    console.log('Success! Comment added:', {
      id: result.id,
      url: result.html_url,
      created_at: result.created_at,
      body: result.body
    });
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