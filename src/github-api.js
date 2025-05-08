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

// Get token from .secrets first
let token;
try {
  // Check if we're using gh-model.js or github.js in the secrets folder
  // Path to secrets is in the root directory, not src
  const secretsDir = path.join(__dirname, '..', '.secrets');
  if (fs.existsSync(path.join(secretsDir, 'gh-model.js'))) {
    token = require('../.secrets/gh-model').token;
  } else {
    token = require('../.secrets/github').token;
  }
} catch (error) {
  // Fall back to environment variable
  token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('Failed to load GitHub token from secrets or environment:', error.message);
  }
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
 * Validates that a GitHub API path segment contains only safe characters.
 *
 * Throws an error if the segment contains characters other than alphanumerics, dashes, underscores, or periods.
 *
 * @param {string} segment - The path segment to validate.
 * @returns {string} The validated segment.
 *
 * @throws {Error} If {@link segment} contains invalid characters.
 */
function validatePathSegment(segment) {
  if (!/^[\w.-]+$/.test(segment)) {
    throw new Error(`Invalid path segment: "${segment}". Path segments must only contain alphanumeric characters, dashes, underscores, or periods.`);
  }
  return segment;
}

/**
 * Creates an authenticated Axios client configured for GitHub API requests.
 *
 * @param {string} [providedToken] - Optional GitHub token to use for authentication.
 * @returns {Object} Axios instance preconfigured with authentication headers, API version, and keep-alive HTTPS agent.
 *
 * @remark
 * If no token is provided, API requests may fail due to authentication errors.
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
 * Handles errors from GitHub API operations by logging details and optionally rethrowing the error.
 *
 * @param {Error} error - The error encountered during a GitHub API operation.
 * @param {string} context - Description of the operation where the error occurred.
 * @param {boolean} [shouldThrow=true] - If true, rethrows the error after logging; otherwise returns the error.
 * @returns {Error} The original error if not thrown.
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
 * Retrieves a list of issues from a GitHub repository with optional filtering, sorting, and pagination.
 *
 * Filters out pull requests from the results and normalizes label names to lowercase.
 *
 * @param {Object} [params] - Optional parameters for filtering and pagination.
 * @param {string} [params.owner] - Repository owner.
 * @param {string} [params.repo] - Repository name.
 * @param {string} [params.state] - Issue state to filter by ('open', 'closed', or 'all').
 * @param {string|string[]} [params.labels] - Labels to filter by (comma-separated string or array).
 * @param {string} [params.sort] - Field to sort by ('created', 'updated', or 'comments').
 * @param {string} [params.direction] - Sort direction ('asc' or 'desc').
 * @param {number} [params.per_page] - Number of results per page.
 * @param {number} [params.page] - Page number.
 * @returns {Promise<Array>} Promise resolving to an array of issue objects.
 *
 * @throws {Error} If required parameters are missing or invalid.
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
 * Retrieves a single issue from a GitHub repository by its issue number.
 *
 * @param {Object} params - Parameters for issue retrieval.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner if not provided.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository if not provided.
 * @param {number} params.issue_number - The number of the issue to retrieve.
 * @returns {Promise<Object>} The issue object returned by the GitHub API.
 *
 * @throws {Error} If required parameters are missing or invalid.
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
 * Retrieves the title, body, and number of a GitHub issue for simplified labeling workflows.
 *
 * @param {Object} params - Parameters for issue lookup.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository.
 * @param {number} params.issueNumber - The issue number to retrieve.
 * @returns {Promise<Object>} An object containing the issue's title, body, and number.
 *
 * @throws {Error} If required parameters are missing or invalid.
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
 * Creates a new GitHub issue in the specified repository.
 *
 * @param {Object} params - Issue creation parameters.
 * @param {string} [params.owner] - Repository owner; defaults to the configured owner.
 * @param {string} [params.repo] - Repository name; defaults to the configured repository.
 * @param {string} params.title - Title of the issue.
 * @param {string} params.body - Body or description of the issue.
 * @param {string[]} [params.labels] - Labels to assign to the issue.
 * @param {string[]} [params.assignees] - Usernames to assign to the issue.
 * @returns {Promise<Object>} The created issue object.
 *
 * @throws {Error} If required parameters are missing or invalid.
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
 * Updates an existing GitHub issue with new title, body, state, labels, or assignees.
 *
 * Only the provided fields are updated; omitted fields remain unchanged. The `labels` and `assignees` arrays, if provided, replace all existing labels or assignees on the issue.
 *
 * @param {Object} params - Issue update parameters.
 * @param {number} params.issue_number - The number of the issue to update.
 * @param {string} [params.title] - New title for the issue.
 * @param {string} [params.body] - New body text for the issue.
 * @param {string} [params.state] - New state for the issue ('open' or 'closed').
 * @param {string[]} [params.labels] - Labels to set on the issue.
 * @param {string[]} [params.assignees] - Usernames to assign to the issue.
 * @returns {Promise<Object>} The updated issue object.
 *
 * @throws {Error} If required parameters are missing or invalid, or if the GitHub API request fails.
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
 * Adds one or more labels to a GitHub issue.
 *
 * @param {Object} params - Parameters for adding labels.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository.
 * @param {number} params.issue_number - The issue number to which labels will be added.
 * @param {string[]} params.labels - Array of label names to add.
 * @returns {Promise<Array>} A promise that resolves to an array of labels added to the issue.
 *
 * @throws {Error} If required parameters are missing or invalid.
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
 * Applies labels to a GitHub issue using the `issueNumber` parameter.
 *
 * This function is an alias for {@link addLabels}, accepting `issueNumber` instead of `issue_number` for compatibility.
 *
 * @param {Object} params
 * @param {string} [params.owner] - Repository owner.
 * @param {string} [params.repo] - Repository name.
 * @param {number} params.issueNumber - The issue number to label.
 * @param {string[]} params.labels - Array of label names to apply.
 * @returns {Promise<Array>} A promise that resolves to the array of applied labels.
 */
