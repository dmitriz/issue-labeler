/**
 * GitHub Model API wrapper for the issue labeling workflow
 * Provides a function for model inference to determine issue labels
 */
const axios = require('axios');
const { token } = require('../.secrets/gh-model');
const config = require('../config/github-model');
const yaml = require('js-yaml');

/**
 * Call GitHub model to determine issue labels
 * @param {Object} options - Options object
 * @param {string} options.prompt - The formatted prompt to send to the model
 * @returns {Promise<Object>} - Object containing urgency and importance labels
 */
async function callModel({ prompt }) {
  try {
    const https = require('https');
    const axiosInstance = axios.create({
      httpsAgent: new https.Agent({ keepAlive: true }),
      timeout: 10000
    });

    const response = await axiosInstance.post("https://models.github.ai/inference/chat/completions", {
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
    const yamlMatch = rawContent.match(/```(?:yaml)?\s*([\s\S]*?)```/);
    if (yamlMatch && yamlMatch[1]) {
      yamlContent = yamlMatch[1].trim();
    }
    
    // Parse the YAML content to get urgency and importance values
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
    console.error('Error calling GitHub model:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText);
      console.error('Error details:', error.response.data);
    }
    throw error;
  }
}

module.exports = { callModel };