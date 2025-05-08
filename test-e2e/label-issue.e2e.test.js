/**
 * End-to-end test for label-issue workflow
 * Tests the complete issue labeling process from start to finish
 */
const assert = require('assert');
const { main } = require('../src/label-issue');
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
    
    // Run the main labeling function
    await main({
      issueNumber: TEST_ISSUE_NUMBER,
      owner: repoInfo.owner,
      repo: repoInfo.repo
    });
    
    // Verify that labels were applied
    const updatedIssue = await api.getIssue({ issue_number: TEST_ISSUE_NUMBER });
    const appliedLabels = updatedIssue.labels.map(l => l.name);
    
    // Check for urgency/importance labels
    const hasUrgencyLabel = appliedLabels.some(label => 
      label === 'urgent' || label === 'not_urgent'
    );
    const hasImportanceLabel = appliedLabels.some(label => 
      label === 'important' || label === 'not_important'
    );
    
    assert.ok(hasUrgencyLabel, 'Issue should have an urgency label applied');
    assert.ok(hasImportanceLabel, 'Issue should have an importance label applied');
  });
});