async function applyLabels({ owner = defaultOwner, repo = defaultRepo, issueNumber, labels }) {
  return addLabels({ owner, repo, issue_number: issueNumber, labels });
}

/**
 * Removes a label from a GitHub issue.
 *
 * @param {Object} params - Parameters for label removal.
 * @param {number} params.issue_number - The issue number.
 * @param {string} params.name - The name of the label to remove.
 * @returns {Promise<boolean>} Resolves to true if the label was successfully removed.
 *
 * @throws {Error} If required parameters are missing.
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
 * Adds a comment to a GitHub issue.
 *
 * @param {Object} params - Parameters for the comment.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository.
 * @param {number} params.issue_number - The issue number to comment on.
 * @param {string} params.body - The comment text.
 * @returns {Promise<Object>} The created comment object.
 *
 * @throws {Error} If required parameters are missing.
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
 * Retrieves all comments for a specified issue in a GitHub repository.
 *
 * @param {Object} params - Parameters for the request.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner if not provided.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository if not provided.
 * @param {number} params.issue_number - The number of the issue to retrieve comments for.
 * @returns {Promise<Array>} A promise that resolves to an array of comment objects for the issue.
 *
 * @throws {Error} If required parameters are missing or invalid.
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
 * Retrieves all open issues in the current repository.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of open issue objects.
 */
async function getAllOpenIssues() {
  return listIssues({ state: 'open' });
}

/**
 * Retrieves issues that have a specific label, either by filtering an array of issues or by fetching from GitHub.
 *
 * If called with an array of issues and a label, returns only those issues containing the label (case-insensitive). If called with a single label string, fetches issues with that label from the repository.
 *
 * @param {Array|String} issues - Array of issue objects to filter, or a label string to fetch issues by.
 * @param {string} [label] - Label to filter by when providing an array of issues.
 * @returns {Promise<Array>|Array} Filtered array of issues or a promise resolving to issues with the specified label.
 *
 * @throws {Error} If parameters do not match the expected usage.
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
 * Returns information about the current repository configuration.
 *
 * @returns {Object} An object containing the repository owner, name, whether local issues are used, and the active environment name.
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
 * Executes an asynchronous function with retries and exponential backoff on failure.
 *
 * @param {Function} fn - An async function to execute.
 * @param {Object} [options] - Optional retry configuration.
 * @param {number} [options.retries=3] - Maximum number of retry attempts.
 * @param {number} [options.delay=500] - Initial delay in milliseconds before retrying.
 * @returns {Promise<any>} Resolves with the result of {@link fn} if successful.
 *
 * @throws {Error} If all retry attempts fail, throws the last encountered error.
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