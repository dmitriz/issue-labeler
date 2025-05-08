/**
 * GitHub Issue Automatic Labeling Script
 * This script processes a single GitHub issue using GitHub's AI models
 * It accepts an issue object, uses the model to determine urgency and importance,
 * and then applies those labels to the issue.
 */
const { getIssueContent, applyLabels } = require('./github-api');
const { callModel } = require('./github-model');
const fs = require('fs');
const path = require('path');

// Path to the prompt template
const promptTemplatePath = path.join(__dirname, '../prompt-template.txt');

// Cache the prompt template once it's loaded
let cachedPromptTemplate = null;

/**
 * Load the prompt template from disk (only once)
 * @returns {Promise<string>} The prompt template
 */
async function getPromptTemplate() {
  if (cachedPromptTemplate) {
    return cachedPromptTemplate;
  }
  
  try {
    cachedPromptTemplate = await fs.promises.readFile(promptTemplatePath, 'utf8');
    return cachedPromptTemplate;
  } catch (error) {
    console.error(`Error reading prompt template: ${error.message}`);
    throw error;
  }
}

/**
 * Analyzes a GitHub issue and applies urgency and importance labels using an AI model.
 *
 * Uses a prompt template to generate a model query based on the issue's title and body, determines appropriate labels, and applies any new labels to the issue. Skips labeling if the issue already has the correct labels.
 *
 * @param {Object} issue - The GitHub issue object to process.
 * @param {Object} options - Options for processing.
 * @param {string} options.owner - The repository owner.
 * @param {string} options.repo - The repository name.
 * @param {string} [options.promptTemplate] - Optional pre-loaded prompt template to use.
 * @returns {Promise<Object>} An object indicating the result, including success status, applied labels, and action taken.
 */
async function processIssue(issue, { owner, repo, promptTemplate }) {
  console.log(`Processing issue #${issue.number}: "${issue.title}"`);
  
  try {
    // Use provided promptTemplate or load it if not provided
    const template = promptTemplate || await getPromptTemplate();
    
    // Prepare the prompt by replacing the placeholders with actual issue content
    const prompt = template
      .replace('{{title}}', issue.title)
      .replace('{{body}}', issue.body || '');
    
    // Call the GitHub Model API individually for this issue
    console.log(`Analyzing issue #${issue.number} with GitHub Model...`);
    const { urgency, importance } = await callModel(prompt);
    console.log(`Model result for issue #${issue.number}: urgency=${urgency}, importance=${importance}`);

    // Create and apply labels
    const labels = [];
    if (urgency) labels.push(urgency);
    if (importance) labels.push(importance);

    if (labels.length === 0) {
      console.warn(`No labels determined for issue #${issue.number}.`);
      return { issue: issue.number, success: false, reason: 'no_labels_determined' };
    }

    // Check if the issue already has these labels to avoid unnecessary API calls
    const existingLabelNames = issue.labels.map(label => 
      typeof label === 'string' ? label.toLowerCase() : label.name.toLowerCase()
    );
    
    const newLabels = labels.filter(label => 
      !existingLabelNames.includes(label.toLowerCase())
    );
    
    if (newLabels.length === 0) {
      console.log(`Issue #${issue.number} already has the correct labels. Skipping.`);
      return { 
        issue: issue.number, 
        success: true, 
        labels: labels,
        action: 'skipped_already_labeled'  
      };
    }

    console.log(`Applying labels to issue #${issue.number}: ${newLabels.join(', ')}...`);
    await applyLabels({ 
      issueNumber: issue.number, 
      owner, 
      repo,
      labels: newLabels
    });
    console.log(`Successfully labeled issue #${issue.number} with: ${newLabels.join(', ')}`);
    return { 
      issue: issue.number, 
      success: true, 
      labels: newLabels,
      action: 'labels_applied'
    };
  } catch (error) {
    console.error(`Error processing issue #${issue.number}:`, error);
    return { 
      issue: issue.number, 
      success: false, 
      error: error.message,
      reason: 'processing_error'
    };
  }
}

/**
 * Helper function to process an issue by its number
 * @param {Object} options - Options object
 * @param {number} options.issueNumber - The issue number to process
 * @param {string} options.owner - Repository owner
 * @param {string} options.repo - Repository name
 * @returns {Promise<Object>} - Result of processing
 */
async function labelIssueByNumber({ issueNumber, owner, repo }) {
  try {
    // Fetch issue content from GitHub
    console.log(`Fetching content for issue #${issueNumber}...`);
    const issue = await getIssueContent({ issueNumber, owner, repo });
    console.log(`Issue #${issue.number} fetched: "${issue.title}"`);
    
    // Process the issue using our main function
    return await processIssue(issue, { owner, repo });
  } catch (error) {
    console.error(`Error processing issue #${issueNumber}:`, error);
    return { 
      issue: issueNumber, 
      success: false, 
      error: error.message,
      reason: 'fetch_error'
    };
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
      console.error('Error: Please provide a valid issue number. The issue number must be an integer.');
      console.error('Usage: node src/label-issue.js <issue-number> [owner] [repo]');
      process.exit(1);
    }
    
    // Get optional owner and repo arguments if provided
    const owner = process.argv[3] || defaultOwner;
    const repo = process.argv[4] || defaultRepo;
  
  labelIssueByNumber({ issueNumber: issueNum, owner, repo })
    .then(result => {
      if (result.success) {
        console.log('Issue labeling process completed successfully');
      } else {
        console.error(`Issue labeling failed: ${result.reason}`);
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { processIssue, labelIssueByNumber };