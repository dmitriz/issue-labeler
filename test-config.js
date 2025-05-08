/**
 * Test script to verify environment configuration system
 */
const configLoader = require('./config-loader');
const issuesFetcher = require('./github-issue-fetcher');
const fs = require('fs');
const path = require('path');

console.log('\n=== ENVIRONMENT CONFIGURATION STATUS ===');

// Display active environment
const activeEnv = configLoader.getActiveEnvironment();
console.log('\n1. CURRENT ENVIRONMENT');
console.log(`   Name: ${activeEnv.name}`);
console.log(`   Mode: ${activeEnv.repository.useLocalIssues ? 'Testing with local mock issues' : 'Production with live GitHub API'}`);

// Display the repository configured in the environment
console.log('\n2. REPOSITORY CONFIGURED IN ENVIRONMENT');
console.log(`   Owner: ${activeEnv.repository.owner}`);
console.log(`   Repo: ${activeEnv.repository.repo}`);

// Display information from secrets file if it exists
try {
  const secretsConfig = require('./.secrets/github');
  console.log('\n3. SECRETS FOUND');
  console.log(`   GitHub token: ${secretsConfig.token ? '✓ Present' : '✗ Missing'}`);
  
  // Check if repository info exists in secrets
  const hasRepoInSecrets = secretsConfig.owner && secretsConfig.repo;
  console.log(`   Repository info: ${hasRepoInSecrets ? '✓ Present' : '✗ Missing'}`);
  
  // Display actual repository that will be used (may come from secrets)
  const repoInfo = issuesFetcher.getCurrentRepositoryInfo();
  console.log('\n4. REPOSITORY THAT WILL ACTUALLY BE USED');
  console.log(`   Owner: ${repoInfo.owner}`);
  console.log(`   Repo: ${repoInfo.repo}`);
  
  // Add a clear explanation about source of repository info
  if (activeEnv.repository.useLocalIssues) {
    console.log(`   Source: Using test repository from environment config (local testing mode)`);
  } else if (secretsConfig.owner && secretsConfig.repo && 
            (secretsConfig.owner === repoInfo.owner && secretsConfig.repo === repoInfo.repo)) {
    console.log(`   Source: Using repository from .secrets/github.js file`);
  } else {
    console.log(`   Source: Using repository from environment config`);
  }
} catch (error) {
  console.log('\n3. SECRETS STATUS');
  console.log(`   ✗ No GitHub secrets found (.secrets/github.js is missing)`);
  
  // Display actual repository that will be used (from environment)
  const repoInfo = issuesFetcher.getCurrentRepositoryInfo();
  console.log('\n4. REPOSITORY THAT WILL ACTUALLY BE USED');
  console.log(`   Owner: ${repoInfo.owner}`);
  console.log(`   Repo: ${repoInfo.repo}`);
  console.log(`   Source: Using repository from environment config (no secrets found)`);
}

// Display available commands
console.log('\n5. AVAILABLE COMMANDS');
console.log('   • npm run toggle-env - Switch between testing and production');
console.log('   • npm run env:status - Show this environment status');

console.log('\nEnvironment setup complete!');