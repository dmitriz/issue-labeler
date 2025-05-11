/**
 * Optimized test runner script
 * 
 * This script runs tests in an optimized order:
 * 1. First runs fast unit tests and mocked tests that don't hit external APIs
 * 2. If those pass, runs integration tests with mocks where possible
 * 3. Optionally runs E2E tests only when specifically requested
 * 
 * Benefits:
 * - Avoids rate limiting issues during development
 * - Provides faster feedback
 * - Reduces API usage
 * - Still allows running full test suite when needed
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Command line options
const args = process.argv.slice(2);
const shouldRunE2E = args.includes('--e2e');
const shouldRunIntegration = args.includes('--integration') || args.includes('--all');
const shouldRunRealModels = args.includes('--real-models') || args.includes('--all');
const verbose = args.includes('--verbose');
const watch = args.includes('--watch');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Run a command with environment variables
 */
async function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}Running:${colors.reset} ${command} ${args.join(' ')}`);
    
    const mergedEnv = { ...process.env, ...env };
    const proc = spawn(command, args, { 
      env: mergedEnv,
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

/**
 * Run tests in optimized sequence
 */
async function runTests() {
  try {
    // Step 1: Fast tests first (unit tests + mock model tests)
    console.log(`\n${colors.cyan}=== RUNNING FAST TESTS (UNIT + MOCK) ===${colors.reset}`);
    
    const mochaArgs = ['--reporter', 'spec'];
    if (watch) {
      mochaArgs.push('--watch');
    }
    
    // Run unit tests
    await runCommand('npx', [
      'mocha',
      ...mochaArgs,
      '"src/**/*.test.js"'
    ], { NODE_ENV: 'test' });
    
    // Run model tests with mocks
    await runCommand('npx', [
      'mocha',
      ...mochaArgs,
      '"test-models/**/*.test.js"'
    ], { 
      NODE_ENV: 'test',
      USE_MOCK_RESPONSE: 'true'
    });
    
    console.log(`${colors.green}✓ Fast tests passed!${colors.reset}`);
    
    // Step 2: Run integration tests if requested
    if (shouldRunIntegration) {
      console.log(`\n${colors.cyan}=== RUNNING INTEGRATION TESTS ===${colors.reset}`);
      await runCommand('npx', [
        'mocha',
        '--reporter',
        'spec',
        '"test-integration/**/*.test.js"'
      ], { NODE_ENV: 'test' });
      console.log(`${colors.green}✓ Integration tests passed!${colors.reset}`);
    }
    
    // Step 3: Run E2E tests if requested
    if (shouldRunE2E) {
      console.log(`\n${colors.cyan}=== RUNNING E2E TESTS ===${colors.reset}`);
      await runCommand('npx', [
        'mocha',
        '--reporter',
        'spec',
        '"test-e2e/**/*.e2e.test.js"'
      ], { NODE_ENV: 'test' });
      console.log(`${colors.green}✓ E2E tests passed!${colors.reset}`);
    }
    
    // Step 4: Run real model tests if requested
    if (shouldRunRealModels) {
      console.log(`\n${colors.cyan}=== RUNNING REAL MODEL TESTS ===${colors.reset}`);
      console.log(`${colors.yellow}⚠️  Note: These tests may fail if rate limits are exceeded${colors.reset}`);
      
      await runCommand('npx', [
        'mocha',
        '--reporter',
        'spec',
        '"test-models/**/*.test.js"'
      ], { NODE_ENV: 'test' });
      console.log(`${colors.green}✓ Real model tests passed!${colors.reset}`);
    }
    
    // Summary
    console.log(`\n${colors.green}✅ ALL REQUESTED TESTS PASSED${colors.reset}`);
    
    const skipped = [];
    if (!shouldRunIntegration) skipped.push('Integration tests');
    if (!shouldRunE2E) skipped.push('E2E tests');
    if (!shouldRunRealModels) skipped.push('Real model tests');
    
    if (skipped.length > 0) {
      console.log(`${colors.yellow}Skipped: ${skipped.join(', ')}${colors.reset}`);
      console.log(`${colors.yellow}To run all tests: ${colors.reset}node scripts/run-optimized-tests.js --all`);
    }
    
  } catch (error) {
    console.error(`${colors.red}ERROR: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Show help if --help is passed
if (args.includes('--help')) {
  console.log(`
${colors.cyan}Optimized Test Runner${colors.reset}

Usage:
  node scripts/run-optimized-tests.js [options]

Options:
  --integration   Run integration tests
  --e2e           Run end-to-end tests
  --real-models   Run model tests with real API calls
  --all           Run all tests
  --watch         Run in watch mode (unit tests only)
  --verbose       Show verbose output
  --help          Show this help message

Examples:
  node scripts/run-optimized-tests.js               # Run fast tests only
  node scripts/run-optimized-tests.js --integration # Run fast + integration tests
  node scripts/run-optimized-tests.js --all         # Run all tests
  node scripts/run-optimized-tests.js --watch       # Run fast tests in watch mode
  `);
  process.exit(0);
}

// Run the tests
runTests();
