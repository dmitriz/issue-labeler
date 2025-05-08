const axios = require('axios');
/**
 * @fileoverview Provides utilities for fetching GitHub issues.
 * 
 * @property {string} token - The GitHub personal access token for authentication.
 * @property {string} owner - The owner of the GitHub repository.
 * @property {string} repo - The name of the GitHub repository.
 * 
 * @typedef {Object} GitHubIssue
 * @property {number} id - The unique identifier of the issue.
 * @property {string} title - The title of the issue.
 * @property {string} body - The body content of the issue.
 * @property {Array<{name: string}>} labels - The labels associated with the issue.
 * @property {boolean} pull_request - Indicates if the issue is a pull request.
 */
// Ensure sensitive credentials are only accessed through environment variables
if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
  throw new Error('Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO');
}

// Flexible configuration: Try environment variables first, then fall back to local config file
const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

// Initialize GitHub API client
const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${token}`
  }
});

/**
 * Validates GitHub path segments to prevent path traversal attacks
 * @param {string} segment - Path segment to validate
 * @returns {string} - The validated segment
 */
function validatePathSegment(segment) {
  if (!/^[\w.-]+$/.test(segment)) {
    throw new Error(`Invalid path segment: "${segment}". Path segments must only contain alphanumeric characters, dashes, underscores, or periods.`);
  }
  return segment;
}

/**
 * Centralized error handling function
 * @param {Error} error - The error object
 * @param {string} context - Description of the operation that failed
 */
function handleGitHubError(error, context) {
  console.error(`Error ${context}: ${error.message}`);
  if (error.response) {
    console.error('API Error:', error.response.status, error.response.statusText);
    console.error('Error details:', error.response.data);
  }
  throw error;
}

/**
 * Fetches all open issues from the GitHub repository
 * @returns {Promise<Array<GitHubIssue>>} Array of GitHub issues
 */
async function getAllOpenIssues() {
  if (!owner || typeof owner !== 'string' || !owner.trim()) {
    throw new Error('GitHub owner must be a non-empty string');
  }
  if (!repo || typeof repo !== 'string' || !repo.trim()) {
    throw new Error('GitHub repo must be a non-empty string');
  }
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  try {
    const res = await githubClient.get(`/repos/${safeOwner}/${safeRepo}/issues?state=open`);
    // Filter out pull requests
    const issues = res.data.filter(issue => !issue.pull_request);
    issues.forEach(issue => {
      issue.labels = issue.labels.map(label => ({
        ...label,
        name: label.name.toLowerCase()
      }));
    });
    return issues;
  } catch (error) {
    handleGitHubError(error, 'fetching open issues');
    throw error;
  }
}

/**
 * Fetches all issues with a specific label
 * @param {string} label - The label to filter issues by
 * @returns {Promise<Array<GitHubIssue>>} Array of GitHub issues with the specified label
 */
async function getIssuesWithLabel(label) {
  if (!label || typeof label !== 'string' || !label.trim()) {
    throw new Error('Label must be a non-empty string');
  }
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  const safeLabel = encodeURIComponent(label.trim());
  
  try {
    const res = await githubClient.get(
      `/repos/${safeOwner}/${safeRepo}/issues?state=open&labels=${safeLabel}`
    );
    // Filter out pull requests
    const issues = res.data.filter(issue => !issue.pull_request);
    issues.forEach(issue => {
      issue.labels = issue.labels.map(label => ({
        ...label,
        name: label.name.toLowerCase()
      }));
    });
    return issues;
  } catch (error) {
    handleGitHubError(error, `fetching issues with label "${label}"`);
    throw error;
  }
}

module.exports = {
  getAllOpenIssues,
  getIssuesWithLabel
};