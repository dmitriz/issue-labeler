// Main script: fetches issue content and generates urgency/importance labels

const fs = require('fs');
const path = require('path');
const { callGithubModel } = require('./lib/githubModel');

// Load the prompt template and config
const promptTemplate = fs.readFileSync('prompts/label-template.txt', 'utf-8');
let config;
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
} catch (error) {
  console.error("Failed to read config.json:", error);
  process.exit(1); // Exit the process to prevent further execution
}

// Parse command line arguments or use dummy data if none provided
const issue = (() => {
  // Check if issue data is provided via command line
  if (process.argv.length > 2) {
    try {
      return JSON.parse(process.argv[2]);
    } catch (error) {
      console.error('Error parsing issue data:', error.message);
    }
  }

  // Fall back to dummy data
  return {
    title: "Enable automatic triage with GitHub models",
    body: "We want to assign urgency and importance labels automatically to issues based on content. This will help prioritize work and remove bottlenecks."
  };
})();

// Replace placeholders in the template and format the prompt
const prompt = `${promptTemplate}\n\nIssue Title: ${issue.title}\n\nIssue Body: ${issue.body}`;

// Output what will be sent to the model
console.log("=== Prompt Sent to Model ===\n");
console.log(prompt);

// Call the GitHub model API
async function processIssue() {
  try {
    const response = await callGithubModel({ prompt });
    
    console.log("\n=== Response from GitHub Model ===\n");
    console.log(response);
    
    // Try to parse the response as JSON
    try {
      const parsedResponse = JSON.parse(response);
      console.log("\n=== Suggested Labels ===\n");
      console.log(`urgency: ${parsedResponse.urgency}`);
      console.log(`importance: ${parsedResponse.importance}`);
      return parsedResponse;
    } catch (error) {
      console.error("Error parsing JSON response:", error.message);
      console.log("Raw response:", response);
    }
  } catch (error) {
    console.error("Error calling GitHub model:", error);
  }
}

// Execute the issue processing
processIssue().catch(console.error);