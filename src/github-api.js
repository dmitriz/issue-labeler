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

/**
 * Loads the GitHub authentication token from secret files or environment variables.
 *
 * Attempts to retrieve the token from predefined secret files first; if not found, falls back to the `GITHUB_TOKEN` environment variable. Returns `null` if no token is available or if an error occurs during loading.
 *
 * @returns {string|null} The GitHub token if found, otherwise `null`.
 */
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

/**
 * Attempts to load a GitHub authentication token from local secret files.
 *
 * Checks for a `token` property in `.secrets/gh-model.js` and `.secrets/github.js`, returning the token if found. Returns `null` if no valid token is present in either file.
 *
 * @returns {string|null} The GitHub token if found, or `null` if unavailable.
 */
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

/**
 * Retrieves the GitHub token from the environment variable `GITHUB_TOKEN`.
 *
 * @returns {string|undefined} The GitHub token if set; otherwise, `undefined`.
 *
 * @remark Logs a warning if the token is not found in the environment.
 */
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

// Load configuration - use central config instead of separate files
const repoConfig = configLoader.getRepositoryConfig();
const apiConfig = configLoader.getApiConfig();

// Default repository information from config
const defaultOwner = repoConfig.owner;
const defaultRepo = repoConfig.repo;

// Base URL for GitHub API
const BASE_URL = apiConfig.baseUrl || 'https://api.github.com';

/**
 * Validates a GitHub API path segment to ensure it is safe and free from path traversal or injection risks.
 *
 * @param {string} segment - The path segment to validate.
 * @returns {string} The sanitized and validated path segment.
 *
 * @throws {Error} If {@link segment} is null, undefined, not a string, empty, contains path traversal patterns, or includes invalid characters.
 */
function validatePathSegment(segment) {
  // Prevent null or undefined values
  if (segment === null || segment === undefined) {
    throw new Error('Path segment cannot be null or undefined');
  }
  
  // Ensure string type
  if (typeof segment !== 'string') {
    throw new Error(`Invalid path segment: Expected string but got ${typeof segment}`);
  }
  
  // Normalize: trim and check for empty strings
  const normalizedSegment = segment.trim();
  if (normalizedSegment.length === 0) {
    throw new Error('Path segment cannot be empty');
  }
  
  // Check for dangerous patterns
  if (normalizedSegment.includes('..') || 
      normalizedSegment.includes('/') || 
      normalizedSegment.includes('\\') ||
      normalizedSegment.startsWith('.')) {
    throw new Error(`Invalid path segment "${segment}": Potential path traversal detected`);
  }
  
  // Allow only safe characters (alphanumeric, dash, underscore, period)
  if (!/^[\w.-]+$/.test(normalizedSegment)) {
    throw new Error(`Invalid path segment: "${segment}". Path segments must only contain alphanumeric characters, dashes, underscores, or periods.`);
  }
  
  return normalizedSegment;
}

/**
 * Creates an Axios client configured for authenticated GitHub API requests.
 *
 * @param {string} [providedToken] - Optional GitHub authentication token to override the default.
 * @param {boolean} [allowNoAuth=false] - If true, allows client creation without authentication (not recommended).
 * @returns {Object} Axios instance preconfigured for GitHub API access.
 * @throws {Error} If no authentication token is provided and {@link allowNoAuth} is false.
 *
 * @remark If created without authentication, API rate limits will be extremely limited.
 */
function createGitHubClient(providedToken = token, allowNoAuth = false) {
  // Fail fast if no token is provided unless explicitly allowed
  if (!providedToken && !allowNoAuth) {
    throw new Error('GitHub authentication token is required. Please set GITHUB_TOKEN environment variable or add it to .secrets.');
  }

  // Create standardized headers - conditionally add auth header only if token exists
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'issue-labeler-app',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  
  // Add auth header only if token exists
  if (providedToken) {
    headers['Authorization'] = `token ${providedToken}`;
  } else if (!allowNoAuth) {
    console.warn('WARNING: Creating GitHub client without authentication. API rate limits will be severely restricted.');
  }

  // Create a reusable axios instance with keepAlive enabled
  return axios.create({
    baseURL: BASE_URL,
    headers,
    timeout: apiConfig.timeoutMs || 10000,
    httpsAgent: new https.Agent({
      keepAlive: true,
      maxSockets: apiConfig.maxSockets || 10
    })
  });
}

