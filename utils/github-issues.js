/**
 * GitHub Issues API wrapper
 * Provides a consistent object-based API for both reading and writing GitHub issues
 */

const axios = require('axios');
const { token } = require('../.secrets/github-token');

const BASE_URL = 'https://api.github.com';

/**
 * Common headers for all GitHub API requests
 */
const headers = {
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

/**
 * List issues in a repository
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {string} [params.state='open'] - State of issues to fetch ('open', 'closed', 'all')
 * @param {string|string[]} [params.labels] - Labels to filter by (comma-separated string or array)
 * @param {string} [params.sort='created'] - What to sort results by ('created', 'updated', 'comments')
 * @param {string} [params.direction='desc'] - Direction to sort ('asc' or 'desc')
 * @param {number} [params.per_page=30] - Number of results per page
 * @param {number} [params.page=1] - Page number
 * @returns {Promise<Array>} Array of issue objects
 */
async function listIssues({ owner, repo, state = 'open', labels = '', sort = 'created', direction = 'desc', per_page = 30, page = 1 }) {
  const url = `${BASE_URL}/repos/${owner}/${repo}/issues`;
  
  // Format labels if it's an array
  const formattedLabels = Array.isArray(labels) ? labels.join(',') : labels;
  
  const params = { 
    state, 
    labels: formattedLabels,
    sort,
    direction,
    per_page,
    page
  };
  
  try {
    const response = await axios.get(url, { headers, params });
    return response.data;
  } catch (error) {
    console.error(`Error listing issues: ${error.response?.status} - ${error.response?.data || error.message}`);
    throw error;
  }
}

/**
 * Get a single issue by number
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issue_number - Issue number
 * @returns {Promise<Object>} Issue object
 */
async function getIssue({ owner, repo, issue_number }) {
  const url = `${BASE_URL}/repos/${owner}/${repo}/issues/${issue_number}`;
  
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error getting issue: ${error.response?.status} - ${error.response?.data || error.message}`);
    throw error;
  }
}

/**
 * Create a new issue
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {string} params.title - Issue title
 * @param {string} params.body - Issue body/description
 * @param {string[]} [params.labels] - Array of labels to add
 * @param {string[]} [params.assignees] - Array of usernames to assign
 * @returns {Promise<Object>} Created issue object
 */
async function createIssue({ owner, repo, title, body, labels = [], assignees = [] }) {
  const url = `${BASE_URL}/repos/${owner}/${repo}/issues`;
  const data = { title, body, labels, assignees };
  
  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error creating issue: ${error.response?.status} - ${error.response?.data || error.message}`);
    throw error;
  }
}

/**
 * Update an existing issue
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string} [params.title] - New title
 * @param {string} [params.body] - New body text
 * @param {string} [params.state] - New state ('open' or 'closed')
 * @param {string[]} [params.labels] - Array of labels (replaces existing labels)
 * @param {string[]} [params.assignees] - Array of usernames to assign (replaces existing assignees)
 * @returns {Promise<Object>} Updated issue object
 */
async function updateIssue({ owner, repo, issue_number, title, body, state, labels, assignees }) {
  const url = `${BASE_URL}/repos/${owner}/${repo}/issues/${issue_number}`;
  const data = {};
  
  if (title !== undefined) data.title = title;
  if (body !== undefined) data.body = body;
  if (state !== undefined) data.state = state;
  if (labels !== undefined) data.labels = labels;
  if (assignees !== undefined) data.assignees = assignees;
  
  try {
    const response = await axios.patch(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating issue:', error.response?.data || error.message);
    console.error(`Error updating issue: ${error.response?.status} - ${error.response?.data || error.message}`);
    throw error;
  }
}

/**
 * Add labels to an issue
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string[]} params.labels - Array of label names to add
 * @returns {Promise<Array>} Array of labels
 */
async function addLabels({ owner, repo, issue_number, labels }) {
  const url = `${BASE_URL}/repos/${owner}/${repo}/issues/${issue_number}/labels`;
  
  try {
    const response = await axios.post(url, { labels }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error adding labels:', error.response?.data || error.message);
    console.error(`Error adding labels: ${error.response?.status} - ${error.response?.data || error.message}`);
    throw error;
  }
}

/**
 * Remove a label from an issue
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string} params.name - Label name to remove
 * @returns {Promise<boolean>} True if the label was successfully removed
 */
async function removeLabel({ owner, repo, issue_number, name }) {
  const url = `${BASE_URL}/repos/${owner}/${repo}/issues/${issue_number}/labels/${encodeURIComponent(name)}`;
  
  try {
    await axios.delete(url, { headers });
    return true;
  } catch (error) {
    console.error('Error removing label:', error.response?.data || error.message);
    console.error(`Error removing label: ${error.response?.status} - ${error.response?.data || error.message}`);
    throw error;
  }
}

/**
 * Create a comment on an issue
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string} params.body - Comment text
 * @returns {Promise<Object>} Comment object
 */
async function commentOnIssue({ owner, repo, issue_number, body }) {
  const url = `${BASE_URL}/repos/${owner}/${repo}/issues/${issue_number}/comments`;
  
  try {
    const response = await axios.post(url, { body }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating comment:', error.response?.data || error.message);
    console.error(`Error creating comment: ${error.response?.status} - ${error.response?.data || error.message}`);
    throw error;
  }
}

/**
 * List comments on an issue
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issue_number - Issue number
 * @returns {Promise<Array>} Array of comment objects
 */
async function listComments({ owner, repo, issue_number }) {
  const url = `${BASE_URL}/repos/${owner}/${repo}/issues/${issue_number}/comments`;
  
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('Error listing comments:', error.response?.data || error.message);
    console.error(`Error listing comments: ${error.response?.status} - ${error.response?.data || error.message}`);
    throw error;
  }
}

// Export all functions
module.exports = {
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
  addLabels,
  removeLabel,
  commentOnIssue,
  listComments
};
