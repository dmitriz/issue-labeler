const axios = require('axios');
let token, owner, repo;
try {
  ({ token, owner, repo } = require('../.secrets/github'));
  if (!token || !owner || !repo) {
    throw new Error('Missing required GitHub credentials');
  }
} catch (error) {
  console.error('Error loading GitHub credentials:', error.message);
  process.exit(1);
}

console.log('========== CONFIGURATION ==========');
console.log(`Owner: ${owner}`);
console.log(`Repo: ${repo}`);
console.log(`Token: [REDACTED]`);
console.log(`Full URL: https://api.github.com/repos/${owner}/${repo}/issues`);
console.log('==================================');
// Using a simple axios call directly
axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
  headers: { 
    Authorization: `token ${token}`,  // Using 'token' prefix instead of 'Bearer'
    'User-Agent': 'issue-labeler-app'
  },
  timeout: 5000 // 5 second timeout
})
.then(response => {
  console.log('SUCCESS! Status:', response.status);

  // Check for pagination
  const linkHeader = response.headers.link;
  if (linkHeader) {
    console.log('Pagination detected - only showing first page of results');
  }

  console.log(`Found ${response.data.length} issues`);
  if (response.data.length > 0) {
    console.log('First issue:', {
      number: response.data[0].number,
      title: response.data[0].title,
      state: response.data[0].state
    });
  }
})
.catch(error => {
  console.error('ERROR!');
  console.error('Message:', error.message);
  
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Status Text:', error.response.statusText);
    console.error('Data:', JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.error('Request was made but no response was received');
  } else {
    console.error('Error setting up request:', error.message);
  }
});