// Test script to verify sanitization of issue titles
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a test state file with work mode
const stateFilePath = path.join(__dirname, 'session-state.json');
fs.writeFileSync(stateFilePath, JSON.stringify({
  mode: 'break',
  currentIssueNumber: null,
  lastBreakActivity: 0,
  lastBreakIndex: 0,
  startTime: Date.now()
}));

console.log('Running task-cycler with malicious title test...');

// Patching selectNextIssue to return a malicious title
const taskCyclerPath = path.join(__dirname, 'src', 'task-cycler.js');
const originalContent = fs.readFileSync(taskCyclerPath, 'utf8');

// Backup original file
fs.writeFileSync(`${taskCyclerPath}.bak`, originalContent);

// Replace the mock issue with one containing escape sequences
const modifiedContent = originalContent.replace(
  /return { number: 123, title: 'Test issue', html_url: 'https:\/\/github.com\/example\/repo\/issues\/123' };/g,
  `return { number: 123, title: 'Malicious title with escape sequence \\u001b[31mRED TEXT\\u001b[0m', html_url: 'https://github.com/example/repo/issues/123' };`
);

fs.writeFileSync(taskCyclerPath, modifiedContent);

try {
  // Run the task cycler and capture output
  const output = execSync('npm run test-mode', { encoding: 'utf8' });
  console.log('\nOutput from task-cycler:');
  console.log('-----------------------');
  console.log(output);
  
  // Check if output contains unsanitized escape sequences
  const hasEscapeSequence = output.includes('\u001b');
  console.log('\nSecurity check:');
  console.log(hasEscapeSequence ? '❌ FAIL: Output contains escape sequences!' : '✅ PASS: Output is properly sanitized');
} finally {
  // Restore original file
  fs.writeFileSync(taskCyclerPath, originalContent);
  console.log('\nRestored original task-cycler.js file');
}
