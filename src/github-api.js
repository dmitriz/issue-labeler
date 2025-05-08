/**
 * Unified GitHub API client for the issue labeling workflow
 * Provides a comprehensive set of functions for interacting with GitHub Issues API
 * Combines functionality from previous implementations:
 * - github-api.js
 * - github-api-client.js
 * - github-issue-fetcher.js
 * - github-issues.js
 */
const axios = require('axios');
const https = require('https');
const configLoader = require('./config-loader');
const fs = require('fs');
const path = require('path');

// Load GitHub token from various sources with better organization
function initializeGitHubToken() {
  try {
    // Try to load from secret files
    const token = loadTokenFromSecrets();
    if (token) return token;
    
    // Fall back to environment variable
    return loadTokenFromEnv();
  } catch (error) {
    console.warn('Failed to load GitHub token:', error.message);
    return null;
  }
}

function loadTokenFromSecrets() {
  const secretsDir = path.resolve(__dirname, '..', '.secrets');
  
  // Try loading from gh-model.js first
  if (fs.existsSync(path.join(secretsDir, 'gh-model.js'))) {
    const maybeSecrets = require('../.secrets/gh-model');
    if (maybeSecrets && maybeSecrets.token) {
      return maybeSecrets.token;
    }
    console.warn('File gh-model.js found but no valid token property exists');
  }
  
  // Try loading from github.js next
  if (fs.existsSync(path.join(secretsDir, 'github.js'))) {
    const maybeSecrets = require('../.secrets/github');
    if (maybeSecrets && maybeSecrets.token) {
      return maybeSecrets.token;
    }
    console.warn('File github.js found but no valid token property exists');
  }
  
  return null;
}

function loadTokenFromEnv() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('No GitHub token found in environment variables');
  }
  return token;
}

// Initialize the token
const token = initializeGitHubToken();

// Final validation and warning
if (!token) {
  console.warn('No GitHub token found – unauthenticated requests will hit very low ' +
               'rate-limits (<60/h). Set GITHUB_TOKEN or add it to .secrets.');
}
    const maybeSecrets = require('../.secrets/github');
    if (maybeSecrets && maybeSecrets.token) {
      token = maybeSecrets.token;
    } else {
      console.warn('File github.js found but no valid token property exists');
    }
  }
} catch (error) {
  console.warn('Failed to load GitHub token from secrets:', error.message);
}

// Fall back to environment variable if secrets didn't work
if (!token) {
  token = process.env.GITHUB_TOKEN;
}

// Final validation and warning
if (!token) {
  console.warn('No GitHub token found – unauthenticated requests will hit very low ' +
               'rate-limits (<60/h). Set GITHUB_TOKEN or add it to .secrets.');
}

// Load configuration - use central config instead of separate files
const repoConfig = configLoader.getRepositoryConfig();
const apiConfig = configLoader.getApiConfig();

// Default repository information from config
const defaultOwner = repoConfig.owner;
const defaultRepo = repoConfig.repo;

// Base URL for GitHub API
const BASE_URL = apiConfig.baseUrl || 'https://api.github.com';

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
 * Create standardized GitHub API client with proper authentication
 * @param {string} [providedToken] - Optional token to override the default
 * @returns {Object} - Axios instance configured for GitHub API
 */
