const assert = require('assert');
const { addLabelsToIssue, listIssues } = require('../src/github-api');

describe('Label API Test', function() {
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
  
  it('should add a label to an issue', async function() {
    if (!hasCredentials) {
      this.skip();
      return;
    }
    
    // Use command-line arguments, environment variables, or default to first issue
    let issue_number = parseInt(process.env.TEST_ISSUE_NUMBER || process.argv[2]);
    
    // If no issue number provided, get the first open issue
    if (!issue_number) {
      const issues = await listIssues({ state: 'open' });
      if (issues.length === 0) {
        console.log('No open issues found. Skipping label test.');
        this.skip();
        return;
      }
      issue_number = issues[0].number;
    }
    
    console.log(`Attempting to add label to issue #${issue_number}...`);
    
    const testLabel = process.env.TEST_LABEL || process.argv[3] || `test-label-${Date.now()}`;
    const result = await addLabelsToIssue({
      issue_number,
      labels: [testLabel]
    });
    
    assert.ok(result, 'Should return a result after adding label');
    console.log('Success! Label added.');
  });
});