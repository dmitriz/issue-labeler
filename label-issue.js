/**
 * GitHub Issue Automatic Labeling Script
 * This script automates labeling of GitHub issues using GitHub's AI models
 * It fetches issue content, uses a model to determine urgency and importance,
 * and then applies those labels to the issue.
 */
const { getIssueContent, applyLabels } = require('./lib/github-wrapper');
const { callModel } = require('./lib/github-model');
const fs = require('fs');
const path = require('path');

// Read the prompt template
const promptTemplate = fs.readFileSync(path.join(__dirname, 'prompt-template.txt'), 'utf8');

/**
 * Main function to process and label an issue
 * @param {Object} options - Options object
 * @param {number} options.issueNumber - The issue number to process
 * @param {string} options.owner - Repository owner
 * @param {string} options.repo - Repository name
 */
async function main({ issueNumber, owner, repo }) {
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
    const { urgency, importance } = await callModel({ prompt });
    console.log(`Model inference complete: urgency=${urgency}, importance=${importance}`);

    // Step 4: Create and apply labels
    const labels = [];
    if (urgency) labels.push(urgency);
    if (importance) labels.push(importance);

    if (labels.length > 0) {
      console.log(`Applying labels to issue #${issueNumber}: ${labels.join(', ')}...`);
      await applyLabels({ issueNumber, owner, repo, labels });
      console.log(`Successfully labeled issue #${issueNumber} with: ${labels.join(', ')}`);
    } else {
      console.warn('No valid labels were determined. No labels applied to the issue.');
    }
  } catch (error) {
    console.error(`Error processing issue #${issueNumber}: ${error.message}`);
    process.exit(1);
  }
}

// Parse command-line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  const issueNumber = args[0];
  
  // Set default repository info or get from command line if provided
  const owner = args[1] || 'dmitriz';
  const repo = args[2] || 'issue-labeler';

  if (!issueNumber) {
    console.error('Usage: node label-issue.js <issue-number> [owner] [repo]');
    process.exit(1);
  }

  main({ issueNumber, owner, repo })
    .then(() => console.log('Issue labeling process completed successfully'))
    .catch(err => {
      console.error('Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { main };