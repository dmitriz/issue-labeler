const { getLabeledIssues } = require('../lib/github');
const priorities = { urgency: ['today', 'someday'], importance: ['high', 'low'] };

/**
 * Calculate priority score for an issue based on its urgency and importance labels
 * Lower scores indicate higher priority
 * @param {Object} issue - GitHub issue object
 * @returns {number} - Priority score
 */
function score(issue) {
  const urgency = issue.labels.find(l => l.name.startsWith('urgency:'))?.name.split(':')[1] || 'someday';
  const importance = issue.labels.find(l => l.name.startsWith('importance:'))?.name.split(':')[1] || 'low';

  const urgencyScore = priorities.urgency.indexOf(urgency);
  const importanceScore = priorities.importance.indexOf(importance);

  return urgencyScore * 10 + importanceScore;
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