/**
 * Unit tests for github-api.js
 * Tests basic functionality in isolation (no actual API calls)
 */
const assert = require('assert');
const api = require('./github-api');

describe('GitHub API', () => {
  describe('validatePathSegment', () => {
    it('should accept valid path segments', () => {
      const validSegments = [
        'user123',
        'org-name',
        'repo.js',
        'test_repo'
      ];
      
      validSegments.forEach(segment => {
        assert.strictEqual(
          api.validatePathSegment(segment),
          segment,
          `Should accept valid segment: ${segment}`
        );
      });
    });
    
    it('should reject invalid path segments', () => {
      const invalidSegments = [
        'user/repo',
        'org name',
        '../etc',
        'repo$name'
      ];
      
      invalidSegments.forEach(segment => {
        assert.throws(
          () => api.validatePathSegment(segment),
          /Invalid path segment/,
          `Should reject invalid segment: ${segment}`
        );
      });
    });
  });
  
  describe('getIssuesWithLabel', () => {
    it('should filter issues by label', () => {
      const testIssues = [
        { number: 1, title: 'Issue 1', labels: [{ name: 'bug' }] },
        { number: 2, title: 'Issue 2', labels: [{ name: 'feature' }] },
        { number: 3, title: 'Issue 3', labels: [{ name: 'bug' }, { name: 'urgent' }] }
      ];
      
      const bugIssues = api.getIssuesWithLabel(testIssues, 'bug');
      assert.strictEqual(bugIssues.length, 2, 'Should find 2 bug issues');
      assert.deepStrictEqual(
        bugIssues.map(i => i.number), 
        [1, 3], 
        'Should return issues #1 and #3'
      );
      
      const featureIssues = api.getIssuesWithLabel(testIssues, 'feature');
      assert.strictEqual(featureIssues.length, 1, 'Should find 1 feature issue');
      assert.strictEqual(featureIssues[0].number, 2, 'Should return issue #2');
    });
    
    it('should handle case insensitive label matching', () => {
      const testIssues = [
        { number: 1, title: 'Issue 1', labels: [{ name: 'BUG' }] },
        { number: 2, title: 'Issue 2', labels: [{ name: 'bug' }] }
      ];
      
      const bugIssues = api.getIssuesWithLabel(testIssues, 'bug');
      assert.strictEqual(bugIssues.length, 2, 'Should find both bug issues regardless of case');
    });
  });
});