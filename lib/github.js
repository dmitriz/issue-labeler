const axios = require('axios');
const { token, owner, repo } = require('../.secrets/github');

const headers = { Authorization: `Bearer ${token}` };

/**
 * Fetches open issues that have urgency and importance labels
 * @returns {Promise<Array>} - Array of issue objects
 */
async function getLabeledIssues() {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=urgency,importance`;
  try {
    const res = await axios.get(url, { headers });
    return res.data.filter(issue => !issue.pull_request);
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