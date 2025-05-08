/**
 * Configuration loader for issue-labeler
 * Handles loading environment-specific configurations from config.js
 */
const path = require('path');
const fs = require('fs');

// Config file path - config.js is in the root directory
const CONFIG_PATH = path.join(__dirname, '..', 'config.js');

// Import the config directly from JS file
const config = require('../config');

/**
 * Validates the configuration structure
 * @throws {Error} If the configuration is invalid
 */
function validateConfig() {
  if (!config.environments) {
    throw new Error('Missing "environments" section in configuration');
  }
  
  // Check if at least one environment is defined
  const envKeys = Object.keys(config.environments);
  if (envKeys.length === 0) {
    throw new Error('No environments defined in configuration');
  }
  
  // Check if exactly one environment is active
  const activeEnvs = envKeys.filter(key => config.environments[key].active);
  if (activeEnvs.length === 0) {
    throw new Error('No active environment found in configuration');
  }
  if (activeEnvs.length > 1) {
    throw new Error(`Multiple active environments found: ${activeEnvs.join(', ')}. Only one environment can be active.`);
  }

  return true;
}

// Run validation on load
validateConfig();

/**
 * Gets the currently active environment configuration
 * @returns {Object} - The active environment configuration
 */
function getActiveEnvironment() {
  const activeEnvKey = Object.keys(config.environments)
    .find(key => config.environments[key].active);
  
  return {
    name: activeEnvKey,
    ...config.environments[activeEnvKey]
  };
}

/**
 * Gets the repository configuration for the active environment
 * @returns {Object} - Repository configuration object
 */
function getRepositoryConfig() {
  return getActiveEnvironment().repository;
}

/**
 * Gets the model configuration (which is the same across environments)
 * @returns {Object} - Model configuration object
 */
function getModelConfig() {
  return config.model;
}

/**
 * Gets the GitHub API configuration
 * @returns {Object} - API configuration object
 */
function getApiConfig() {
  return config.github;
}

/**
 * Gets the complete configuration
 * @returns {Object} - Complete configuration object
 */
function getConfig() {
  return config;
}

/**
 * Helper to update config.js file content
 * @param {Object} updatedConfig - The updated config to write
 */
function updateConfigFile(updatedConfig) {
  // Read the current file content
  let fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  
  // For each environment, update its active state in the file
  Object.keys(updatedConfig.environments).forEach(env => {
    const active = updatedConfig.environments[env].active;
    // Use regex to update the active property in the file
    const pattern = new RegExp(`(${env}:\\s*{[^}]*active:\\s*)\\w+`, 'g');
    fileContent = fileContent.replace(pattern, `$1${active}`);
  });
  
  // Write the updated content back to the file
  fs.writeFileSync(CONFIG_PATH, fileContent, 'utf8');
}

/**
 * Switches the active environment
 * @param {string} environmentName - The name of the environment to activate
 * @returns {Object} - The updated configuration object
 */
function switchEnvironment(environmentName) {
  if (!config.environments[environmentName]) {
    throw new Error(`Environment "${environmentName}" not found in configuration`);
  }
  
  // Update in-memory config
  Object.keys(config.environments).forEach(key => {
    config.environments[key].active = (key === environmentName);
  });
  
  // Persist changes to the config file
  updateConfigFile(config);
  
  // Clear the require cache for config.js to reload on next require
  delete require.cache[require.resolve('../config')];
  
  return config;
}

module.exports = {
  getConfig,
  getActiveEnvironment,
  getRepositoryConfig,
  getModelConfig,
  getApiConfig,
  switchEnvironment
};