/**
 * End-to-end test for label-all-issues workflow
 * Tests the complete batch issue labeling process from start to finish
 */
const assert = require('assert');
const { labelAllIssues } = require('../src/label-all-issues');
const api = require('../src/github-api');

describe('Label All Issues E2E', function() {
  // Increase timeout for E2E tests
  this.timeout(30000);
  
  // Limit number of issues to test with (keep small)
  const MAX_TEST_ISSUES = parseInt(process.env.MAX_TEST_ISSUES || 3);
  
  // Store original issue states to restore after test
  let originalIssueStates = [];
  let testIssues = [];
  
  // Capture original labels before test
  before(async function() {
    try {
      // Skip test if we're in CI without a GitHub token and no explicit flag is set
      if (process.env.CI && !process.env.GITHUB_TOKEN && !process.env.RUN_BATCH_LABEL_TEST) {
        console.log('Skipping batch label test in CI environment without GitHub token');
        this.skip();
        return;
      }
      
      // Get repository info
      const repoInfo = api.getCurrentRepositoryInfo();
      console.log(`Testing with repository: ${repoInfo.owner}/${repoInfo.repo}`);
      
      // Get all open issues but limit to MAX_TEST_ISSUES
      const allIssues = await api.getAllOpenIssues();
      testIssues = allIssues.slice(0, MAX_TEST_ISSUES);
      
      if (testIssues.length === 0) {
        console.log('No open issues found to test with');
        this.skip();
        return;
      }
      
      console.log(`Testing with ${testIssues.length} open issues (limited to ${MAX_TEST_ISSUES})`);
      
      // Store original state of each issue
      for (const issue of testIssues) {
        originalIssueStates.push({
          number: issue.number,
          labels: issue.labels.map(l => l.name)
        });
        console.log(`Added issue #${issue.number} to test set: "${issue.title}"`);
      }
    } catch (error) {
      console.error(`Error in test setup: ${error.message}`);
      throw error;
    }
  });
  
  // Restore original labels after test
  after(async function() {
    if (testIssues.length === 0) {
      return;
    }
    
    console.log('Restoring original issue states...');
    
    // Restore each issue to its original state
    for (const state of originalIssueStates) {
      try {
        await api.updateIssue({
          issue_number: state.number,
          labels: state.labels
        });
        console.log(`Issue #${state.number} state restored`);
      } catch (error) {
        console.error(`Error restoring issue #${state.number}: ${error.message}`);
      }
      
      // Add a small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('All issues restored to original state');
  });

  it('should analyze a batch of open issues and apply appropriate labels', async function() {
    if (testIssues.length === 0) {
      this.skip();
      return;
    }
    
    // Load the repository info from config
    const repoInfo = api.getCurrentRepositoryInfo();
    
    // Create a subset of issues to test with
    const testIssueNumbers = testIssues.map(issue => issue.number);
    console.log(`Testing with issue numbers: ${testIssueNumbers.join(', ')}`);
    
    // Mock getAllOpenIssues to return only our test issues
    const originalGetAllOpenIssues = api.getAllOpenIssues;
    api.getAllOpenIssues = async () => testIssues;
    
    try {
      // Run the batch labeling function
      let result;
      try {
        result = await labelAllIssues({
          owner: repoInfo.owner,
          repo: repoInfo.repo
        });
      } catch (error) {
        // If we get a rate limit error, skip the test
        if (error.message && (
          error.message.includes('Rate limit') || 
          error.message.includes('429') ||
          (error.response && error.response.status === 429)
        )) {
          console.log('API rate limit exceeded. Skipping test.');
          this.skip();
          return;
        }
        throw error; // Re-throw any other error
      }
      
      // If there are rate limited issues in the results, skip the test
      if (result && result.summary && result.summary.rateLimited > 0) {
        console.log('API rate limit encountered during batch processing. Skipping test.');
        this.skip();
        return;
      }
      
      // Verify the result contains expected properties
      assert.ok(result.success, 'Batch labeling should report success');
      assert.ok(result.summary, 'Result should include a summary object');
      assert.strictEqual(result.summary.total, testIssues.length, 
        'Total issues processed should match number of test issues');
      
      // With our new implementation, some issues might fail if they don't match any allowed labels
      // So we need to verify that the summary adds up correctly: success + failed = total
      assert.strictEqual(result.summary.success + result.summary.failed, result.summary.total,
        'Sum of successes and failures should equal total issues');
      
      // Either some issues were labeled, some were skipped, or all failed because no allowed labels were found
      assert.ok(
        result.summary.labeled > 0 || 
        result.summary.skipped > 0 || 
        (result.summary.failed === result.summary.total && result.summary.total > 0),
        'Should have either labeled new issues, skipped already labeled ones, or failed due to no allowed labels'
      );
      
      // Verify that labels were applied by checking each test issue
      const updatedIssues = await Promise.all(
        testIssueNumbers.map(issueNumber => 
          api.getIssue({ issue_number: issueNumber })
        )
      );
      
      // Get our allowed labels from the configuration
      const configLoader = require('../src/config-loader');
      const allowedLabels = configLoader.getLabelConfig().allowedLabels;
      
      // Check that issues have appropriate labels
      let atLeastOneLabeled = false;
      for (const issue of updatedIssues) {
        const appliedLabels = issue.labels.map(l => l.name);
        
        // Check if any of our allowed labels were applied
        const hasAllowedLabels = appliedLabels.some(label => 
          allowedLabels.includes(label.toLowerCase())
        );
        
        // We don't require all issues to have labels (model might not detect them as urgent/important)
        // but we do expect at least some issues to be labeled successfully
        if (hasAllowedLabels) {
          atLeastOneLabeled = true;
          console.log(`Issue #${issue.number} has allowed labels: ${appliedLabels.filter(l => 
            allowedLabels.includes(l.toLowerCase())).join(', ')}`);
        }
      }
      
      // Verify that at least one issue was labeled correctly or all were skipped
      assert.ok(
        atLeastOneLabeled || result.summary.skipped === testIssues.length,
        'At least one issue should have allowed labels or all issues should be skipped'
      );
    } finally {
      // Restore the original function
      api.getAllOpenIssues = originalGetAllOpenIssues;
    }
  });
});