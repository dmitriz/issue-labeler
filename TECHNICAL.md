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

The project follows a clear organizational structure with strict separation between different types of code:

### Source Code (`src/` directory)
Contains all application functionality intended for users, including:
- Core application logic
- API client implementations
- Configuration management
- User-facing CLI tools
- **Unit tests** are placed directly next to the source files they test

### Integration Tests (`test-integration/` directory)
Contains tests that verify interactions between multiple components, including:
- API interaction tests
- Multi-module workflow tests
- Database integration tests (if applicable)

### End-to-End Tests (`test-e2e/` directory)
Contains tests that verify complete workflows from start to finish, including:
- Complete CLI workflow tests
- Full labeling process tests

### Maintenance Scripts (`scripts/` directory)
Contains development and maintenance utilities NOT intended for end users:
- Environment management utilities
- Development workflow helpers
- Configuration testing utilities

This separation ensures clear distinction between user-facing functionality and internal maintenance utilities.

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

The project includes various test scripts for different components and integration points.

## How to Extend

### Adding New Environments

New repository targets can be added to the environments section of the configuration.

### Modifying Label Categories

The labeling system can be extended with new categories by updating prompt templates and response processing.

## Documentation Maintenance

**IMPORTANT: This technical documentation must be kept in sync with code changes.**

### Guidelines for Maintaining Documentation:

1. **Update This Document**: Any significant structural changes to the codebase must be reflected here.

2. **Keep It High-Level**: This document focuses on architecture and concepts, not implementation details.

3. **Documentation First**: Update documentation as part of the planning phase for significant changes.

4. **Verification**: Periodically verify that documentation matches the current codebase structure.
