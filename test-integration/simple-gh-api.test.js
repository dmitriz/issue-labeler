const assert = require('assert');
const { listIssues } = require('../src/github-api');

describe('Simple GitHub API Test', function() {
  // Increase timeout for API calls
  this.timeout(15000);
  
  // Check for GitHub credentials
  let hasCredentials = false;
  
  before(function() {
    try {
      require('../.secrets/github');
      hasCredentials = true;
    } catch (error) {
      console.log('GitHub credentials not found. Some tests will be skipped.');
    }
  });
  
  it('should fetch issues within a reasonable time', async function() {
    if (!hasCredentials) {
      this.skip();
      return;
    }
    
    // Create a timer to track API response time
    const startTime = Date.now();
    
    try {
      const issues = await listIssues({});
      const responseTime = Date.now() - startTime;
      
      assert.ok(Array.isArray(issues), 'Issues should be an array');
      console.log(`API responded in ${responseTime}ms with ${issues.length} issues`);
      
      if (issues.length > 0) {
        console.log('First issue:', {
          number: issues[0].number,
          title: issues[0].title,
          state: issues[0].state
        });
      }
    } catch (error) {
      console.error('API error:', error.message);
      throw error;
    }
  });
});