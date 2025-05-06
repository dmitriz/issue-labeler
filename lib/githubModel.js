const axios = require("axios");
const { token } = require("../.secrets/github-token");
const config = require("../config/github-model");

// Regex for cleaning markdown code blocks
const MARKDOWN_CODE_BLOCK_REGEX = /```(?:\w+)?\s*([\s\S]*?)```/;

async function callGithubModel({ prompt }) {
  try {
    const https = require("https");
    // Create a persistent axios instance with keep-alive and a timeout of 5000ms
    const axiosInstance = axios.create({
      httpsAgent: new https.Agent({ keepAlive: true }),
      timeout: 5000
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

    // Validate that the API response has the expected structure
    if (!response.data.choices || !response.data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from GitHub model API');
    }

    const rawContent = response.data.choices[0].message.content.trim();

    // Clean the response if it's wrapped in markdown code blocks
    let cleanedContent = rawContent;
    if (rawContent.startsWith('```') && rawContent.endsWith('```')) {
      const match = rawContent.match(MARKDOWN_CODE_BLOCK_REGEX);
      if (match && match[1]) {
        cleanedContent = match[1].trim();
      }
    }
    
    return cleanedContent;
  } catch (error) {
    // Check for rate limiting
    if (error.response?.status === 429) {
      console.warn("Rate limit exceeded. Implementing exponential backoff retry.");
      // Get retry-after header if available or default to 1 second
      const retryAfter = parseInt(error.response.headers?.['retry-after']) || 1;
      console.log(`Retrying after ${retryAfter} seconds`);
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    }

    // Create detailed error message
    const errorDetails = error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : { message: error.message };

    console.error("Full error object:", error); // Log the full error object for debugging
    throw new Error(`GitHub Models API request failed: ${error.message}. Full error: ${JSON.stringify(errorDetails)}`);
  }
}

module.exports = { callGithubModel };