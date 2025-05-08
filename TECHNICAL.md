# GitHub Issue Labeler - Technical Documentation

This document provides high-level technical documentation for the GitHub Issue Labeler project, explaining its architecture, key components, and how to work with the codebase.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Key Components](#key-components)
4. [Project Organization](#project-organization)
5. [Configuration System](#configuration-system)
6. [Environment Management](#environment-management)
7. [Secrets Management](#secrets-management)
8. [Main Workflows](#main-workflows)
9. [Testing Strategy](#testing-strategy)
10. [How to Extend](#how-to-extend)
11. [Project Size Considerations](#project-size-considerations)

## Project Overview

GitHub Issue Labeler is a tool that automatically assigns labels (urgency and importance) to GitHub issues using AI. It connects to the GitHub API, fetches issue content, processes it with a large language model (LLM), and applies appropriate labels based on the content.

## Architecture

The project follows a modular architecture with clear separation of concerns between GitHub API integration, LLM processing, and configuration management. The application core orchestrates these components to analyze and label GitHub issues.

The configuration system supports different environments, but environments only affect the target repository - all other configuration settings are environment-independent and defined directly in the config.js file.

## Key Components

### 1. API Clients

- **GitHub API**: Handles interactions with GitHub's REST API
- **LLM Client**: Manages communication with the LLM for issue analysis

### 2. Configuration

- **Central Configuration**: A single source of truth for application settings
- **Configuration Loader**: Utilities for accessing and modifying configuration
- **Environment Management**: Tools for switching between target repositories

### 3. Application Logic

- **Core Labeling Logic**: Orchestrates the issue labeling workflow
- **Prompt Management**: Templates for communicating with the LLM
- **Response Processing**: Handling and interpreting LLM responses

## Project Organization

The project follows a standard organizational structure:

### Source Code (`src/` directory)

Contains the core application functionality, including:

- Main application logic and entry points
- API client implementations
- Configuration management utilities
- User-facing commands
- **Unit tests** are placed directly next to the source files they test

### Integration Tests (`test-integration/` directory)

Contains tests that verify interactions between multiple components, including:

- API interaction tests
- Multi-module workflow tests

### End-to-End Tests (`test-e2e/` directory)

Contains tests that verify complete workflows from the user's perspective.

### Maintenance Scripts (`scripts/` directory)

Contains development and maintenance utilities:

- Environment management utilities
- Configuration testing utilities
- Development workflow helpers

This organization follows standard practices for separating application code from development utilities.

## Configuration System

The application uses a unified configuration system with JavaScript modules for better readability and maintainability.

### Configuration Structure

The configuration is organized into logical sections:

- **Environments**: Defines different repository targets (testing vs. production)
- **GitHub API Settings**: Connection parameters for GitHub
- **LLM Settings**: Model selection and parameters

### Configuration Management

The system provides utilities for:

- Loading the appropriate configuration
- Accessing specific configuration sections
- Switching between environments (repository targets)

## Environment Management

The system supports multiple environments with different repository targets. **Note that environments ONLY affect which repository is targeted - all other settings remain the same across environments.**

Key features:

- Environment toggling (switch between test and production repositories)
- Environment status display (see which repository is currently active)
- Persistence of environment selection

## Secrets Management

Authentication tokens and other sensitive information are stored separately from the main configuration:

- **Secrets Storage**: Sensitive values are kept in a separate `.secrets` directory
- **Authentication**: API tokens for GitHub and the LLM service
- **Separation of Concerns**: Repository information is managed through configuration, not secrets

## Main Workflows

### Issue Labeling Workflow

1. Fetch issue content from the targeted GitHub repository
2. Process the issue with the configured LLM
3. Extract label recommendations from the LLM response
4. Apply recommended labels to the issue

### Environment Switching

Developers can easily switch the target repository without changing code by toggling between environments with a simple command.

## Testing Strategy

The project uses a comprehensive testing approach with three distinct types of tests:

### 1. Unit Tests (`src/*.test.js`)

- Located directly next to the source files they test
- Test individual functions and modules in isolation
- Mock external dependencies and API calls
- Run with `npm run test:unit`

### 2. Integration Tests (`test-integration/*.test.js`)

- Test interactions between multiple components, including external APIs
- Test the integration between your code and the GitHub API as a key component
- **Use real GitHub credentials and make actual API calls**
- May modify real GitHub resources (add comments, labels, etc.)
- Each test file can be run directly with Node.js: `node test-integration/filename.test.js`
- Run all with `npm run test:integration`

### 3. End-to-End Tests (`test-e2e/*.e2e.test.js`)

- Test complete user workflows from start to finish
- **Require real GitHub credentials**
- Simulate actual user interactions with the CLI
- Focus on the primary user workflow: `npm start` (which runs `src/labeler.js`)
- Test the entire process from issue retrieval to label application
- Run with `npm run test:e2e`

### Credential Management for Tests

- **CRITICAL: The `.secrets` directory contains real credentials**
- The credentials in `.secrets/github.js` are required for both integration and end-to-end tests
- These credentials should never be replaced with mock values
- Integration and end-to-end tests are designed to use real APIs, not mocks
- When changing credential handling, always verify tests pass with real API calls

### Test File Naming Conventions

- Unit tests: `filename.test.js` (located next to source files)
- Integration tests: `filename.test.js` (located in test-integration directory)
- End-to-End tests: `filename.e2e.test.js` (located in test-e2e directory)

This clear separation and naming scheme helps identify the purpose and requirements of each test file.

### Testing Philosophy

This project takes a practical approach to testing that prioritizes real-world validation:

#### Integration Testing with Real APIs

While some projects mock external APIs for integration tests, this project deliberately uses **real API calls** for integration testing because:

1. **Reliability**: Tests verify actual API behavior and responses, not assumptions about them
2. **Completeness**: Tests exercise the full request/response cycle including authentication
3. **Confidence**: Successful tests provide high confidence that the code works in production
4. **Discovery**: Tests can uncover changes in API behavior or unexpected edge cases

This approach means:

- Integration tests require valid GitHub credentials
- Tests may occasionally fail due to API rate limits or changes
- Tests may create real comments or labels on GitHub repositories

#### When Mocks Are Appropriate

Unit tests (in the `src/` directory) may still use mocks when:

- Testing error handling paths that are difficult to trigger with real APIs
- Isolating specific functions from their dependencies
- Testing edge cases or race conditions

However, all critical paths should be verified with real API calls through integration tests.

## How to Extend

### Adding New Environments

New repository targets can be added to the environments section of the configuration.

### Modifying Label Categories

The labeling system can be extended with new categories by updating prompt templates and response processing.

## Project Size Considerations

This project follows a pragmatic approach suitable for smaller applications:

### Simplicity Over Complexity

- Prioritize direct, simple implementations over complex abstractions
- Favor flat file structures where reasonable
- Keep configuration easily accessible in root directory
- Avoid over-engineering that would be appropriate for larger projects

### Documentation and Examples

- Prefer executable tests over static examples that may become outdated
- Reference the appropriate test files as usage examples
- Ensure all example code is fully functional and tested
- If including examples, they should be regularly tested and maintained

### Testing Strategy Alignment

The testing strategy is designed for this project's specific needs:

- Integration tests with real APIs are preferred over complex mocking
- Direct tests that make actual API calls provide higher confidence
- Simplified test structure appropriate for project size

## Documentation Maintenance

**IMPORTANT: This technical documentation must be kept in sync with code changes.**

### Guidelines for Maintaining Documentation

1. **Update This Document**: Any significant structural changes to the codebase must be reflected here.

2. **Keep It High-Level**: This document focuses on architecture and concepts, not implementation details.

3. **Documentation First**: Update documentation as part of the planning phase for significant changes.

4. **Verification**: Periodically verify that documentation matches the current codebase structure.