function createGitHubClient(providedToken = token) {
  if (!providedToken) {
    console.warn('GitHub token is not set. API calls will likely fail due to authentication issues.');
  }

  // Create standardized headers
  const headers = {
    'Authorization': `token ${providedToken}`,  // GitHub API prefers 'token' prefix
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'issue-labeler-app',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  // Create a reusable axios instance with keepAlive enabled
  return axios.create({
    baseURL: BASE_URL,
    headers,
    timeout: apiConfig.timeoutMs || 10000,
    httpsAgent: new https.Agent({
      keepAlive: true,
      maxSockets: apiConfig.maxSockets || 5
    })
  });
}

// Create the default GitHub client
const githubClient = createGitHubClient();

/**
 * Centralized error handling function
 * @param {Error} error - The error object
 * @param {string} context - Description of the operation that failed
 * @param {boolean} [shouldThrow=true] - Whether to throw the error after logging
 * @returns {Error} - The original error (if not throwing)
 */
function handleGitHubError(error, context, shouldThrow = true) {
  console.error(`Error ${context}: ${error.message}`);
  if (error.response) {
    console.error('API Error:', error.response.status, error.response.statusText);
    console.error('Error details:', error.response.data);
  }
  
  if (shouldThrow) {
    throw error;
  }
  return error;
}

/**
 * List issues in a repository
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {string} [params.state='open'] - State of issues to fetch ('open', 'closed', 'all')
 * @param {string|string[]} [params.labels] - Labels to filter by (comma-separated string or array)
 * @param {string} [params.sort='created'] - What to sort results by ('created', 'updated', 'comments')
 * @param {string} [params.direction='desc'] - Direction to sort ('asc' or 'desc')
 * @param {number} [params.per_page=30] - Number of results per page
 * @param {number} [params.page=1] - Page number
 * @returns {Promise<Array>} Array of issue objects
 */
async function listIssues({
  owner = defaultOwner,
  repo = defaultRepo,
  state = 'open',
  labels = '',
  sort = 'created',
  direction = 'desc',
  per_page = 30,
  page = 1
} = {}) {
  // Validate required parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  
  // Validate state parameter if provided
  if (state && !['open', 'closed', 'all'].includes(state)) {
    throw new Error('Parameter "state" must be one of: open, closed, all');
  }
  
  // Validate and sanitize parameters
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  
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
    console.log(`Fetching issues for ${owner}/${repo}...`);
    const response = await githubClient.get(`/repos/${safeOwner}/${safeRepo}/issues`, { params });
    
    // Filter out pull requests as they're also returned by the issues endpoint
    const issues = response.data.filter(issue => !issue.pull_request);
    
    // Normalize label names to lowercase
    issues.forEach(issue => {
      if (issue.labels && Array.isArray(issue.labels)) {
        issue.labels = issue.labels.map(label => ({
          ...label,
          name: typeof label.name === 'string' ? label.name.toLowerCase() : label.name
        }));
      }
    });
    
    return issues;
  } catch (error) {
    return handleGitHubError(error, `fetching issues for ${owner}/${repo}`);
  }
}

/**
 * Get a single issue by number
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {number} params.issue_number - Issue number
 * @returns {Promise<Object>} Issue object
 */
async function getIssue({ owner = defaultOwner, repo = defaultRepo, issue_number }) {
  // Validate required parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  if (issue_number === undefined) throw new Error('Parameter "issue_number" is required');
  if (typeof issue_number !== 'number') throw new Error('Parameter "issue_number" must be a number');
  
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  
  try {
    const response = await githubClient.get(`/repos/${safeOwner}/${safeRepo}/issues/${issue_number}`);
    return response.data;
  } catch (error) {
    return handleGitHubError(error, `getting issue #${issue_number} from ${owner}/${repo}`);
  }
}

/**
 * Get issue content in a simplified format suitable for labeling
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {number} params.issueNumber - Issue number
 * @returns {Promise<Object>} - Issue object with title, body, and number
 */
async function getIssueContent({ owner = defaultOwner, repo = defaultRepo, issueNumber }) {
  // Validate parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  if (issueNumber === undefined) throw new Error('Parameter "issueNumber" is required');
  
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  
  try {
    const response = await githubClient.get(`/repos/${safeOwner}/${safeRepo}/issues/${issueNumber}`);
    return {
      title: response.data.title || '',
      body: response.data.body || '',
      number: response.data.number
    };
  } catch (error) {
    return handleGitHubError(error, `fetching content for issue #${issueNumber}`);
  }
}

/**
 * Create a new issue
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {string} params.title - Issue title
 * @param {string} params.body - Issue body/description
 * @param {string[]} [params.labels] - Array of labels to add
 * @param {string[]} [params.assignees] - Array of usernames to assign
 * @returns {Promise<Object>} Created issue object
 */
