const assert = require('assert');
const { commentOnIssue, listIssues } = require('../src/github-api');

describe('Comment API Test', function() {
  // Increase timeout for API calls
  this.timeout(10000);
  
  // Test credentials
  let hasCredentials = false;
  
  before(function() {
    try {
      require('../.secrets/github');
      hasCredentials = true;
    } catch (error) {
      console.log('GitHub credentials not found. Some tests will be skipped.');
    }
  });
  
  it('should add a comment to an issue', async function() {
    if (!hasCredentials) {
      this.skip();
      return;
    }
    
    // Get the first open issue
    const issues = await listIssues({ state: 'open' });
    
    if (issues.length === 0) {
      console.log('No open issues found. Skipping comment test.');
      this.skip();
      return;
    }
    
    const issue_number = issues[0].number;
    console.log(`Attempting to add comment to issue #${issue_number}...`);
    
    const result = await commentOnIssue({ 
      issue_number, 
      body: 'Comment added via API test ✅' 
    });
    
    assert.ok(result, 'Should return a result after adding comment');
    assert.ok(result.id, 'Comment should have an ID');
    
    console.log('Success! Comment added:', {
      id: result.id,
      url: result.html_url,
      created_at: result.created_at,
      body: result.body
    });
  });
});