/**
 * GitHub API wrapper for the issue labeling workflow
 * Provides functions for fetching issue content and applying labels
 */
const axios = require('axios');
const { token } = require('../.secrets/github');

const BASE_URL = 'https://api.github.com';

// Create an axios instance with default configuration
const https = require('https');
const github = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'issue-labeler-app'
  },
  timeout: 5000,
  httpsAgent: new https.Agent({ keepAlive: true })
});

/**
 * Fetch issue content from GitHub
 * @param {Object} options - Options object
 * @param {number} options.issueNumber - The issue number to fetch
 * @param {string} options.owner - Repository owner
 * @param {string} options.repo - Repository name
 * @returns {Promise<Object>} - Issue object with title and body
 */
async function getIssueContent({ issueNumber, owner, repo }) {
  try {
    const response = await github.get(`/repos/${owner}/${repo}/issues/${issueNumber}`);
    return {
      title: response.data.title || '',
      body: response.data.body || '',
      number: response.data.number
    };
  } catch (error) {
    console.error(`Error fetching issue #${issueNumber}: ${error.message}`);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText);
      console.error('Error details:', error.response.data);
    }
    throw error;
  }
}

/**
 * Apply labels to a GitHub issue
 * @param {Object} options - Options object
 * @param {number} options.issueNumber - The issue number to add labels to
 * @param {string} options.owner - Repository owner
 * @param {string} options.repo - Repository name
 * @param {Array<string>} options.labels - Array of label names to add
 * @returns {Promise<Array>} - Array of labels on the issue after the operation
 */
async function applyLabels({ issueNumber, owner, repo, labels }) {
  try {
    const response = await github.post(
      `/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
      { labels }
    );
    return response.data;
  } catch (error) {
    console.error(`Error applying labels to issue #${issueNumber}: ${error.message}`);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText);
      console.error('Error details:', error.response.data);
    }
    throw error;
  }
}

module.exports = {
  getIssueContent,
  applyLabels
};