/**
 * Central configuration for GitHub Issue Labeler
 * Using JS format to allow comments and better readability
 */

module.exports = {
  /**
   * Environment configurations
   * ONLY the repository target changes between environments
   * All other settings remain constant across environments
   */
  environments: {
    testing: {
      active: true,
      repository: {
        owner: 'dmitriz',
        repo: 'issue-labeler',
        // Repository to use during development and testing
      }
    },
    production: {
      active: false, 
      repository: {
        owner: 'dmitriz',
        repo: 'issue-hub',
        // The actual production repository where real issues will be labeled
      }
    }
  },
  
  /**
   * GitHub API configuration
   * Settings that control how the application connects to GitHub's API
   */
  github: {
    // Base URL for GitHub's REST API
    baseUrl: 'https://api.github.com',
    
    // Request timeout in milliseconds
    // Prevents hanging requests by failing after this duration
    timeoutMs: 10000,
    
    // Maximum number of concurrent sockets to use for API calls
    // Controls how many parallel connections can be made to GitHub
    // Higher values allow more concurrent requests but may hit rate limits
    maxSockets: 100
  },
  
  /**
   * Model configuration
   * Settings for the AI model used to analyze and label issues
   */
  model: {
    // The model name/identifier to use for issue analysis
    // Format: 'provider/model-name'
    name: 'openai/gpt-4o',
    
    // Controls randomness: 0 = deterministic, 1 = maximum randomness
    // Lower values produce more consistent/predictable responses
    temperature: 0.3,
    
    // Maximum number of tokens (words) in the response
    // Controls the length of the model's output
    maxTokens: 1000,
    
    // URL endpoint for the model API
    apiEndpoint: 'https://models.github.ai/inference/chat/completions'
  },

  /**
   * Label configuration
   * Settings for which labels are allowed to be applied
   */
  labels: {
    // Only these labels will be applied, all others will be ignored
    allowedLabels: ['urgent', 'important'],
    
    // Mapping from model output to labels (if needed for future use)
    mapping: {}
  }
};