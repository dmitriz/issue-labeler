# End-to-End Tests

This directory contains end-to-end (E2E) tests for the Issue Labeler project. E2E tests verify complete workflows from start to finish.

## What are End-to-End Tests?

End-to-end tests verify that complete application workflows function as expected from the user's perspective. They test the entire application stack, including:

- Command-line interface functionality
- Complete issue labeling workflows
- Full application processes from input to output

## Running the Tests

To run all end-to-end tests:

```bash
npm run test:e2e
```

## Test Naming Convention

All end-to-end tests follow the naming convention: `*.e2e.test.js`

## Test Organization

Tests are organized by command-line tools or complete workflows:

- `label-issue.e2e.test.js`: Tests the complete issue labeling workflow
- `select-next.e2e.test.js`: Tests the workflow to select the next issue to work on

## Test Requirements

These tests:

1. Require a valid GitHub token in the `.secrets/github.js` file or as an environment variable
2. May modify real GitHub resources (add/remove labels, comments)
3. Should clean up after themselves (restore original state)
4. Need an active internet connection
5. May be skipped in CI environments unless explicit test issues are specified

## Environment Variables

Some E2E tests accept environment variables to configure their behavior:

- `TEST_ISSUE_NUMBER`: Specify an issue number to use for testing
- `GITHUB_OWNER`: Override the default repository owner
- `GITHUB_REPO`: Override the default repository name