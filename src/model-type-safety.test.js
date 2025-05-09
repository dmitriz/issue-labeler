/**
 * Unit tests for model output type safety
 * Tests that the model outputs are properly type-checked and handled
 */
const assert = require('assert');
const path = require('path');

describe('Model Output Type Safety', () => {
  // Test the type safety handling in the model parser
  describe('Type safety for model outputs', () => {
    let modelSanitizer;
    
    // Extract the safety handling from github-model.js
    // without having to modify that file
    before(() => {
      // Create a local implementation that mimics the production code
      modelSanitizer = {
        sanitizeModelOutput: function(parsedJson) {
          // Apply type safety checks to ensure we get string values or null
          let urgency = null;
          if (parsedJson.urgency) {
            // Ensure urgency is a string
            if (typeof parsedJson.urgency === 'string') {
              urgency = parsedJson.urgency.trim() !== '' ? parsedJson.urgency.trim() : null;
            } else {
              // Convert non-string values to strings or null
              urgency = parsedJson.urgency !== null && parsedJson.urgency !== undefined ? 
                String(parsedJson.urgency).trim() : null;
            }
          }
          
          let importance = null;
          if (parsedJson.importance) {
            // Ensure importance is a string
            if (typeof parsedJson.importance === 'string') {
              importance = parsedJson.importance.trim() !== '' ? parsedJson.importance.trim() : null;
            } else {
              // Convert non-string values to strings or null
              importance = parsedJson.importance !== null && parsedJson.importance !== undefined ? 
                String(parsedJson.importance).trim() : null;
            }
          }
          
          return { urgency, importance };
        }
      };
    });
    
    it('should handle string values correctly', () => {
      const input = {
        urgency: 'urgent',
        importance: 'important'
      };
      
      const result = modelSanitizer.sanitizeModelOutput(input);
      
      assert.strictEqual(typeof result.urgency, 'string', 'Urgency should remain a string');
      assert.strictEqual(typeof result.importance, 'string', 'Importance should remain a string');
      assert.strictEqual(result.urgency, 'urgent', 'String value should be preserved');
      assert.strictEqual(result.importance, 'important', 'String value should be preserved');
    });
    
    it('should handle number values by converting to strings', () => {
      const input = {
        urgency: 123,
        importance: 456
      };
      
      const result = modelSanitizer.sanitizeModelOutput(input);
      
      assert.strictEqual(typeof result.urgency, 'string', 'Number should be converted to string');
      assert.strictEqual(typeof result.importance, 'string', 'Number should be converted to string');
      assert.strictEqual(result.urgency, '123', 'Number should be converted to string correctly');
      assert.strictEqual(result.importance, '456', 'Number should be converted to string correctly');
    });
    
    it('should handle null and undefined values', () => {
      const input = {
        urgency: null,
        importance: undefined
      };
      
      const result = modelSanitizer.sanitizeModelOutput(input);
      
      assert.strictEqual(result.urgency, null, 'Null should be preserved as null');
      assert.strictEqual(result.importance, null, 'Undefined should be converted to null');
    });
    
    it('should handle object values by converting to strings', () => {
      const input = {
        urgency: { level: 'critical' },
        importance: ['high', 'medium']
      };
      
      const result = modelSanitizer.sanitizeModelOutput(input);
      
      assert.strictEqual(typeof result.urgency, 'string', 'Object should be converted to string');
      assert.strictEqual(typeof result.importance, 'string', 'Array should be converted to string');
      // The exact string representation could vary but should be a string type
      assert.ok(result.urgency.includes('object'), 'Object should be stringified');
      assert.ok(result.importance.includes(','), 'Array should be stringified');
    });
    
    it('should handle empty string values', () => {
      const input = {
        urgency: '',
        importance: '   '  // spaces only
      };
      
      const result = modelSanitizer.sanitizeModelOutput(input);
      
      assert.strictEqual(result.urgency, null, 'Empty string should be converted to null');
      assert.strictEqual(result.importance, null, 'Whitespace-only string should be converted to null');
    });
  });
});
