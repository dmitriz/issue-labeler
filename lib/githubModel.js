const axios = require("axios");
const { token } = require("../.secrets/github-token");
const config = require("../config/github-model");

const MARKDOWN_CODE_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)\s*```/;

async function callGithubModel({ prompt }) {
  try {
    const response = await axios({
      method: "POST",
      url: "https://models.github.ai/inference/chat/completions",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        messages: [
          { role: "user", content: prompt }
        ],
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens
      }
    });

    // Get the raw content from the model
    const rawContent = response.data.choices[0].message.content.trim();
    
    // Clean the response if it's wrapped in markdown code blocks
    let cleanedContent = rawContent;
    if (rawContent.startsWith('```') && rawContent.endsWith('```')) {
      // Remove markdown code block formatting
      const match = rawContent.match(MARKDOWN_CODE_BLOCK_REGEX);
      if (match && match[1]) {
        cleanedContent = match[1].trim();
      }
    }
    
    return cleanedContent;
  } catch (error) {
    console.error("GitHub Models API Error:", error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : error.message);
    
    throw new Error(`GitHub Models API request failed: ${
      error.response?.data?.error?.message || error.response?.data?.message || error.message
    }`);
  }
}

module.exports = { callGithubModel };