/**
 * GitHub Issue Automatic Labeling Script
 * This script automates labeling of GitHub issues using GitHub's AI models
 * It fetches issue content, uses a model to determine urgency and importance,
 * and then applies those labels to the issue.
 */
const { getIssueContent, applyLabels } = require('./github-api');
const { callModel } = require('./github-model');
const fs = require('fs');
const path = require('path');

// Path to the prompt template
const promptTemplatePath = path.join(__dirname, '../prompt-template.txt');

/**
 * Main function to process and label an issue
 * @param {Object} options - Options object
 * @param {number} options.issueNumber - The issue number to process
 * @param {string} options.owner - Repository owner
 * @param {string} options.repo - Repository name
 * @returns {Promise<void>}
 */
async function main({ issueNumber, owner, repo }) {
  // Read the prompt template - moved inside function for proper async handling
  let promptTemplate;
  try {
    promptTemplate = await fs.promises.readFile(promptTemplatePath, 'utf8');
  } catch (error) {
    console.error(`Error reading prompt template: ${error.message}`);
    throw error;
  }

  console.log(`Processing issue #${issueNumber} from ${owner}/${repo}...`);
  
  try {
    // Step 1: Fetch issue content from GitHub
    console.log(`Fetching content for issue #${issueNumber}...`);
    const issue = await getIssueContent({ issueNumber, owner, repo });
    console.log(`Issue #${issue.number} fetched: "${issue.title}"`);

    // Step 2: Prepare the prompt by replacing the placeholders with actual issue content
    const prompt = promptTemplate
      .replace('{{title}}', issue.title)
      .replace('{{body}}', issue.body || '');
    
    // Step 3: Call the GitHub Model to determine urgency and importance
    console.log('Analyzing issue content with GitHub Model...');
    const { urgency, importance } = await callModel(prompt);
    console.log(`Model inference complete: urgency=${urgency}, importance=${importance}`);

    // Step 4: Create and apply labels
    const labels = [];
    if (urgency) labels.push(urgency);
    if (importance) labels.push(importance);

    if (labels.length === 0) {
      console.warn(`No labels determined for issue #${issueNumber}.`);
    }

    if (labels.length > 0) {
      console.log(`Applying labels to issue #${issueNumber}: ${labels.join(', ')}...`);
      await applyLabels({ issueNumber, owner, repo, labels });
      console.log(`Successfully labeled issue #${issueNumber} with: ${labels.join(', ')}`);
    } else {
      console.warn('No valid labels were determined. No labels applied to the issue.');
    }
  } catch (error) {
    console.error(`Error processing issue #${issueNumber}:`, error);
    throw error;
  }
}

// Simple handling if run directly from command line
if (require.main === module) {
  // Set default values
  const defaultOwner = 'dmitriz';
  const defaultRepo = 'issue-labeler';
  
  // Get issue number from command line arguments
  const issueArg = process.argv[2];
  const issueNum = parseInt(issueArg, 10);
  
  if (!issueArg || isNaN(issueNum)) {
    console.error('Error: Please provide a valid issue number');
    console.error('Usage: node src/label-issue.js <issue-number> [owner] [repo]');
    process.exit(1);
  }
  
  // Get optional owner and repo arguments if provided
  const owner = process.argv[3] || defaultOwner;
  const repo = process.argv[4] || defaultRepo;
  
  main({ issueNumber: issueNum, owner, repo })
    .then(() => console.log('Issue labeling process completed successfully'))
    .catch(err => {
      console.error('Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { main };