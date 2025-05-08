# Maintenance Scripts

This directory contains maintenance scripts used for development, testing, and internal processes. These scripts are **not user-facing functionality** but rather utilities for developers.

## Purpose of this Directory

Scripts in this directory are intended for:

- Development workflows
- Environment management
- Configuration management
- Testing utilities

## Key Scripts

- `toggle-env.js`: Switch between testing and production environments
- `test-config.js`: Test and display the current configuration
- `switch-env.js`: Switch the active environment

## Usage

All scripts can be run through npm:

```bash
npm run toggle-env
npm run env:status
```

## Organization Convention

As per our project organization principles documented in TECHNICAL.md:

1. **User-facing functionality** should be placed in the `src/` directory, not here
2. **Testing functionality** should be placed in the appropriate test directories:
   - Unit tests: Next to source files in `src/`
   - Integration tests: In `test-integration/`
   - End-to-end tests: In `test-e2e/`