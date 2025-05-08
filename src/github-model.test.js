/**
 * Unit tests for github-model.js
 * Tests the model inference functionality in isolation
 */
const assert = require('assert');
const { callModel } = require('./github-model');

describe('GitHub Model', () => {
  describe('callModel', () => {
    it('should call the model with the correct prompt', async function() {
      // Mock dependencies or use test doubles
      // Test that callModel formats the prompt correctly and processes the response
      // E.g., using sinon to stub API calls
    });
  });

  describe('parseModelResponse', () => {
    // Expose the internal parseModelResponse function for testing
    const parseModelResponse = require('./github-model').__test__.parseModelResponse;
    
    it('should parse a valid JSON response', function() {
      // Skip test if parseModelResponse is not exposed for testing
      if (!parseModelResponse) this.skip();
      
      const rawResponse = '{"urgency": "urgent", "importance": "important"}';
      const result = parseModelResponse(rawResponse);
      
      assert.deepStrictEqual(result, {
        urgency: "urgent",
        importance: "important"
      });
    });

    it('should parse JSON from markdown code blocks', function() {
      // Skip test if parseModelResponse is not exposed for testing
      if (!parseModelResponse) this.skip();
      
      const rawResponse = '```json\n{"urgency": "not_urgent", "importance": "important"}\n```';
      const result = parseModelResponse(rawResponse);
      
      assert.deepStrictEqual(result, {
        urgency: "not_urgent",
        importance: "important"
      });
    });
  });
});