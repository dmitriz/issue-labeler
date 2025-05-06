// Test script for GitHub model integration

const fs = require('fs');
const path = require('path');
const { callGithubModel } = require('./lib/githubModel');

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
    
    // Try to parse the response as JSON
    try {
      const parsedResponse = JSON.parse(response);
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