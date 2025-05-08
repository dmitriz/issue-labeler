const { getAllOpenIssues, getIssuesWithLabel } = require('../lib/github');

/**
 * Selects the next GitHub issue to work on by prioritizing issues labeled "urgent" and "important", then choosing the most recently updated one.
 *
 * The function retrieves all open issues, filters for "urgent" issues if any exist, then further filters for "important" issues within the current set. It sorts the resulting issues by their last update time in descending order and logs details of the top issue. If no open issues are found, it logs an appropriate message.
 */
async function selectNext() {
  // Get all open issues
  let issues = await getAllOpenIssues();
  const URGENT_PRIORITY_SCORE = 0;
  const NORMAL_PRIORITY_SCORE = 10;

  // Example usage of these constants (if needed in the future logic)
  const getPriorityScore = (hasUrgentLabel) => 
    hasUrgentLabel ? URGENT_PRIORITY_SCORE : NORMAL_PRIORITY_SCORE;
  if (!issues.length) {
    return console.log('No open issues available for processing.');
  }

  // Filter step 1 (Urgency):
  const urgentIssues = getIssuesWithLabel(issues, 'urgent');
  if (urgentIssues.length) {
    console.log(`Found ${urgentIssues.length} issues with 'urgent' label. Prioritizing these.`);
    issues = urgentIssues;
  }
  
  // Filter step 2 (Importance):
  const importantIssues = getIssuesWithLabel(issues, 'important');
  if (importantIssues.length) {
    console.log(`Found ${importantIssues.length} issues with 'important' label from current filtered set. Prioritizing these.`);
    issues = importantIssues;
  }
  
  // Final selection - sort by updated_at (most recent first)
  const sortedIssues = issues.sort((a, b) => 
    new Date(b.updated_at) - new Date(a.updated_at)
  );
  
  const top = sortedIssues[0];
  console.log(`\nSelected issue (most recently updated):`);
  console.log(`#${top.number}: ${top.title}`);
  console.log(`URL: ${top.html_url}`);
  console.log(`Last updated: ${new Date(top.updated_at).toLocaleString()}`);
  console.log(`Labels: ${top.labels.map(l => l.name).join(', ') || 'none'}`);
}

selectNext().catch(err => {
  console.error('Error selecting next issue:', err.message);
});