# Model API Tests

This directory contains tests that specifically interact with the GitHub Models API. These tests are separated from the regular test suite due to rate limiting concerns.

## Why Separate Tests?

The GitHub Models API has strict rate limits which can cause regular tests to fail when run frequently. By separating these tests, we can:

1. Run the main test suite without hitting rate limits
2. Run model-specific tests only when needed
3. Avoid interruptions in CI/CD pipelines due to rate limiting
4. Better manage when and how we use our API quota

## Running Model Tests

To run the model tests separately:

```bash
npm run test:models
```

## Test Requirements

These tests:

1. Require valid GitHub tokens with access to the Models API
2. Make real API calls to the GitHub Models API
3. Consume API rate limits
4. May fail if rate limits are exceeded

## Test Organization

- `github-model.test.js`: Tests interaction with GitHub Models API for issue labeling

## Best Practices

- Only run these tests when specifically testing changes to model integration
- Consider implementing mock responses for regular development testing
- Be aware of rate limits and error handling in your tests