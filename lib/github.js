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
 * Retrieves all open issues from the configured GitHub repository, excluding pull requests.
 *
 * Each issue's label names are normalized to lowercase.
 *
 * @returns {Promise<GitHubIssue[]>} A promise that resolves to an array of open issues.
 *
 * @throws {Error} If the GitHub owner or repository is not a non-empty string, or if the API request fails.
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

module.exports = {
  getAllOpenIssues,
  getIssuesWithLabel
};
