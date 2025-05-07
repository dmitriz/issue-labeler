/**
 * GitHub Model API wrapper for the issue labeling workflow
 * Provides a function for model inference to determine issue labels
 */
const axios = require('axios');
const token = process.env.GITHUB_MODEL_TOKEN || require('../.secrets/gh-model').token;

if (!token) {
  console.error('GITHUB_MODEL_TOKEN environment variable is not set');
  process.exit(1);
}
const config = require('../config/github-model');
const yaml = require('js-yaml');

// Create a reusable axios instance with keepAlive enabled
const https = require('https');
const https = require('https');
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ keepAlive: true }),
  timeout: 10000
});

/**
 * Calls the GitHub model API for inference.
 * @param {string} prompt - The input prompt for the model.
 * @returns {Object} - Object containing urgency and importance values.
 */
async function callModel(prompt) {
  try {
    const response = await axiosInstance.post(config.apiEndpoint, {
      messages: [
      { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens
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
    
    // Extract YAML block from the response
    let yamlContent = rawContent;
    const yamlMatch = rawContent.match(/```(?:`yaml`)?\s*([\s\S]*?)```/);
      const parsedYaml = yaml.load(yamlContent, { schema: yaml.JSON_SCHEMA });
      return {
        urgency: parsedYaml.urgency && parsedYaml.urgency.trim() !== '' ? parsedYaml.urgency.trim() : null,
        importance: parsedYaml.importance && parsedYaml.importance.trim() !== '' ? parsedYaml.importance.trim() : null
      };
    try {
      const parsedYaml = yaml.load(yamlContent);
      return {
        urgency: parsedYaml.urgency || null,
        importance: parsedYaml.importance || null
      };
    } catch (parseError) {
      console.error('Failed to parse YAML response:', parseError.message);
      console.error('Raw response:', rawContent);
      throw new Error('Failed to parse model response');
    }
  } catch (error) {
    console.error('Error calling GitHub model:', error.message, error);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText);
      console.error('Error details:', error.response.data, error);
    } else {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

module.exports = { callModel };