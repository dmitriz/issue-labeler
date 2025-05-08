/**
 * Central configuration file for the GitHub issue labeler application
 * Contains all configurable parameters used across the application
 */

module.exports = {
  /**
   * GitHub API configuration settings
   */
  github: {
    /**
     * Base URL for GitHub API
     */
    baseUrl: 'https://api.github.com',
    
    /**
     * API request timeout in milliseconds
     */
    timeoutMs: 10000,
    
    /**
     * Maximum concurrent connections
     */
    maxSockets: 100
  },
  
  /**
   * GitHub Model configuration settings
   */
  model: {
    /**
     * The model identifier to use for inference
     * Options: 'openai/gpt-4o', 'openai/gpt-4-turbo', etc.
     */
    modelId: 'openai/gpt-4o',
    
    /**
     * Temperature setting for model inference (0.0 to 1.0)
     * Lower values create more deterministic responses
     */
    temperature: 0.3,
    
    /**
     * Maximum number of tokens to generate in the response
     */
    maxTokens: 1000,
    
    /**
     * API endpoint for model inference
     */
    apiEndpoint: 'https://models.github.ai/inference/chat/completions'
  }
};