/**
 * Unit tests for search-repos module
 */
const assert = require('assert');
const { searchRepos, displayResults } = require('./search-repos');

describe('search-repos', () => {
  describe('searchRepos', () => {
    it('should throw error when query is not provided', async () => {
      try {
        await searchRepos({});
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Search query is required');
      }
    });

    it('should accept valid search parameters', () => {
      // This is a minimal test to verify the function structure
      assert.strictEqual(typeof searchRepos, 'function');
    });
  });

  describe('displayResults', () => {
    it('should handle empty results', () => {
      // Should not throw
      displayResults([]);
    });

    it('should handle null results', () => {
      // Should not throw
      displayResults(null);
    });

    it('should display repository information', () => {
      const mockRepos = [
        {
          full_name: 'user/repo',
          description: 'Test repo',
          html_url: 'https://github.com/user/repo',
          language: 'JavaScript',
          stargazers_count: 100,
          forks_count: 50,
          open_issues_count: 5,
          topics: ['trading', 'finance'],
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      // Should not throw
      displayResults(mockRepos);
    });
  });
});
