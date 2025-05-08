const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { callGithubModel } = require('../src/github-model');

describe('GitHub Model Integration', function() {
  // Increase timeout for API calls as model calls can take time
  this.timeout(20000);
  
  // Test credentials
  let hasCredentials = false;
  let labelTemplate;
  
  before(function() {
    try {
      require('../.secrets/github');
      hasCredentials = true;
      
      // Load the label template
      labelTemplate = fs.readFileSync('prompts/label-template.txt', 'utf-8');
    } catch (error) {
      console.log('GitHub credentials not found or template missing. Some tests will be skipped.');
    }
  });
  
  function validateIssue(issue) {
    if (!issue.title || typeof issue.title !== 'string') {
      throw new Error('Invalid issue: title must be a non-empty string');
    }
    if (!issue.body || typeof issue.body !== 'string') {
      throw new Error('Invalid issue: body must be a non-empty string');
    }
  }
  
  it('should generate labels from GitHub model', async function() {
    if (!hasCredentials) {
      this.skip();
      return;
    }
    
    // Test issue data
    const issue = {
      title: "Enable automatic triage with GitHub models",
      body: "We want to assign urgency and importance labels automatically to issues based on content. This will help prioritize work and remove bottlenecks."
    };
    
    validateIssue(issue);
    
    // Create the prompt by concatenating the template and issue data
    const prompt = `${labelTemplate}\n\nIssue Title: ${issue.title}\n\nIssue Body: ${issue.body}`;
    
    console.log("=== Sending Prompt to GitHub Model ===");
    
    try {
      // Call the GitHub model API
      const response = await callGithubModel({ prompt });
      
      console.log("=== Response from GitHub Model ===");
      console.log(response);
      
      assert.ok(response, 'Should receive a non-empty response');
      
      // Try to parse the response as JSON
      try {
        const parsedResponse = JSON.parse(response);
        
        // Validate response structure
        assert.ok(
          parsedResponse.hasOwnProperty('urgency') && 
          parsedResponse.hasOwnProperty('importance'),
          'Response should contain urgency and importance properties'
        );
        
        console.log("=== Parsed Labels ===");
        console.log(`urgency: ${parsedResponse.urgency}`);
        console.log(`importance: ${parsedResponse.importance}`);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError.message);
        console.log("Raw response:", response);
        throw parseError;
      }
    } catch (error) {
      // Check for any rate limit related errors
      if (error.message && (
        error.message.includes('Rate limit exceeded') || 
        error.message.includes('429') || 
        (error.response && error.response.status === 429)
      )) {
        console.log('API rate limit exceeded. Skipping GitHub model test.');
        this.skip();
        return;
      }
      console.error("Error calling GitHub model:", error);
      throw error;
    }
  });
});