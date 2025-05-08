/**
 * Configuration loader for issue-labeler
 * Handles loading environment-specific configurations from config.json
 */
const fs = require('fs');
const path = require('path');

// Default config file location
const CONFIG_PATH = path.join(__dirname, 'config.json');

/**
 * Loads and validates the configuration
 * @param {string} [configPath=CONFIG_PATH] - Path to the config file
 * @returns {Object} - The loaded configuration object
 */
function loadConfig(configPath = CONFIG_PATH) {
  try {
    const configRaw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configRaw);
    validateConfig(config);
    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

/**
 * Validates the configuration structure
 * @param {Object} config - The configuration object to validate
 * @throws {Error} If the configuration is invalid
 */
function validateConfig(config) {
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
}

/**
 * Gets the currently active environment configuration
 * @param {Object} [config] - Optional pre-loaded config object
 * @returns {Object} - The active environment configuration
 */
function getActiveEnvironment(config) {
  const fullConfig = config || loadConfig();
  const activeEnvKey = Object.keys(fullConfig.environments)
    .find(key => fullConfig.environments[key].active);
  
  return {
    name: activeEnvKey,
    ...fullConfig.environments[activeEnvKey]
  };
}

/**
 * Gets the repository configuration for the active environment
 * @param {Object} [config] - Optional pre-loaded config object
 * @returns {Object} - Repository configuration object
 */
function getRepositoryConfig(config) {
  return getActiveEnvironment(config).repository;
}

/**
 * Gets the model configuration for the active environment
 * @param {Object} [config] - Optional pre-loaded config object
 * @returns {Object} - Model configuration object
 */
function getModelConfig(config) {
  return getActiveEnvironment(config).model;
}

/**
 * Gets the API configuration
 * @param {Object} [config] - Optional pre-loaded config object
 * @returns {Object} - API configuration object
 */
function getApiConfig(config) {
  const fullConfig = config || loadConfig();
  return fullConfig.api;
}

/**
 * Switches the active environment
 * @param {string} environmentName - The name of the environment to activate
 * @param {boolean} [persistChange=true] - Whether to save the change to the config file
 * @returns {Object} - The updated configuration object
 */
function switchEnvironment(environmentName, persistChange = true) {
  const config = loadConfig();
  
  if (!config.environments[environmentName]) {
    throw new Error(`Environment "${environmentName}" not found in configuration`);
  }
  
  // Deactivate all environments
  Object.keys(config.environments).forEach(key => {
    config.environments[key].active = false;
  });
  
  // Activate the requested environment
  config.environments[environmentName].active = true;
  
  // Save the updated configuration if requested
  if (persistChange) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  }
  
  return config;
}

module.exports = {
  loadConfig,
  getActiveEnvironment,
  getRepositoryConfig,
  getModelConfig,
  getApiConfig,
  switchEnvironment
};