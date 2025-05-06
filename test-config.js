// Simple configuration check
const config = require('./.secrets/github');

console.log('GitHub Configuration loaded successfully');
console.log('Token present:', !!config.token);