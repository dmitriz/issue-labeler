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

## Test Naming Convention

All integration tests follow the naming convention: `*.test.js`

## Test Organization

Tests are organized by feature area:

- `github-api-integration.test.js`: Tests interaction with the GitHub API
- `comment.test.js`: Tests commenting functionality
- `direct-api.test.js`: Tests direct API interactions
- etc.

## Test Requirements

These tests may require:

1. A valid GitHub token in the `.secrets/github.js` file or as an environment variable
2. An active internet connection
3. Allowance for real API calls to GitHub

Some tests may be skipped in CI environments if they would modify real GitHub resources.