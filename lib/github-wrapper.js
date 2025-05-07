/**
 * GitHub API wrapper for the issue labeling workflow
 * Centralizes error handling and API configuration for reliable GitHub interactions.
 * Use this wrapper instead of direct API calls to ensure consistent error handling and rate limit management.
 */
const axios = require('axios');
const https = require('https');

// Use environment variables for sensitive credentials
const token = process.env.GITHUB_TOKEN;

// Define API constants
const BASE_URL = 'https://api.github.com';
const GITHUB_API_TIMEOUT_MS = 10000;

/**
 * Validates GitHub path segments to prevent path traversal attacks
 * @param {string} segment - Path segment to validate
 * @returns {string} - The validated segment
 */
function validatePathSegment(segment) {
  if (!/^[\w.-]+$/.test(segment)) {
    throw new Error('Invalid path segment');
  }
  return segment;
}

const github = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'issue-labeler-app'
  },
  timeout: GITHUB_API_TIMEOUT_MS,
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets: 100 // Limit the maximum concurrent connections
  })
});

// Centralized error handling function
function handleGitHubError(error, context) {
  console.error(`Error ${context}: ${error.message}`);
  if (error.response) {
    console.error('API Error:', error.response.status, error.response.statusText);
    console.error('Error details:', error.response.data);
  }
  throw error;
}

// Wrap the URL construction with validation
function constructIssueUrl({ owner, repo, issueNumber }) {
  return `/repos/${validatePathSegment(owner)}/${validatePathSegment(repo)}/issues/${Number(issueNumber)}`;
}

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
      // Detailed error logging removed to prevent exposure of sensitive information.
    }
    throw error;
  }
}

module.exports = {
  getIssueContent,
  applyLabels
};