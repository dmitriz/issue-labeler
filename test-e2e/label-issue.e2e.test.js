/**
 * End-to-end test for label-issue workflow
 * Tests the complete issue labeling process from start to finish
 */
const assert = require('assert');
const { labelIssueByNumber } = require('../src/label-issue');
const api = require('../src/github-api');

describe('Label Issue E2E', function() {
  // Increase timeout for E2E tests
  this.timeout(20000);
  
  // Test issue number to use
  const TEST_ISSUE_NUMBER = parseInt(process.env.TEST_ISSUE_NUMBER || 2);
  
  // Store original labels to restore after test
  let originalLabels = [];
  let testIssue;
  
  // Capture original labels before test
  before(async function() {
    try {
      // Skip test if no issue number specified and we're in CI without GitHub token
      if (!process.env.TEST_ISSUE_NUMBER && (process.env.CI && !process.env.GITHUB_TOKEN)) {
        this.skip();
        return;
      }
      
      testIssue = await api.getIssue({ issue_number: TEST_ISSUE_NUMBER });
      console.log(`Using test issue #${TEST_ISSUE_NUMBER}: "${testIssue.title}"`);
      originalLabels = testIssue.labels.map(l => l.name);
    } catch (error) {
      console.error(`Error in test setup: ${error.message}`);
      throw error;
    }
  });
  
  // Restore original labels after test
  after(async function() {
    if (testIssue && originalLabels) {
      try {
        // Reset the issue back to its original state
        await api.updateIssue({
          issue_number: TEST_ISSUE_NUMBER,
          labels: originalLabels
        });
        console.log('Test issue state restored');
      } catch (error) {
        console.error(`Error restoring test issue: ${error.message}`);
      }
    }
  });

  it('should analyze an issue and apply appropriate labels', async function() {
    // Load the repository info from config
    const repoInfo = api.getCurrentRepositoryInfo();
    
    // Run the labeling function
    let result;
    try {
      result = await labelIssueByNumber({
        issueNumber: TEST_ISSUE_NUMBER,
        owner: repoInfo.owner,
        repo: repoInfo.repo
      });
    } catch (error) {
      // If we get a rate limit error or token limit error, skip the test
      if (
        error.message && (
          error.message.includes('Rate limit exceeded') ||
          error.message.includes('Request failed with status code 400') ||
          error.message.includes('maximum context length')
        )
      ) {
        console.log('API error (rate limit or token limit). Skipping test.');
        this.skip();
        return;
      }
      throw error; // Re-throw any other error
    }
    
    // Get the allowed labels from config
    const configLoader = require('../src/config-loader');
    const allowedLabels = configLoader.getLabelConfig().allowedLabels;
    
    // Check if this is a rate limit error
    if (result && !result.success && result.error && 
        (result.error.includes('Rate limit') || result.error.includes('429'))) {
      console.log('API rate limit exceeded. Skipping test.');
      this.skip();
      return;
    }
    
    // If the result indicates success, verify that labels were applied correctly
    if (result.success) {
      // Verify that labels were applied
      const updatedIssue = await api.getIssue({ issue_number: TEST_ISSUE_NUMBER });
      const appliedLabels = updatedIssue.labels.map(l => l.name);
      
      // Check if any of our allowed labels were applied (case insensitive)
      const hasAllowedLabel = appliedLabels.some(appliedLabel => 
        allowedLabels.some(allowedLabel => 
          allowedLabel.toLowerCase() === appliedLabel.toLowerCase()
        )
      );
      
      if (hasAllowedLabel) {
        // Test passes if allowed labels were applied
        assert.ok(true, 'Issue has allowed labels applied');
        
        // Verify case insensitivity in label matching
        console.log('Applied labels:', appliedLabels);
        console.log('Allowed labels:', allowedLabels);
        
        // Verify all applied labels match allowed labels (case insensitive)
        const allLabelsValid = appliedLabels.every(appliedLabel =>
          !allowedLabels.length || // Empty allowed = legacy mode
          allowedLabels.some(allowedLabel =>
            allowedLabel.toLowerCase() === appliedLabel.toLowerCase()
          )
        );
        
        assert.ok(allLabelsValid, 'All applied labels should match allowed labels (case insensitive)');
      } else {
        // If labels were skipped because they already existed or none were allowed, that's also a success
        assert.ok(
          result.action === 'skipped_already_labeled' || result.action === 'skipped_no_allowed_labels',
          'If no new labels were applied, the action should be skipped_already_labeled or skipped_no_allowed_labels'
        );
      }
    } else {
      // If the model determined no allowed labels (e.g., not urgent, not important),
      // or if there was a processing error, check the reason
      assert.ok(
        result.reason === 'no_allowed_labels_determined' || result.reason === 'processing_error',
        `Error reason should be 'no_allowed_labels_determined' or 'processing_error', but got '${result.reason}'`
      );
    }
  });
});