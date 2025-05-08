/**
 * Test script to verify environment configuration system
 * Run with: node test-config.js
 */
const configLoader = require('./config-loader');
const { getCurrentRepositoryInfo } = require('./github-issue-fetcher');

// Display environment information
async function testConfig() {
  try {
    // Load and display the active environment
    const activeEnv = configLoader.getActiveEnvironment();
    console.log('\n=== Active Environment ===');
    console.log(`Name: ${activeEnv.name}`);
    
    // Display repository configuration
    const repoConfig = getCurrentRepositoryInfo();
    console.log('\n=== Repository Configuration ===');
    console.log(`Owner: ${repoConfig.owner}`);
    console.log(`Repository: ${repoConfig.repo}`);
    console.log(`Using local issues: ${repoConfig.isLocal ? 'Yes' : 'No'}`);
    
    // Display model configuration
    const modelConfig = configLoader.getModelConfig();
    console.log('\n=== Model Configuration ===');
    console.log(`Model ID: ${modelConfig.id}`);
    console.log(`Temperature: ${modelConfig.temperature}`);
    console.log(`Max tokens: ${modelConfig.maxTokens}`);
    
    console.log('\n=== Usage Instructions ===');
    console.log('To switch environments, run: node scripts/switch-env.js [environment-name]');
    console.log('Available environments:', Object.keys(configLoader.loadConfig().environments).join(', '));
    
  } catch (error) {
    console.error('Error testing configuration:', error.message);
  }
}

// Run the test
testConfig();