// A minimal test that just imports the module and logs
const githubApi = require('../src/github-api');

console.log('Script started');
console.log('GitHub API module loaded:', Object.keys(githubApi));
// Verify that exported items are functions
const allFunctions = Object.values(githubApi).every(item => typeof item === 'function');
console.log('All exports are functions:', allFunctions);
console.log('Script completed');