#!/usr/bin/env node

/**
 * Environment toggle script
 * Automatically switches between testing and production environments
 * regardless of which one is currently active.
 */
const configLoader = require('../src/config-loader');

// Get currently active environment
const activeEnv = configLoader.getActiveEnvironment();
const currentEnv = activeEnv.name;

// Toggle to the other environment
const targetEnv = currentEnv === 'testing' ? 'production' : 'testing';

try {
  configLoader.switchEnvironment(targetEnv);
  console.log(`✓ Switched from "${currentEnv}" to "${targetEnv}"`);
  
  // Display the repository that will be used
  const newEnv = configLoader.getActiveEnvironment();
  console.log(`\nRepository: ${newEnv.repository.owner}/${newEnv.repository.repo}`);
  console.log(`Using ${newEnv.repository.useLocalIssues ? 'local test issues' : 'live GitHub API'}`);
} catch (error) {
  console.error(`Failed to switch environment: ${error.message}`);
  process.exit(1);
}