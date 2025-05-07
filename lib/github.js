const axios = require('axios');
const { token, owner, repo } = require('../.secrets/github');

const headers = { Authorization: `Bearer ${token}` };

/**
 * Fetches open issues that have urgent labels
 * @returns {Promise<Array>} - Array of issue objects
 */
async function getLabeledIssues() {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open`;
  try {
    const res = await axios.get(url, { headers });
    // Filter issues to only include those with "urgent" label
    const issues = res.data.filter(issue => {
      if (issue.pull_request) return false;
      const labels = issue.labels.map(l => l.name);
      return labels.includes('urgent');
    });
    return issues;
  } catch (error) {
    console.error(`Error fetching labeled issues: ${error.message}`);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

module.exports = {
  getLabeledIssues
};