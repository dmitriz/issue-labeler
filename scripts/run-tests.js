/**
 * Test Runner Script
 * 
 * This script provides a centralized way to run different test suites
 * with the appropriate environment variables and configurations.
 */

const { spawnSync } = require('child_process');
const path = require('path');

// ANSI color codes for better output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to run a test command with proper environment
function runTest(testName, command, env = {}) {
  console.log(`\n${colors.bright}${colors.blue}=== Running ${testName} Tests ===${colors.reset}\n`);
  
  // Merge provided environment variables with the current environment
  const testEnv = { ...process.env, ...env };
  
  // Run the command and capture output
  const result = spawnSync(command, { 
    shell: true,
    stdio: 'inherit',
    env: testEnv 
  });
  
  if (result.status === 0) {
    console.log(`\n${colors.green}✅ ${testName} Tests: PASSED${colors.reset}\n`);
    return true;
  } else {
    console.error(`\n${colors.red}❌ ${testName} Tests: FAILED${colors.reset}\n`);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';

// Standard test environment
const testEnv = { NODE_ENV: 'test' };

// Track overall success
let success = true;

switch (testType.toLowerCase()) {
  case 'unit':
    success = runTest('Unit', 'npx mocha "src/**/*.test.js"', testEnv);
    break;
    
  case 'integration':
    success = runTest('Integration', 'npx mocha "test-integration/**/*.test.js"', testEnv);
    break;
    
  case 'e2e':
    success = runTest('End-to-End', 'npx mocha "test-e2e/**/*.e2e.test.js"', testEnv);
    break;
    
  case 'models:mock':
    success = runTest(
      'Models (Mock)', 
      'npx mocha "test-models/**/*.test.js"', 
      { ...testEnv, USE_MOCK_RESPONSE: 'true' }
    );
    break;
    
  case 'models':
    console.log(`\n${colors.bright}${colors.yellow}⚠️  Warning: This will hit the real API${colors.reset}\n`);
    const proceed = process.env.CI === 'true' || process.env.FORCE_MODELS === 'true';
    
    if (proceed) {
      success = runTest('Models (Real API)', 'npx mocha "test-models/**/*.test.js"', testEnv);
    } else {
      console.log(`${colors.yellow}Skipping real API tests. Use:${colors.reset}\n`);
      console.log(`- FORCE_MODELS=true npm run test:models to force run`);
      console.log(`- npm run test:models:mock for mock tests\n`);
    }
    break;
    
  case 'ci':
    // Run tests suitable for CI environment
    success = runTest('Unit', 'npx mocha "src/**/*.test.js"', testEnv);
    if (success) {
      success = runTest('Integration', 'npx mocha "test-integration/**/*.test.js"', testEnv);
    }
    if (success) {
      success = runTest(
        'Models (Mock)',
        'npx mocha "test-models/**/*.test.js"',
        { ...testEnv, USE_MOCK_RESPONSE: 'true' }
      );
    }
    break;

  case 'all':
    // Run all tests except real API models tests
    success = runTest('Unit', 'npx mocha "src/**/*.test.js"', testEnv);
    if (success) {
      success = runTest('Integration', 'npx mocha "test-integration/**/*.test.js"', testEnv);
    }
    if (success) {
      success = runTest('End-to-End', 'npx mocha "test-e2e/**/*.e2e.test.js"', testEnv);
    }
    if (success) {
      success = runTest(
        'Models (Mock)',
        'npx mocha "test-models/**/*.test.js"',
        { ...testEnv, USE_MOCK_RESPONSE: 'true' }
      );
    }
    break;

  default:
    console.error(`${colors.red}Unknown test type: ${testType}${colors.reset}`);
    console.log(`Available options: unit, integration, e2e, models:mock, models, ci, all`);
    process.exit(1);
}

// Exit with appropriate code
process.exit(success ? 0 : 1);