async function createIssue({ owner = defaultOwner, repo = defaultRepo, title, body, labels = [], assignees = [] } = {}) {
  // Validate required parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  if (!title) throw new Error('Parameter "title" is required');
  
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  const data = { title, body, labels, assignees };
  
  try {
    const response = await githubClient.post(`/repos/${safeOwner}/${safeRepo}/issues`, data);
    return response.data;
  } catch (error) {
    return handleGitHubError(error, `creating issue in ${owner}/${repo}`);
  }
}

/**
 * Update an existing issue
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string} [params.title] - New title
 * @param {string} [params.body] - New body text
 * @param {string} [params.state] - New state ('open' or 'closed')
 * @param {string[]} [params.labels] - Array of labels (replaces existing labels)
 * @param {string[]} [params.assignees] - Array of usernames to assign (replaces existing assignees)
 * @returns {Promise<Object>} Updated issue object
 */
async function updateIssue({
  owner = defaultOwner,
  repo = defaultRepo,
  issue_number,
  title,
  body,
  state,
  labels,
  assignees
} = {}) {
  // Validate required parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  if (issue_number === undefined) throw new Error('Parameter "issue_number" is required');
  if (typeof issue_number !== 'number') throw new Error('Parameter "issue_number" must be a number');
  
  // Validate state parameter if provided
  if (state !== undefined && !['open', 'closed'].includes(state)) {
    throw new Error('Parameter "state" must be one of: open, closed');
  }
  
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  const data = {};
  
  if (title !== undefined) data.title = title;
  if (body !== undefined) data.body = body;
  if (state !== undefined) data.state = state;
  if (labels !== undefined) data.labels = labels;
  if (assignees !== undefined) data.assignees = assignees;
  
  try {
    const response = await githubClient.patch(`/repos/${safeOwner}/${safeRepo}/issues/${issue_number}`, data);
    return response.data;
  } catch (error) {
    return handleGitHubError(error, `updating issue #${issue_number} in ${owner}/${repo}`);
  }
}

/**
 * Add labels to an issue
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string[]} params.labels - Array of label names to add
 * @returns {Promise<Array>} Array of labels
 */
async function addLabels({ owner = defaultOwner, repo = defaultRepo, issue_number, labels } = {}) {
  // Validate required parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  if (issue_number === undefined) throw new Error('Parameter "issue_number" is required');
  if (!labels || !Array.isArray(labels)) throw new Error('Parameter "labels" must be an array');
  
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  
  try {
    const response = await githubClient.post(
      `/repos/${safeOwner}/${safeRepo}/issues/${issue_number}/labels`,
      { labels }
    );
    return response.data;
  } catch (error) {
    return handleGitHubError(error, `adding labels to issue #${issue_number} in ${owner}/${repo}`);
  }
}

/**
 * Apply labels to a GitHub issue (alias for addLabels with issueNumber param for compatibility)
 */
async function applyLabels({ owner = defaultOwner, repo = defaultRepo, issueNumber, labels }) {
  return addLabels({ owner, repo, issue_number: issueNumber, labels });
}

/**
 * Remove a label from an issue
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string} params.name - Label name to remove
 * @returns {Promise<boolean>} True if successful
 */
async function removeLabel({ owner = defaultOwner, repo = defaultRepo, issue_number, name } = {}) {
  // Validate required parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  if (issue_number === undefined) throw new Error('Parameter "issue_number" is required');
  if (!name) throw new Error('Parameter "name" is required');
  
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  
  try {
    await githubClient.delete(
      `/repos/${safeOwner}/${safeRepo}/issues/${issue_number}/labels/${encodeURIComponent(name)}`
    );
    return true;
  } catch (error) {
    return handleGitHubError(error, `removing label "${name}" from issue #${issue_number} in ${owner}/${repo}`);
  }
}

/**
 * Comment on an issue
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {number} params.issue_number - Issue number
 * @param {string} params.body - Comment text
 * @returns {Promise<Object>} Comment object
 */
