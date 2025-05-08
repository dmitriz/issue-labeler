const assert = require('assert');
const githubApi = require('../src/github-api');

describe('Minimal Module Test', function() {
  it('should load the GitHub API module correctly', function() {
    const exportedKeys = Object.keys(githubApi);
    assert.ok(exportedKeys.length > 0, 'Should export at least one function');
    
    // Verify that exported items are functions
    const allFunctions = Object.values(githubApi).every(item => typeof item === 'function');
    assert.ok(allFunctions, 'All exported items should be functions');
    
    console.log('GitHub API exports:', exportedKeys);
  });
});