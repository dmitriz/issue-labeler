const assert = require('assert');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

describe('Direct GitHub API Test', function() {
  // Increase timeout for API calls
  this.timeout(10000);
  
  // Test credentials
  let token, owner, repo, hasCredentials = false;
  
  before(function() {
    try {
      // Use the existing .secrets/github.js file exactly as it is
      const credentials = require('../.secrets/github');
      token = credentials.token;
      owner = credentials.owner || 'dmitriz';
      repo = credentials.repo || 'issue-labeler';
      hasCredentials = !!token;
      
      if (!token) {
        console.log('GitHub token not found in .secrets/github.js');
      }
    } catch (error) {
      console.log('GitHub credentials not found:', error.message);
    }
  });
  
  it('should directly access the GitHub API using axios', async function() {
    if (!hasCredentials) {
      this.skip();
      return;
    }
    
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
    console.log(`Testing direct API access to: ${apiUrl}`);
    
    try {
      const response = await axios.get(apiUrl, {
        headers: { 
          Authorization: `token ${token}`,
          'User-Agent': 'issue-labeler-app'
        },
        timeout: 5000 // 5 second timeout
      });
      
      assert.strictEqual(response.status, 200, 'API should return status 200');
      assert.ok(Array.isArray(response.data), 'Response data should be an array');
      
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
    } catch (error) {
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.statusText);
        console.error('Details:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Request Error:', error.message);
      }
      throw error;
    }
  });
});