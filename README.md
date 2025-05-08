# Issue Labeler

This tool automatically suggests urgency and importance labels for GitHub issues using a lightweight prompt-based script. It will be extended to use GitHub Models API.

## Usage

First, install the dependencies:

```bash
npm install
```

Run the labeler:

```bash
# Directly with Node.js
node labeler.js

# Using NPM script
npm start
```

## Environment Management

The application supports both testing and production environments:

```bash
# Check current environment status
npm run env:status

# Switch between testing and production environments
npm run toggle-env
```

## Documentation

For detailed information about the repository organization, architecture, and how to extend the application:

- [**Technical Documentation**](TECHNICAL.md) - Comprehensive guide to the codebase structure and functionality
- [GitHub API Client](github-api-client.js) - Core API client for GitHub interactions
- [Configuration System](config.js) - Central configuration file for all settings

## Configuration

All configuration, including repository targeting, is managed through the `config.js` file. To target a different repository, simply modify the appropriate environment section in this file:

```javascript
environments: {
  production: {
    active: false,
    repository: {
      owner: 'your-org-name',
      repo: 'your-repo-name',
      useLocalIssues: false
    }
  }
}
```
