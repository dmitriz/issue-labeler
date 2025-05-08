/**
 * GitHub Issue Batch Labeling Script
 * This script automates labeling of ALL open GitHub issues using GitHub's AI models
 * It fetches all open issues, uses a model to determine urgency and importance for each,
 * and then applies those labels to the issues.
 */
const { getAllOpenIssues } = require('./github-api');
const { processIssue } = require('./label-issue');
const configLoader = require('./config-loader');
const fs = require('fs');
const path = require('path');

// Path to the prompt template
const promptTemplatePath = path.join(__dirname, '../prompt-template.txt');

/**
 * Main function to process and label all open issues
 * @param {Object} options - Options object
 * @param {string} options.owner - Repository owner
 * @param {string} options.repo - Repository name
 * @returns {Promise<Object>} - Summary of processing results
 */
async function labelAllIssues({ owner, repo }) {
  // Read the prompt template
  let promptTemplate;
  try {
    promptTemplate = await fs.promises.readFile(promptTemplatePath, 'utf8');
  } catch (error) {
    console.error(`Error reading prompt template: ${error.message}`);
    throw error;
  }

  console.log(`Processing all open issues from ${owner}/${repo}...`);
  
  try {
    // Log which labels are allowed according to configuration
    const labelConfig = configLoader.getLabelConfig();
    const allowedLabels = labelConfig.allowedLabels || [];
    console.log(`Using label configuration with allowed labels: ${allowedLabels.join(', ') || 'none'}`);

    // Step 1: Fetch all open issues
    console.log('Fetching all open issues...');
    const issues = await getAllOpenIssues();
    console.log(`Fetched ${issues.length} open issues`);
    
    if (issues.length === 0) {
      console.log('No open issues found. Nothing to process.');
      return { success: true, processed: 0, message: 'No open issues found' };
    }

    // Step 2: Process each issue
    console.log(`Starting batch processing of ${issues.length} issues...`);
    
    const results = [];
    const summary = {
      total: issues.length,
      success: 0,
      failed: 0,
      skipped: 0,
      labeled: 0
    };
    
    // Process issues sequentially to avoid rate limits
    for (const issue of issues) {
      // Use the imported processIssue function with the promptTemplate
      const result = await processIssue(issue, { 
        owner, 
        repo,
        promptTemplate // Pass the template as an option
      });
      
      results.push(result);
      
      if (result.success) {
        summary.success++;
        if (result.action === 'labels_applied') {
          summary.labeled++;
        } else if (result.action === 'skipped_already_labeled') {
          summary.skipped++;
        }
      } else {
        summary.failed++;
      }
      
      // Add a small delay between requests to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Return summary
    console.log('\nIssue Labeling Summary:');
    console.log(`Total issues: ${summary.total}`);
    console.log(`Successfully processed: ${summary.success}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`New labels applied: ${summary.labeled}`);
    console.log(`Already correctly labeled: ${summary.skipped}`);
    
    return {
      success: true,
      summary,
      results
    };
  } catch (error) {
    console.error('Error processing batch of issues:', error);
    throw error;
  }
}

// Simple handling if run directly from command line
if (require.main === module) {
  // Set default values
  const defaultOwner = 'dmitriz';
  const defaultRepo = 'issue-labeler';
  
  // Get optional owner and repo arguments if provided
  const owner = process.argv[2] || defaultOwner;
  const repo = process.argv[3] || defaultRepo;
  
  labelAllIssues({ owner, repo })
    .then(() => console.log('Batch issue labeling process completed successfully'))
    .catch(err => {
      console.error('Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { labelAllIssues };