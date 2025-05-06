// A minimal test that just imports the module and logs
const githubApi = require('./scripts/github-api');

console.log('Script started');
console.log('GitHub API module loaded:', Object.keys(githubApi));
console.log('Script completed');