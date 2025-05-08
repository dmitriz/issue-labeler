/**
 * GitHub Model API client for issue labeling workflow
 * Provides functions for model inference to determine issue labels
 */
const axios = require('axios');
const https = require('https');
const configLoader = require('./config-loader');
const fs = require('fs');
const path = require('path');

// Load configuration 
const modelConfig = configLoader.getModelConfig();
const apiConfig = configLoader.getApiConfig();

// Get token from .secrets first
let token;
try {
  // Check if we're using gh-model.js or github.js in the secrets folder
  if (fs.existsSync(path.join(__dirname, '.secrets', 'gh-model.js'))) {
    token = require('./.secrets/gh-model').token;
  } else {
    token = require('./.secrets/github').token;
  }
} catch (error) {
  console.error('Failed to load secrets:', error.message);
  process.exit(1);
}

// Create a reusable axios instance with keepAlive enabled
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ keepAlive: true }),
  timeout: apiConfig.timeoutMs || 10000
});

// Regex for cleaning markdown code blocks
const MARKDOWN_CODE_BLOCK_REGEX = /```(?:\w+)?\s*([\s\S]*?)```/;

/**
 * Parse and extract JSON data from model response
 * @param {string} rawContent - Raw text from model response
 * @returns {Object} - Parsed JSON object
 */
function parseModelResponse(rawContent) {
  // Extract JSON object from the response (handling possible markdown code blocks)
  let jsonContent = rawContent;
  const jsonMatch = rawContent.match(/```(?:json|js)?\s*([\s\S]*?)```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonContent = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(jsonContent);
  } catch (parseError) {
    console.error('Failed to parse JSON response:', parseError.message);
    console.error('Raw response:', rawContent);
    throw new Error('Failed to parse model response');
  }
}

/**
 * Clean model response by removing markdown code blocks if present
 * @param {string} rawContent - Raw text from model response
 * @returns {string} - Cleaned content
 */
function cleanModelResponse(rawContent) {
  if (rawContent.startsWith('```') && rawContent.endsWith('```')) {
    const match = rawContent.match(MARKDOWN_CODE_BLOCK_REGEX);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return rawContent;
}

/**
 * Calls the GitHub model API for inference using structured prompt
 * @param {string} prompt - The input prompt for the model
 * @returns {Object} - Object containing urgency and importance values
 */
async function callModel(prompt) {
  try {
    const response = await axiosInstance.post(modelConfig.apiEndpoint, {
      messages: [
        { role: "user", content: prompt }
      ],
      model: modelConfig.id,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    }, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    // Extract content from response
    if (!response.data.choices || !response.data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from GitHub model API');
    }

    const rawContent = response.data.choices[0].message.content.trim();
    const parsedJson = parseModelResponse(rawContent);
    
    return {
      urgency: parsedJson.urgency && parsedJson.urgency.trim() !== '' ? parsedJson.urgency.trim() : null,
      importance: parsedJson.importance && parsedJson.importance.trim() !== '' ? parsedJson.importance.trim() : null
    };
  } catch (error) {
    handleModelError(error);
    throw error;
  }
}

/**
 * Calls the GitHub model API with raw prompt and returns the raw response
 * @param {Object} options - Options object
 * @param {string} options.prompt - The input prompt for the model
 * @returns {string} - Raw model response
 */
async function callGithubModel({ prompt }) {
  try {
    const response = await axiosInstance.post(modelConfig.apiEndpoint, {
      messages: [
        { role: "user", content: prompt }
      ],
      model: modelConfig.id,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    }, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    // Validate that the API response has the expected structure
    if (!response.data.choices || !response.data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from GitHub model API');
    }

    const rawContent = response.data.choices[0].message.content.trim();
    return cleanModelResponse(rawContent);
  } catch (error) {
    handleModelError(error);
    throw error;
  }
}

/**
 * Handle model API errors with proper logging and retry information
 * @param {Error} error - The error object
 */
function handleModelError(error) {
  // Check for rate limiting
  if (error.response?.status === 429) {
    console.warn("Rate limit exceeded. Implementing exponential backoff retry.");
    // Get retry-after header if available or default to 1 second
    const retryAfter = parseInt(error.response.headers?.['retry-after']) || 1;
    console.log(`Retrying after ${retryAfter} seconds`);
    throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
  }

  console.error('Error calling GitHub model:', error.message);
  if (error.response) {
    console.error('API Error:', error.response.status, error.response.statusText);
    console.error('Error details:', error.response.data);
  } else {
    console.error('Error stack:', error.stack);
  }
}

module.exports = {
  callModel,
  callGithubModel
};