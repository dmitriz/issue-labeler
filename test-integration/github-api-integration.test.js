/**
 * Integration tests for GitHub API
 * Tests actual API calls with real GitHub repo
 */
const assert = require('assert');
const api = require('../src/github-api');

describe('GitHub API Integration', function() {
  // Use a slightly longer timeout since we're making real API calls
  this.timeout(10000);
  
  describe('Issue Fetching', function() {
    it('should fetch open issues from the current repository', async function() {
      const issues = await api.getAllOpenIssues();
      assert.ok(Array.isArray(issues), 'Should return an array of issues');
      
      // Validate issue structure
      if (issues.length > 0) {
        const issue = issues[0];
        assert.ok(issue.number, 'Issue should have a number');
        assert.ok(issue.title, 'Issue should have a title');
        assert.equal(issue.state, 'open', 'Issues should be open');
      }
    });
  });
  
  describe('Repository Info', function() {
    it('should return valid repository information', function() {
      const repoInfo = api.getCurrentRepositoryInfo();
      assert.ok(repoInfo.owner, 'Should have an owner');
      assert.ok(repoInfo.repo, 'Should have a repo name');
      assert.ok(typeof repoInfo.environment === 'string', 'Should have an environment name');
    });
  });
});