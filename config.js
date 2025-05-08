/**
 * Central configuration for GitHub Issue Labeler
 * Using JS format to allow comments and better readability
 */

module.exports = {
  /**
   * Environment configurations
   * Only repository target changes between environments
   */
  environments: {
    testing: {
      active: true,
      repository: {
        owner: 'dmitriz',
        repo: 'issue-labeler',
        useLocalIssues: true
      }
    },
    production: {
      active: false, 
      repository: {
        owner: 'dmitriz',
        repo: 'issue-hub',
        useLocalIssues: false
      }
    }
  },
  
  /**
   * GitHub API configuration
   */
  github: {
    baseUrl: 'https://api.github.com',
    timeoutMs: 10000,
    maxSockets: 100
  },
  
  /**
   * Model configuration - same for all environments
   */
  model: {
    id: 'openai/gpt-4o',
    temperature: 0.3,
    maxTokens: 1000,
    apiEndpoint: 'https://models.github.ai/inference/chat/completions'
  }
};