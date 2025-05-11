#!/usr/bin/env node
/**
 * Test runner for Task Cycler E2E tests
 * 
 * This script provides a structured way to manually test the task cycler's functionality
 * through a series of test scenarios.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(process.cwd(), 'session-state.json');

console.log('Running Task Cycler E2E Tests');
console.log('');

console.log('Test 1: should start in break mode if no state file exists');
// Remove state file if it exists
if (fs.existsSync(STATE_FILE)) {
  fs.unlinkSync(STATE_FILE);
}
// Run task cycler
execSync('TEST_REPO=true node src/task-cycler.js', { stdio: 'inherit' });

console.log('');
console.log('Test 2: should toggle from work to break mode');
fs.writeFileSync(STATE_FILE, JSON.stringify({ mode: 'work', lastBreakIndex: -1 }));
execSync('TEST_REPO=true node src/task-cycler.js', { stdio: 'inherit' });

console.log('');
console.log('Test 3: should toggle from break to work mode');
fs.writeFileSync(STATE_FILE, JSON.stringify({ mode: 'break', lastBreakIndex: 0 }));
execSync('TEST_REPO=true node src/task-cycler.js', { stdio: 'inherit' });

console.log('');
console.log('Test 4: should cycle through break suggestions');
fs.writeFileSync(STATE_FILE, JSON.stringify({ mode: 'work', lastBreakIndex: 4 }));
execSync('TEST_REPO=true node src/task-cycler.js', { stdio: 'inherit' });
