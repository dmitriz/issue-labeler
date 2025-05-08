#!/usr/bin/env node

/**
 * Command-line utility to switch between environments
 * Usage: node switch-env.js [environment-name]
 */
const { switchEnvironment, getActiveEnvironment, getConfig } = require('../src/config-loader');

// Define available environments from config
let config;
try {
  config = getConfig();
} catch (error) {
  console.error(`Failed to load configuration: ${error.message}`);
  process.exit(1);
}

const availableEnvironments = Object.keys(config.environments);
const activeEnvironment = getActiveEnvironment(config);

// Display current environment if no arguments
if (process.argv.length < 3) {
  console.log(`Current active environment: ${activeEnvironment.name}`);
  console.log(`Available environments: ${availableEnvironments.join(', ')}`);
  console.log('Usage: node switch-env.js [environment-name]');
  process.exit(0);
}

// Get the requested environment name
const requestedEnv = process.argv[2];

// Validate the requested environment
if (!availableEnvironments.includes(requestedEnv)) {
  console.error(`Error: Environment "${requestedEnv}" not found.`);
  console.error(`Available environments: ${availableEnvironments.join(', ')}`);
  process.exit(1);
}

// Switch to the requested environment
try {
  if (requestedEnv === activeEnvironment.name) {
    console.log(`Environment "${requestedEnv}" is already active.`);
  } else {
    switchEnvironment(requestedEnv);
    console.log(`Switched to environment: ${requestedEnv}`);
    
    // Display the repository that will be used
    const newEnv = getActiveEnvironment();
    console.log(`Repository: ${newEnv.repository.owner}/${newEnv.repository.repo}`);
    console.log(`Using ${newEnv.repository.useLocalIssues ? 'local test issues' : 'live GitHub API'}`);
  }
} catch (error) {
  console.error(`Failed to switch environment: ${error.message}`);
  process.exit(1);
}