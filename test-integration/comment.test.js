const { commentOnIssue, listIssues } = require('../src/github-api');

console.log('==== COMMENT TEST STARTED ====');

// Make the async function and call it immediately
(async function() {
  try {
    // Check if we have GitHub credentials before attempting to run the test
    try {
      require('../.secrets/github');
    } catch (error) {
      console.log('Skipping test: GitHub credentials not found. Create .secrets/github.js to run this test.');
      process.exit(0); // Exit gracefully
      return;
    }
    
    // Get the first open issue using listIssues instead of fetchIssues
    const issues = await listIssues({ state: 'open' });
    
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