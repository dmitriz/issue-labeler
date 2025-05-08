const assert = require('assert');
const { listIssues, addLabelsToIssue, commentOnIssue } = require('../src/github-api');

describe('GitHub API Wrapper Integration', function() {
  // Increase timeout for API calls
  this.timeout(15000);
  
  // Test credentials
  let token, owner, repo, hasCredentials = false;
  
  before(function() {
    // Try to load GitHub credentials
    try {
      const credentials = require('../.secrets/github');
      token = credentials.token;
      owner = credentials.owner;
      repo = credentials.repo;
      hasCredentials = !!token;
    } catch (error) {
      console.log('GitHub credentials not found. Some tests will be skipped.');
    }
  });
  
  it('should fetch issues from the repository', async function() {
    if (!hasCredentials) {
      this.skip();
      return;
    }
    
    const issues = await listIssues({});
    assert.ok(Array.isArray(issues), 'Issues should be an array');
    console.log(`Found ${issues.length} issues`);
  });

  it('should add a label and comment to an issue', async function() {
    if (!hasCredentials) {
      this.skip();
      return;
    }
    
    // Get the first issue
    const issues = await listIssues({});
    if (issues.length === 0) {
      this.skip();
      return;
    }
    
    const targetIssue = issues[0];
    
    // Add a uniquely identifiable test label
    const testLabel = `test-label-${Date.now()}`;
    const labelResult = await addLabelsToIssue({ 
      issue_number: targetIssue.number, 
      labels: [testLabel] 
    });
    
    assert.ok(labelResult, 'Should return a result after adding labels');
    
    // Add a comment
    const commentResult = await commentOnIssue({ 
      issue_number: targetIssue.number, 
      body: `Label ${testLabel} added via API test ✅ [${new Date().toISOString()}]` 
    });
    
    assert.ok(commentResult, 'Should return a result after adding comment');
    assert.ok(commentResult.id, 'Comment should have an ID');
  });
});