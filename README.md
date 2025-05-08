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
git clone https://github.com/your-username/issue-labeler.git
cd issue-labeler

# Install dependencies
npm install

# Set up GitHub credentials (required for API access)
mkdir -p .secrets
echo "module.exports = { token: 'your-github-token', owner: 'your-username', repo: 'your-repo' };" > .secrets/github.js
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

The project follows a clear organizational structure:

```
issue-labeler/
├── config.js                # Main configuration file
├── src/                     # Source code
│   ├── github-api.js        # GitHub API client
│   ├── github-model.js      # LLM client for issue analysis
│   ├── config-loader.js     # Configuration utilities
│   ├── label-issue.js       # CLI for labeling issues
│   ├── labeler.js           # Core labeling logic
│   ├── select-next.js       # CLI for next issue selection
│   └── *.test.js            # Unit tests adjacent to source files
├── test-integration/        # Integration tests
├── test-e2e/                # End-to-end tests
├── scripts/                 # Maintenance scripts
└── prompts/                 # LLM prompt templates
```

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

## License

ISC

## Contributing

Contributions are welcome! Please see our contributing guidelines for details.
