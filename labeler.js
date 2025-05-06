// Main script: fetches issue content and generates urgency/importance labels

const fs = require('fs');
const path = require('path');

// Load the prompt template and config
const promptTemplate = fs.readFileSync('prompt-template.txt', 'utf-8');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

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

// Replace placeholders in the template
const prompt = promptTemplate
  .replace('{{title}}', issue.title)
  .replace('{{body}}', issue.body);

// Output what would be sent to the model
console.log("=== Prompt Sent to Model ===\n");
console.log(prompt);

// Simulate model response (replace this with real API later)
console.log("\n=== Suggested Labels ===\n");
console.log("urgency: urgent");
console.log("importance: high");