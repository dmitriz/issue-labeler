/**
 * GitHub API wrapper for issue-labeler project
 * Provides functions for fetching issues, adding labels, and commenting on issues
 */
const axios = require('axios');
const { token, owner, repo } = require('../.secrets/github');

const BASE_URL = 'https://api.github.com';

// Create an axios instance with default configuration
const github = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `token ${token}`,  // GitHub API expects 'token' prefix, not 'Bearer'
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'issue-labeler-app'
  },
  timeout: 5000 // 5 second timeout
});

/**
 * Fetch issues from the GitHub repository
 * @param {Object} options - Options object
 * @param {string} [options.state='open'] - Filter by issue state (open, closed, all)
 * @param {string} [options.labels=''] - Comma-separated list of label names
 * @returns {Promise<Array>} - Array of issue objects
 */
async function fetchIssues({ state = 'open', labels = '' }) {
  console.log(`Fetching issues for ${owner}/${repo}...`);
  try {
    const res = await github.get(`/repos/${owner}/${repo}/issues`, {
      params: { state, labels }
    });
    return res.data;
  } catch (error) {
    console.error(`Error fetching issues for ${owner}/${repo}: ${error.message} - URL: ${error.config.url}`);
    if (error.response) {
    throw error;
  }
}

/**
 * Add labels to a GitHub issue
 * @param {Object} options - Options object
 * @param {number} options.issue_number - The issue number to add labels to
 * @param {Array<string>} options.labels - Array of label names to add
 * @returns {Promise<Array>} - Array of labels on the issue after the operation
 */
async function addLabelsToIssue({ issue_number, labels }) {
  try {
    const res = await github.post(
      `/repos/${owner}/${repo}/issues/${issue_number}/labels`,
      { labels }
    );
    return res.data;
  } catch (error) {
    console.error(`Error adding labels to issue #${issue_number} for ${owner}/${repo}: ${error.message} - URL: ${error.config.url}`);
    throw error;
}

/**
 * Add a comment to a GitHub issue
 * @param {Object} options - Options object
 * @param {number} options.issue_number - The issue number to add a comment to
 * @param {string} options.body - The text content of the comment
 * @returns {Promise<Object>} - The created comment object
 */
async function commentOnIssue({ issue_number, body }) {
  try {
    const res = await github.post(
      `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
      { body }
    );
    return res.data;
  } catch (error) {
    console.error(`Error commenting on issue #${issue_number} for ${owner}/${repo}: ${error.message} - URL: ${error.config.url}`);
    throw error;
}

module.exports = {
  fetchIssues,
  addLabelsToIssue,
  commentOnIssue,
};