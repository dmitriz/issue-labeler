const { getAllOpenIssues, getIssuesWithLabel } = require('./github-api');

/**
 * Select the next issue to work on based on priority rules with robust error handling:
 * 1. Filter by urgent label if available
 * 2. From resulting list, filter by important label if available
 * 3. Pick the issue with the oldest update date from final list
 * 4. Handles API errors and data validation at each step
 * 
 * @returns {Promise<Object|null>} The selected issue object or null if no issues found or on error
 */
async function selectNextIssue() {
  try {
    // Get all open issues with error handling
    let issues;
    try {
      issues = await getAllOpenIssues();
      
      // Validate the response structure
      if (!Array.isArray(issues)) {
        console.error('Error: getAllOpenIssues did not return an array:', typeof issues);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch open issues:', error.message);
      return null;
    }

    // Early return if no issues found
    if (!issues.length) {
      console.log('No open issues available for processing.');
      return null;
    }

    // Filter by urgent label if available, with validation
    let urgentIssues;
    try {
      urgentIssues = getIssuesWithLabel(issues, 'urgent');
      
      // Validate returned value
      if (!Array.isArray(urgentIssues)) {
        console.error('Error: getIssuesWithLabel did not return an array for urgent issues');
        // Fall back to original issues list
        urgentIssues = [];
      }
    } catch (error) {
      console.error('Error filtering urgent issues:', error.message);
      urgentIssues = [];
    }

    if (urgentIssues.length) {
      console.log(`Found ${urgentIssues.length} issues with 'urgent' label. Prioritizing these.`);
      issues = urgentIssues;
    }

    // Further filter by important label if available, with validation
    let importantIssues;
    try {
      importantIssues = getIssuesWithLabel(issues, 'important');
      
      // Validate returned value
      if (!Array.isArray(importantIssues)) {
        console.error('Error: getIssuesWithLabel did not return an array for important issues');
        // Fall back to current issues list
        importantIssues = [];
      }
    } catch (error) {
      console.error('Error filtering important issues:', error.message);
      importantIssues = [];
    }

    if (importantIssues.length) {
      console.log(`Found ${importantIssues.length} issues with 'important' label. Prioritizing these.`);
      issues = importantIssues;
    }

    // Sort with error handling for malformed dates
    try {
      const sortedIssues = issues.sort((a, b) => {
        // Validate updated_at exists and is a valid date string
        if (!a.updated_at || !b.updated_at) {
          console.warn('Warning: Issue missing updated_at timestamp');
          return 0;
        }

        try {
          return new Date(a.updated_at) - new Date(b.updated_at);
        } catch (e) {
          console.warn('Warning: Invalid date format in issue updated_at field');
          return 0;
        }
      });

      // Check if we have any issues after filtering and sorting
      if (!sortedIssues.length) {
        console.log('No issues left after filtering and sorting.');
        return null;
      }

      return sortedIssues[0];
    } catch (error) {
      console.error('Error sorting issues:', error.message);
      // If sorting fails, return the first issue from the current list as a fallback
      return issues[0] || null;
    }
  } catch (error) {
    console.error('Unexpected error in selectNextIssue:', error.message);
    return null;
  }
}

// Export the function
module.exports = {
  selectNextIssue
};
