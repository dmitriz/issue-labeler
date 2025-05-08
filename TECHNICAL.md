# GitHub Issue Labeler - Technical Documentation

This document provides comprehensive technical documentation for the GitHub Issue Labeler project, explaining its architecture, key components, and how to work with the codebase.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Key Components](#key-components)
4. [Configuration System](#configuration-system)
5. [Environment Management](#environment-management)
6. [Secrets Management](#secrets-management)
7. [Main Workflows](#main-workflows)
8. [Testing](#testing)
9. [How to Extend](#how-to-extend)

## Project Overview

GitHub Issue Labeler is a tool that automatically assigns labels (urgency and importance) to GitHub issues using AI. It connects to the GitHub API, fetches issue content, processes it with a text model, and applies appropriate labels based on the content.

## Architecture

The project follows a modular architecture with clear separation of concerns:

```mermaid
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GitHub API     │     │ Text Model API  │     │  Configuration  │
│  (Data Source)  │◄────┤  (Processing)   │◄────┤  (Environment)  │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────────┐
│                Issue Labeler                    │
│            (Main Application Logic)             │
└─────────────────────────────────────────────────┘
```

## Key Components

### 1. API Clients

- **`github-api-client.js`**: Core API client for interacting with GitHub
- **`github-issue-fetcher.js`**: Specialized client for fetching GitHub issues
- **`github-model.js`**: Client for the AI model that determines labels

### 2. Configuration

- **`config.js`**: Central configuration file that exports settings as a JavaScript object
- **`config-loader.js`**: Utility to load, validate, and modify configuration

### 3. Environment Management

- **`scripts/toggle-env.js`**: Script to toggle between testing/production environments
- **`test-config.js`**: Utility to display current environment configuration

### 4. Application Logic

- **`label-issue.js`**: Main script that orchestrates the labeling workflow
- **`labeler.js`**: Core logic for sending issues to the model and processing results

## Configuration System

The application uses a JavaScript-based configuration system (not JSON) to support comments and better readability.

### Configuration Structure

```javascript
// config.js
module.exports = {
  // Environment configurations (only repository target changes between environments)
  environments: {
    testing: {
      active: true,
      repository: {
        owner: 'owner-name',
        repo: 'repo-name',
        useLocalIssues: true
      }
    },
    production: {
      active: false, 
      repository: {
        owner: 'external-org',
        repo: 'external-repo',
        useLocalIssues: false
      }
    }
  },
  
  // GitHub API configuration
  github: {
    baseUrl: 'https://api.github.com',
    timeoutMs: 10000,
    maxSockets: 100
  },
  
  // Model configuration
  model: {
    id: 'openai/gpt-4o',
    temperature: 0.3,
    maxTokens: 1000,
    apiEndpoint: 'https://models.github.ai/inference/chat/completions'
  }
};
```

### Configuration Loader

The `config-loader.js` file provides functions to:

1. Get the active environment configuration
2. Access specific configuration sections (repository, model, API)
3. Switch between environments and persist changes to the config file

## Environment Management

The system supports multiple environments (testing and production) with different repository targets. Key features:

1. **Toggle Command**: `npm run toggle-env` switches between environments
2. **Status Command**: `npm run env:status` displays current environment status
3. **Persistence**: Environment changes are persisted to the config file
4. **Local Testing**: The testing environment can use mock issues for testing

### Environment Switching

When switching environments:

1. The `active` flag is toggled in the config file
2. Repository targeting changes (owner/repo)
3. If `useLocalIssues` is true, mock issues are used instead of API calls

## Secrets Management

Secrets like API tokens are stored in a `.secrets` directory and imported directly:

- `.secrets/github.js`: Contains GitHub authentication token
- `.secrets/gh-model.js`: Contains model API token (if used separately)

**Important**: While repository information can be stored in secrets, the system is designed to prioritize the repository information from `config.js`. This ensures that switching environments correctly changes the target repository.

## Main Workflows

### Issue Labeling Workflow

1. Application fetches issue content from GitHub
2. Issue content is sent to the model with a prompt template
3. Model determines urgency and importance
4. Labels are applied to the issue

### Environment Toggling Workflow

1. `toggle-env.js` script identifies current active environment
2. Switches active flag to the other environment
3. Updates config.js file to persist the change
4. Repository targeting automatically changes based on environment

## Testing

The project includes several test scripts:

- **`test-github-model.js`**: Tests the model API client
- **`test-config.js`**: Tests environment configuration
- **`test-gh-api-wrapper.js`**: Tests GitHub API client
- Other test files for specific functionality

## How to Extend

### Adding a New Environment

1. Add a new environment object in the `environments` section of `config.js`:

   ```javascript
   staging: {
     active: false,
     repository: {
       owner: 'staging-org',
       repo: 'staging-repo',
       useLocalIssues: false
     }
   }
   ```

2. Update the toggle script if you need to cycle through more than two environments

### Adding New Model Providers

1. Add the new provider configuration in the `model` section of `config.js`
2. Update `github-model.js` to handle the new provider's API format

### Modifying Label Categories

1. Update the prompt template in `prompts/label-template.txt`
2. Modify the parsing logic in `callModel()` function in `github-model.js`
3. Update any UI or reporting tools to display the new labels