async function commentOnIssue({ owner = defaultOwner, repo = defaultRepo, issue_number, body } = {}) {
  // Validate required parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  if (issue_number === undefined) throw new Error('Parameter "issue_number" is required');
  if (!body) throw new Error('Parameter "body" is required');
  
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  
  try {
    const response = await githubClient.post(
      `/repos/${safeOwner}/${safeRepo}/issues/${issue_number}/comments`,
      { body }
    );
    return response.data;
  } catch (error) {
    return handleGitHubError(error, `commenting on issue #${issue_number} in ${owner}/${repo}`);
  }
}

/**
 * List comments on an issue
 * @param {Object} params - Parameters object
 * @param {string} [params.owner=defaultOwner] - Repository owner
 * @param {string} [params.repo=defaultRepo] - Repository name
 * @param {number} params.issue_number - Issue number
 * @returns {Promise<Array>} Array of comment objects
 */
async function listComments({ owner = defaultOwner, repo = defaultRepo, issue_number } = {}) {
  // Validate required parameters
  if (!owner) throw new Error('Parameter "owner" is required');
  if (!repo) throw new Error('Parameter "repo" is required');
  if (issue_number === undefined) throw new Error('Parameter "issue_number" is required');
  
  const safeOwner = validatePathSegment(owner.trim());
  const safeRepo = validatePathSegment(repo.trim());
  
  try {
    const response = await githubClient.get(
      `/repos/${safeOwner}/${safeRepo}/issues/${issue_number}/comments`
    );
    return response.data;
  } catch (error) {
    return handleGitHubError(error, `listing comments for issue #${issue_number} in ${owner}/${repo}`);
  }
}

/**
 * Get all open issues
 * @returns {Promise<Array>} Array of open issue objects
 */
async function getAllOpenIssues() {
  return listIssues({ state: 'open' });
}

/**
 * Gets issues with a specific label
 * @param {string|Array} issues - Array of issues to filter or label to search for
 * @param {string} [label] - Label to filter by (if first param is array of issues)
 * @returns {Promise<Array>|Array} - Filtered array of issues or promise resolving to issues
 */
function getIssuesWithLabel(issues, label) {
  // Case 1: Function was called with (issues[], label) to filter existing issues
  if (Array.isArray(issues) && typeof label === 'string') {
    return issues.filter(issue => 
      issue.labels && 
      issue.labels.some(l => 
        (typeof l === 'string' && l.toLowerCase() === label.toLowerCase()) ||
        (l.name && l.name.toLowerCase() === label.toLowerCase())
      )
    );
  }
  
  // Case 2: Function was called with just (label) to fetch issues with that label
  if (typeof issues === 'string' && !label) {
    return listIssues({ labels: issues });
  }
  
  throw new Error('Invalid parameters: Expected (issues[], label) or (label)');
}

/**
 * Gets the current repository configuration
 * @returns {Object} Current repository configuration
 */
function getCurrentRepositoryInfo() {
  return {
    owner: defaultOwner,
    repo: defaultRepo,
    isLocal: repoConfig.useLocalIssues || false,
    environment: configLoader.getActiveEnvironment().name
  };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Object} [options] - Retry options
 * @param {number} [options.retries=3] - Number of times to retry
 * @param {number} [options.delay=500] - Base delay in ms
 * @returns {Promise<any>} - The function result
 */
async function retry(fn, options = {}) {
  const { retries = 3, delay = 500 } = options;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

module.exports = {
  // Main issue operations
  listIssues,
  getIssue,
  getIssueContent,
  createIssue,
  updateIssue,
  addLabels,
  applyLabels,
  removeLabel,
  commentOnIssue,
  listComments,
  
  // Specialized operations from github-issue-fetcher
  getAllOpenIssues,
  getIssuesWithLabel,
  getCurrentRepositoryInfo,
  
  // Backward compatibility functions
  addLabelsToIssue: addLabels,  // Alias for compatibility with old scripts
  fetchIssues: listIssues,       // Alias for compatibility with old scripts
  
  // Utilities
  retry,
  validatePathSegment,
  handleGitHubError,
  createGitHubClient
};