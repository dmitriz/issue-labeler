const axios = require('axios');
const { token, owner, repo } = require('../.secrets/github');

const headers = { Authorization: `Bearer ${token}` };

/**
 * Fetches all open issues from GitHub
 * @returns {Promise<Array>} - Array of issue objects
 */
async function getAllOpenIssues() {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open`;
  try {
    const res = await axios.get(url, { headers });
    // Filter out pull requests
    const issues = res.data.filter(issue => !issue.pull_request);
    return issues;
  } catch (error) {
    console.error(`Error fetching open issues: ${error.message}`);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

/**
 * Get issues with specific labels
 * @param {Array} issues - List of all issues
 * @param {String} labelName - Name of the label to filter by
 * @returns {Array} - Filtered issues
 */
function getIssuesWithLabel(issues, labelName) {
  return issues.filter(issue => 
    issue.labels.some(label => label.name === labelName)
  );
}

module.exports = {
  getAllOpenIssues,
  getIssuesWithLabel
};