// Create the default GitHub client - allow emergency fallback to unauthenticated mode
// but warn about severe rate limiting
const githubClient = token 
  ? createGitHubClient(token) 
  : createGitHubClient(null, true); // explicitly allow no auth as fallback

/**
 * Handles errors from GitHub API operations by enhancing the error with context and response details, logging relevant information, and either throwing or returning the enhanced error.
 *
 * @param {Error} error - The error encountered during a GitHub API operation.
 * @param {string} context - Description of the operation or context in which the error occurred.
 * @param {boolean} [shouldThrow=true] - If true, the enhanced error is thrown; otherwise, it is returned.
 * @returns {Error} The enhanced error if not thrown.
 * @throws {Error} If {@link shouldThrow} is true, throws the enhanced error with additional context and response details.
 */
function handleGitHubError(error, context, shouldThrow = true) {
  // Create a GitHub-specific error with enhanced context
  const enhancedError = new Error(`GitHub API Error ${context}: ${error.message}`);
  enhancedError.originalError = error;
  enhancedError.context = context;
  
  // Add response details if available
  if (error.response) {
    console.error(`API Error (${error.response.status}): ${context}`);
    console.error('Status:', error.response.status, error.response.statusText);
    console.error('Details:', JSON.stringify(error.response.data, null, 2));
    
    // Add response data to the enhanced error
    enhancedError.status = error.response.status;
    enhancedError.statusText = error.response.statusText;
    enhancedError.responseData = error.response.data;
  } else {
    console.error(`Network/Client Error: ${context}`);
    console.error(error);
  }
  
  // Always maintain consistent behavior - throw the enhanced error if requested
  if (shouldThrow) {
    throw enhancedError;
  }
  
  // Only return if explicitly requested not to throw
  return enhancedError;
}

/**
 * Retrieves a list of issues from a GitHub repository, supporting filtering, sorting, and pagination.
 *
 * Filters out pull requests from the results and normalizes label names to lowercase.
 *
 * @param {Object} [params] - Optional parameters for filtering and pagination.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository.
 * @param {string} [params.state] - Issue state to filter by: 'open', 'closed', or 'all'. Defaults to 'open'.
 * @param {string|string[]} [params.labels] - Labels to filter by, as a comma-separated string or array.
 * @param {string} [params.sort] - Field to sort by: 'created', 'updated', or 'comments'. Defaults to 'created'.
 * @param {string} [params.direction] - Sort direction: 'asc' or 'desc'. Defaults to 'desc'.
 * @param {number} [params.per_page] - Number of results per page. Defaults to 30.
 * @param {number} [params.page] - Page number to retrieve. Defaults to 1.
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
 * Retrieves the title, body, and number of a specific issue in a simplified format.
 *
 * @param {Object} params - Parameters for identifying the issue.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner if not provided.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository if not provided.
 * @param {number} params.issueNumber - The number of the issue to retrieve.
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
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner if not provided.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository if not provided.
 * @param {string} params.title - Title of the issue.
 * @param {string} params.body - Body or description of the issue.
 * @param {string[]} [params.labels] - Labels to assign to the issue.
 * @param {string[]} [params.assignees] - Usernames to assign to the issue.
 * @returns {Promise<Object>} The created issue object.
 *
 * @throws {Error} If required parameters {@link owner}, {@link repo}, or {@link title} are missing.
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
 * Updates an existing GitHub issue with new values for title, body, state, labels, or assignees.
 *
 * At least one of the updatable fields must be provided. The `labels` and `assignees` arrays, if specified, replace all existing labels or assignees on the issue.
 *
 * @param {Object} params - Issue update parameters.
 * @param {number} params.issue_number - The number of the issue to update.
 * @param {string} [params.title] - New title for the issue.
 * @param {string} [params.body] - New body content for the issue.
 * @param {string} [params.state] - New state for the issue; must be `'open'` or `'closed'`.
 * @param {string[]} [params.labels] - Labels to set on the issue.
 * @param {string[]} [params.assignees] - Usernames to assign to the issue.
 * @returns {Promise<Object>} The updated issue object.
 *
 * @throws {Error} If required parameters are missing, if `issue_number` is not a number, if `state` is invalid, or if no update fields are provided.
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
  if (Object.keys(data).length === 0) {
    throw new Error('At least one update field must be provided');
  }
  
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
 * @param {Object} params - Parameters for the operation.
 * @param {number} params.issue_number - The number of the issue to label.
 * @param {string[]} params.labels - The labels to add to the issue.
 * @returns {Promise<Array>} A promise that resolves to the updated list of labels on the issue.
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
 * Applies one or more labels to a GitHub issue using the `issueNumber` parameter.
 *
 * This function is an alias for {@link addLabels}, provided for compatibility with codebases that use `issueNumber` instead of `issue_number`.
 *
 * @param {Object} params - Parameters for labeling the issue.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repo.
 * @param {number} params.issueNumber - The number of the issue to label.
 * @param {string[]} params.labels - Array of label names to apply.
 * @returns {Promise<Array>} The updated list of labels on the issue.
 */
