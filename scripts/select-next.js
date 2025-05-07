const { getLabeledIssues } = require('../lib/github');

/**
 * Calculate priority score for an issue based on its urgent label
 * Lower scores indicate higher priority
 * @param {Object} issue - GitHub issue object
 * @returns {number} - Priority score
 */
function score(issue) {
  // If issue has urgent label, give it highest priority (score 0)
  const hasUrgentLabel = issue.labels.some(l => l.name === 'urgent');
  
  return hasUrgentLabel ? 0 : 10; // 0 for urgent issues, 10 for others
}

/**
 * Select the next issue to work on based on priority scoring
 */
async function selectNext() {
  const issues = await getLabeledIssues();
  if (!issues.length) return console.log('No labeled issues found.');

  const sorted = issues
    .map(issue => ({ ...issue, score: score(issue) }))
    .sort((a, b) => a.score - b.score);

  const top = sorted[0];
  console.log(`Next best issue:\n#${top.number}: ${top.title}\n${top.html_url}`);
}

selectNext().catch(err => {
  console.error('Error selecting next issue:', err.message);
});