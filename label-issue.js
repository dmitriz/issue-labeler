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
const { Command } = require('commander');

// Read the prompt template
// Remove the synchronous file read at the top of the file.
// Inside the async main function (at its start), add:
const promptTemplate = await fs.promises.readFile(path.join(__dirname, 'prompt-template.txt'), 'utf8');
let promptTemplate;
try {
  promptTemplate = fs.readFileSync(promptTemplatePath, 'utf8');
} catch (error) {
  console.error(`Error reading prompt template: ${error.message}`);
  process.exit(1);
}
// Inside the async main function (at its start), add:
promptTemplate = await fs.promises.readFile(path.join(__dirname, 'prompt-template.txt'), 'utf8');

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
    process.exit(1);
  }
}

// Parse command-line arguments
if (require.main === module) {
  const program = new Command();

  program
    .name('label-issue')
    .description('Automatically label GitHub issues based on their content')
    .argument('<issue-number>', 'The issue number to process')
    .option('-o, --owner <owner>', 'Repository owner', 'dmitriz')
    .option('-r, --repo <repo>', 'Repository name', 'issue-labeler')
    .action(async (issueNumber, options) => {
      const issueNum = parseInt(issueNumber, 10);
      if (isNaN(issueNum)) {
        console.error('Error: <issue-number> must be a valid number');
        process.exit(1);
      }

      try {
        await main({ issueNumber: issueNum, owner: options.owner, repo: options.repo });
        console.log('Issue labeling process completed successfully');
      } catch (err) {
        console.error('Fatal error:', err.message);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

module.exports = { main };