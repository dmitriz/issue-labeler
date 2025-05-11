#!/usr/bin/env node
/**
 * Debug script for the task cycler
 * 
 * This script helps debug the task cycler by running it with extra output
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const STATE_FILE = path.join(process.cwd(), 'session-state.json');
const TASK_CYCLER_SCRIPT = process.env.TASK_CYCLER_PATH || 'src/task-cycler.js';

console.log('------- Starting debugging run -------');
console.log('Current state file contents:');

// Check and display current state file
if (fs.existsSync(STATE_FILE)) {
  console.log(fs.readFileSync(STATE_FILE, 'utf8'));
} else {
  console.log('No state file exists yet');
}

console.log('\nRunning task cycler...');
console.log(`Using script: ${TASK_CYCLER_SCRIPT}`);

// Run the task cycler as a child process to capture all output
const taskCycler = spawn('node', [TASK_CYCLER_SCRIPT], {
  stdio: 'inherit'
});

// When task cycler completes, show the new state
taskCycler.on('close', (code) => {
  console.log(`\nTask cycler exited with code ${code}`);
  
  console.log('\nNew state file contents:');
  if (fs.existsSync(STATE_FILE)) {
    console.log(fs.readFileSync(STATE_FILE, 'utf8'));
  } else {
    console.log('State file was not created');
  }
  
  console.log('\n------- Debugging run complete -------');
});
