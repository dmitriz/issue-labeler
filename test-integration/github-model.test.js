// Test script for GitHub model integration

const fs = require('fs');
const path = require('path');
const { callGithubModel } = require('../src/github-model');

// Check for GitHub credentials first
try {
  require('../.secrets/github');
} catch (error) {
  console.log('Skipping test: GitHub credentials not found. Create .secrets/github.js to run this test.');
  process.exit(0); // Exit gracefully
}

function validateIssue(issue) {
  if (!issue.title || typeof issue.title !== 'string') {
    throw new Error('Invalid issue: title must be a non-empty string');
  }
  if (!issue.body || typeof issue.body !== 'string') {
    throw new Error('Invalid issue: body must be a non-empty string');
  }
}

// Load the label template
const labelTemplate = fs.readFileSync('prompts/label-template.txt', 'utf-8');

async function testGithubModelIntegration() {
  // Test issue data
  const issue = {
    title: "Enable automatic triage with GitHub models",
    body: "We want to assign urgency and importance labels automatically to issues based on content. This will help prioritize work and remove bottlenecks."
  };
  
  // Create the prompt by concatenating the template and issue data
  const prompt = `${labelTemplate}\n\nIssue Title: ${issue.title}\n\nIssue Body: ${issue.body}`;
  
  console.log("=== Sending Prompt to GitHub Model ===\n");
  console.log(prompt);
  
  try {
    // Call the GitHub model API
    const response = await callGithubModel({ prompt });
    
    console.log("\n=== Response from GitHub Model ===\n");
    console.log(response);
    
    // Include raw response in the error message for better debugging
    try {
      const parsedResponse = JSON.parse(response);
      console.log("\n=== Parsed Labels ===\n");
      console.log(`urgency: ${parsedResponse.urgency}`);
      console.log(`importance: ${parsedResponse.importance}`);
      console.log("\n=== Parsed Labels ===\n");
      console.log(`urgency: ${parsedResponse.urgency}`);
      console.log(`importance: ${parsedResponse.importance}`);
    } catch (error) {
      console.error("Error parsing JSON response:", error.message, "Raw response:", response);
    }
    // Try to parse the response as JSON
    try {
      const parsedResponse = JSON.parse(response);
      
      // Validate response structure
      if (
        !parsedResponse.hasOwnProperty('urgency') ||
        !parsedResponse.hasOwnProperty('importance')
      ) {
        console.error("Invalid response format: missing required keys");
        console.log("Raw response:", response);
        return;
      }

      console.log("\n=== Parsed Labels ===\n");
      console.log(`urgency: ${parsedResponse.urgency}`);
      console.log(`importance: ${parsedResponse.importance}`);
    } catch (error) {
      console.error("Error parsing JSON response:", error.message);
      console.log("Raw response:", response);
    }
  } catch (error) {
    console.error("Error calling GitHub model:", error);
  }
}

testGithubModelIntegration().catch(console.error);