async function applyLabels({ owner = defaultOwner, repo = defaultRepo, issueNumber, labels }) {
  return addLabels({ owner, repo, issue_number: issueNumber, labels });
}

/**
 * Removes a label from a specified GitHub issue.
 *
 * @param {Object} params - Parameters for label removal.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner if not provided.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository if not provided.
 * @param {number} params.issue_number - The issue number from which to remove the label.
 * @param {string} params.name - The name of the label to remove.
 * @returns {Promise<boolean>} Resolves to true if the label was successfully removed.
 *
 * @throws {Error} If any required parameter is missing or invalid.
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
 * @param {Object} params - Parameters for commenting on the issue.
 * @param {number} params.issue_number - The number of the issue to comment on.
 * @param {string} params.body - The text of the comment.
 * @returns {Promise<Object>} The created comment object.
 *
 * @throws {Error} If required parameters are missing or invalid.
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
 * Retrieves all comments for a specific issue in a repository.
 *
 * @param {Object} params - Parameters for the request.
 * @param {string} [params.owner] - Repository owner. Defaults to the configured owner if not provided.
 * @param {string} [params.repo] - Repository name. Defaults to the configured repository if not provided.
 * @param {number} params.issue_number - The number of the issue to retrieve comments for.
 * @returns {Promise<Array>} A promise that resolves to an array of comment objects for the specified issue.
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
 * Implements retry logic with exponential backoff.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of open issue objects.
 */
async function getAllOpenIssues() {
  return retry(async () => {
    return await listIssues({ state: 'open' });
  }, { retries: 2, delay: 1000 });
}

/**
 * Retrieves issues that have a specific label, either by filtering an array of issues or by fetching from GitHub.
 *
 * If called with an array of issues and a label, returns only those issues containing the label. If called with a label string, fetches issues from GitHub that have that label.
 *
 * @param {Array|String} issues - An array of issue objects to filter, or a label string to fetch issues by.
 * @param {string} [label] - The label to filter by when providing an array of issues.
 * @returns {Promise<Array>|Array} Filtered issues or a promise resolving to issues with the specified label.
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
 * Returns information about the current repository and environment.
 *
 * @returns {{ owner: string, repo: string, isLocal: boolean, environment: string }} An object containing the repository owner, name, whether local issues are used, and the active environment name.
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
 * Executes an asynchronous function with automatic retries using exponential backoff and jitter.
 *
 * @param {Function} fn - The asynchronous function to execute.
 * @param {Object} [options] - Optional retry configuration.
 * @param {number} [options.retries=3] - Maximum number of retry attempts.
 * @param {number} [options.delay=500] - Initial delay in milliseconds before retrying, doubled on each attempt.
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
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt) + Math.floor(Math.random() * 100)));
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