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
      // Skip test if no issue number specified and we're in CI
      if (!process.env.TEST_ISSUE_NUMBER && process.env.CI) {
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
    const result = await labelIssueByNumber({
      issueNumber: TEST_ISSUE_NUMBER,
      owner: repoInfo.owner,
      repo: repoInfo.repo
    });
    
    // Get the allowed labels from config
    const configLoader = require('../src/config-loader');
    const allowedLabels = configLoader.getLabelConfig().allowedLabels;
    
    // If the result indicates success, verify that labels were applied correctly
    if (result.success) {
      // Verify that labels were applied
      const updatedIssue = await api.getIssue({ issue_number: TEST_ISSUE_NUMBER });
      const appliedLabels = updatedIssue.labels.map(l => l.name);
      
      // Check if any of our allowed labels were applied
      const hasAllowedLabel = appliedLabels.some(label => 
        allowedLabels.includes(label.toLowerCase())
      );
      
      if (hasAllowedLabel) {
        // Test passes if allowed labels were applied
        assert.ok(true, 'Issue has allowed labels applied');
      } else {
        // If labels were skipped because they already existed, that's also a success
        assert.strictEqual(result.action, 'skipped_already_labeled', 
          'If no new labels were applied, the action should be skipped_already_labeled');
      }
    } else {
      // If the model determined no allowed labels (e.g., not urgent, not important),
      // then the process should fail with a specific reason
      assert.strictEqual(result.reason, 'no_allowed_labels_determined',
        'When no allowed labels are determined, the result should indicate this reason');
    }
  });
});