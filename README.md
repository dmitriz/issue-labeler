# GitHub Issue Labeler

A tool that automatically assigns labels (urgency and importance) to GitHub issues using AI. It connects to the GitHub API, fetches issue content, processes it with a large language model (LLM), and applies appropriate labels based on the content.

## Key Features

- Automated issue labeling based on content analysis
- Support for urgency and importance categorization
- Command-line interface for labeling specific issues
- Utility for selecting the next issue to work on based on priority

## Installation

```bash
# Clone the repository

cd issue-labeler

# Install dependencies
npm install

# Set up GitHub credentials (required for API access)
mkdir -p .secrets
echo "module.exports = { token: 'your-github-token', owner: 'your-username', repo: 'your-repo' };" > .secrets/github.js
# Note: Use a token with appropriate permissions and keep it confidential
# See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
echo ".secrets" >> .gitignore
```

## Usage

### Label an issue

```bash
npm run label-issue -- 123
```

Where `123` is the issue number you want to label.

### Select next issue to work on

```bash
npm run select-next
```

## Project Structure

For detailed technical documentation, see [TECHNICAL.md](./TECHNICAL.md).

## Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests (requires GitHub credentials)
npm run test:integration

# Run end-to-end tests (requires GitHub credentials)
npm run test:e2e

# Run all tests
npm test
```

## Contributing

Contributions are welcome! Please see our contributing guidelines for details.
