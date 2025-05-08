const assert = require('assert');
const { listIssues } = require('../src/github-api');

describe('Fetch Only Test', function() {
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
  
  it('should fetch issues from the repository', async function() {
    if (!hasCredentials) {
      this.skip();
      return;
    }
    
    try {
      console.log('Attempting to fetch issues...');
      const issues = await listIssues({});
      
      assert.ok(Array.isArray(issues), 'Issues should be an array');
      console.log('Success! Retrieved', issues.length, 'issues');
      
      if (issues.length > 0) {
        const issue = issues[0];
        console.log('First issue:', {
          number: issue.number,
          title: issue.title,
          state: issue.state
        });
      }
    } catch (error) {
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  });
});