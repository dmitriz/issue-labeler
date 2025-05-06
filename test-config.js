// Simple configuration check
const config = require('./.secrets/github');

console.log('GitHub Configuration:');
console.log('Owner:', config.owner);
console.log('Repo:', config.repo);
console.log('Token present:', !!config.token);
console.log('Token length:', config.token ? config.token.length : 0);