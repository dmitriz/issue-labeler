const axios = require('axios');
/**
 * @fileoverview Provides GitHub-related utilities and configurations.
 * 
 * @requires ../.secrets/github
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

// Flexible configuration: Try environment variables first, then fall back to local config file
let token, owner, repo;

// Try to load from environment variables
const envToken = process.env.GITHUB_TOKEN;
const envOwner = process.env.GITHUB_OWNER;
const envRepo = process.env.GITHUB_REPO;

// Try to load from local config file
let localConfig = {};
try {
  localConfig = require('../.secrets/github');
} catch (err) {
  // Silently continue if the file doesn't exist
}

// Use environment variables if defined, otherwise fall back to local config
token = envToken || localConfig.token;
owner = envOwner || localConfig.owner;
repo = envRepo || localConfig.repo;

const githubClient = require('./github-wrapper');

/**
 * Enhances label matching to be case-insensitive.
 * @param {Array} labels - List of labels associated with an issue.
 * @param {String} targetLabel - The label to match.
 * @returns {Boolean} - True if the target label is found (case-insensitive), otherwise false.
 */
function hasLabel(labels, targetLabel) {
  return labels.some(label => label.name.toLowerCase() === targetLabel.toLowerCase());
}
const { validatePathSegment, handleGitHubError } = require('./github-wrapper');

/**
 * Fetches all open issues from GitHub
 * @returns {Promise<Array>} - Array of issue objects
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