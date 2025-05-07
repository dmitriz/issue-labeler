const { getAllOpenIssues, getIssuesWithLabel } = require('../lib/github');

/**
 * Select the next issue to work on based on priority rules:
 * 1. Pick most recent issue with "urgent" label
 * 2. If no urgent issues, pick most recent issue
 * 3. Only show "no issues" message if there are no open issues at all
 */
async function selectNext() {
  // Get all open issues
  const allIssues = await getAllOpenIssues();
  
  if (!allIssues.length) {
    return console.log('No open issues found in the repository.');
  }

  // First try to find urgent issues
  const urgentIssues = getIssuesWithLabel(allIssues, 'urgent');
  
  if (urgentIssues.length) {
    // Sort urgent issues by creation date (most recent first)
    const sortedUrgent = urgentIssues.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    const top = sortedUrgent[0];
    return console.log(`Next best issue (urgent):\n#${top.number}: ${top.title}\n${top.html_url}`);
  }
  
  // No urgent issues found, use most recent issue
  console.log('No issues labeled "urgent" found. Taking most recent open issue instead.');
  
  // Sort all issues by creation date (most recent first)
  const sortedAll = allIssues.sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  const top = sortedAll[0];
  console.log(`Next issue (most recent):\n#${top.number}: ${top.title}\n${top.html_url}`);
}

selectNext().catch(err => {
  console.error('Error selecting next issue:', err.message);
});