# Integration Tests

This directory contains integration tests for the Issue Labeler project. Integration tests verify that multiple components work together correctly.

## What are Integration Tests?

Integration tests verify that different modules or services used by your application work well together. For example, they can test:

- Interactions between your application and the GitHub API
- Connection between configuration and API modules
- End-to-end workflows that involve multiple components

## Running the Tests

To run all integration tests:

```bash
npm run test:integration
```

To run individual test files directly (preferred for development):

```bash
node test-integration/fetch-only.test.js
node test-integration/comment.test.js
# etc.
```

## Test Naming Convention

All integration tests follow the naming convention: `*.test.js`

## Test Organization

Tests are organized by feature area:

- `github-api-integration.test.js`: Tests interaction with the GitHub API
- `comment.test.js`: Tests commenting functionality
- `direct-api.test.js`: Tests direct API interactions
- etc.

## Test Requirements

⚠️ **IMPORTANT: These files are REAL API TESTS, not mock-based tests** ⚠️

These integration tests:

1. **Require real GitHub credentials** in the `.secrets/github.js` file
2. Make actual API calls to GitHub services
3. May modify real GitHub repositories (add comments, labels, etc.)
4. Must use valid GitHub tokens with appropriate permissions

### Required Credentials

The `.secrets/github.js` file must contain:

```javascript
module.exports = {
  token: "your-github-personal-access-token",  // Required for GitHub API
  owner: "repository-owner",                   // GitHub username/organization
  repo: "repository-name",                     // GitHub repository name
  tokenModel: "your-github-model-token"        // Required for GitHub Models API
};
```

DO NOT replace these with mock values even during testing - these scripts are designed to test against the real GitHub API.