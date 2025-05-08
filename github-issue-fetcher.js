const axios = require('axios');
const configLoader = require('./config-loader');

/**
 * @fileoverview Provides utilities for fetching GitHub issues.
 * 
 * @typedef {Object} GitHubIssue
 * @property {number} id - The unique identifier of the issue.
 * @property {string} title - The title of the issue.
 * @property {string} body - The body content of the issue.
 * @property {Array<{name: string}>} labels - The labels associated with the issue.
 * @property {boolean} pull_request - Indicates if the issue is a pull request.
 */

// Load configuration
const config = configLoader.loadConfig();
const repoConfig = configLoader.getRepositoryConfig(config);
const apiConfig = configLoader.getApiConfig(config);

// Ensure sensitive credentials are only accessed through environment variables
if (!process.env.GITHUB_TOKEN) {
  throw new Error('Missing required environment variable: GITHUB_TOKEN');
}

const token = process.env.GITHUB_TOKEN;

// Get repository information from active environment configuration
const owner = repoConfig.owner;
const repo = repoConfig.repo;

if (!owner || !repo) {
  throw new Error('Missing repository owner or name in active environment configuration');
}

// Initialize GitHub API client with configuration
const githubClient = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'issue-labeler-app'
  },
  timeout: apiConfig.timeoutMs
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
    
    // Handle rate limiting according to configuration
    if (error.response.status === 429 && apiConfig.rateLimitHandling?.retryAfterRateLimit) {
      const retryAfter = parseInt(error.response.headers['retry-after']) || apiConfig.rateLimitHandling.backoffMs / 1000;
      console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    }
  }
  throw error;
}

/**
 * Fetches issues from either remote GitHub repository or local test data
 * based on the active environment configuration
 * @param {string} endpoint - API endpoint to call
 * @returns {Promise<Array<GitHubIssue>>} - Array of issues
 */
async function fetchIssues(endpoint) {
  // Check if we should use local test data instead of real API
  if (repoConfig.useLocalIssues) {
    console.log('Using local test issues data');
    try {
      // You would implement this function to return mock data for testing
      return getLocalIssues();
    } catch (error) {
      console.error('Failed to load local test issues:', error);
      throw error;
    }
  }
  
  // Otherwise, fetch from the real GitHub API
  try {
    const response = await githubClient.get(endpoint);
    const issues = response.data.filter(issue => !issue.pull_request);
    
    issues.forEach(issue => {
      issue.labels = issue.labels.map(label => ({
        ...label,
        name: label.name.toLowerCase()
      }));
    });
    
    return issues;
  } catch (error) {
    handleGitHubError(error, `fetching issues from ${endpoint}`);
    throw error;
  }
}

/**
 * Mock function to return local test issues
 * @returns {Array<GitHubIssue>} - Array of mock issues for testing
 */
function getLocalIssues() {
  // This could be expanded to load from a local JSON file or return hardcoded test data
  return [
    {
      id: 1,
      number: 1,
      title: "Test Issue: Add automated labeling",
      body: "We need to implement automated issue labeling for better triage",
      labels: [
        { name: "enhancement" }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      html_url: "https://github.com/test/test/issues/1"
    },
    {
      id: 2,
      number: 2,
      title: "Test Issue: Fix security vulnerability",
      body: "Critical security vulnerability found in authentication module",
      labels: [
        { name: "bug" }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      html_url: "https://github.com/test/test/issues/2"
    }
  ];
}

/**
 * Fetches all open issues from the configured GitHub repository
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
  
  const endpoint = `/repos/${safeOwner}/${safeRepo}/issues?state=open`;
  return fetchIssues(endpoint);
}

/**
 * Fetches all issues with a specific label from the configured GitHub repository
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
  
  const endpoint = `/repos/${safeOwner}/${safeRepo}/issues?state=open&labels=${safeLabel}`;
  return fetchIssues(endpoint);
}

/**
 * Gets the current repository configuration
 * @returns {Object} Current repository configuration
 */
function getCurrentRepositoryInfo() {
  return {
    owner,
    repo,
    isLocal: repoConfig.useLocalIssues,
    environment: configLoader.getActiveEnvironment().name
  };
}

module.exports = {
  getAllOpenIssues,
  getIssuesWithLabel,
  getCurrentRepositoryInfo
};