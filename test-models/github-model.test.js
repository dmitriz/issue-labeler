/**
 * GitHub Models API Tests
 * These tests specifically use the GitHub Models API and are separated 
 * to avoid rate limiting during regular testing.
 * 
 * IMPORTANT: This file contains tests that make real API calls to GitHub Models API
 * which has strict rate limits. Only run these tests when specifically testing
 * model integration.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { callModel, callGithubModel } = require('../src/github-model');

// Control whether to use mocks or real API
// Set USE_MOCK_RESPONSE to true to avoid hitting the real API
const USE_MOCK_RESPONSE = process.env.USE_MOCK_RESPONSE === 'true';

// Mock response generators
function getMockModelResponse() {
  return {
    urgency: "urgent",
    importance: "high"
  };
}

function getMockGithubModelResponse() {
  return JSON.stringify({
    urgency: "urgent",
    importance: "high"
  });
}

// Mock functions that replace real API calls when testing
const mockCallModel = async () => getMockModelResponse();
const mockCallGithubModel = async () => getMockGithubModelResponse();

describe('GitHub Models API Integration', function() {
  // Increase timeout for API calls as model calls can take time
  this.timeout(30000);
  
  // Test credentials
  let hasCredentials = false;
  let labelTemplate;
  let originalCallModel;
  let originalCallGithubModel;
  
  before(function() {
    try {
      require('../.secrets/github');
      hasCredentials = true;
      
      // Load the label template
      labelTemplate = fs.readFileSync('prompts/label-template.txt', 'utf-8');
      
      // Save original functions for restoration
      if (USE_MOCK_RESPONSE) {
        originalCallModel = callModel;
        originalCallGithubModel = callGithubModel;
        
        // Replace with mock implementations
        global.callModel = mockCallModel;
        global.callGithubModel = mockCallGithubModel;
      }
    } catch (error) {
      console.log('GitHub credentials not found or template missing. Some tests will be skipped.');
    }
  });
  
  after(function() {
    // Restore original functions if we replaced them
    if (USE_MOCK_RESPONSE && originalCallModel && originalCallGithubModel) {
      global.callModel = originalCallModel;
      global.callGithubModel = originalCallGithubModel;
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
    if (!hasCredentials && !USE_MOCK_RESPONSE) {
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
    
    console.log(`=== ${USE_MOCK_RESPONSE ? 'Using Mock Response' : 'Sending Prompt to GitHub Model'} ===`);
    
    try {
      // Call the GitHub model API (or mock)
      const apiFunction = USE_MOCK_RESPONSE ? global.callGithubModel : callGithubModel;
      const response = await apiFunction({ prompt });
      
      console.log("=== Response from GitHub Model ===");
      console.log(response);
      
      assert.ok(response, 'Should receive a non-empty response');
      
      // Try to parse the response as JSON
      try {
        const parsedResponse = JSON.parse(response);
        
        // Validate response structure
        assert.ok(
        assert.ok(
          Object.hasOwn(parsedResponse, 'urgency') && 
          Object.hasOwn(parsedResponse, 'importance'),
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
  
  it('should process an issue through callModel function', async function() {
    if (!hasCredentials && !USE_MOCK_RESPONSE) {
      this.skip();
      return;
    }
    
    // Test prompt
    const prompt = `You are a GitHub issue triage assistant. Read the issue and assign:
    
    1. **urgency**: Is this urgent or not urgent?
    2. **importance**: Is this high or low importance?
    
    Issue:
    Title: Fix critical security vulnerability
    
    Body:
    We need to update our dependencies to patch a critical security vulnerability.
    
    Return your assessment as a JSON object with exactly these fields:
    {
      "urgency": "<urgent or not_urgent>",
      "importance": "<high or low>"
    }`;
    
    console.log(`=== ${USE_MOCK_RESPONSE ? 'Using Mock Response' : 'Testing callModel function'} ===`);
    
    try {
      // Call the GitHub model API (or mock)
      const apiFunction = USE_MOCK_RESPONSE ? global.callModel : callModel;
      const result = await apiFunction(prompt);
      
      console.log("=== Model Result ===");
      console.log(result);
      
      assert.ok(result, 'Should receive a non-empty result');
      assert.ok(result.urgency, 'Result should contain urgency value');
      assert.ok(result.importance, 'Result should contain importance value');
      
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