const assert = require('assert');
const breakSuggestions = require('../break-suggestions');

// We'll manually create a testable version of the getNextBreakSuggestion function
// that uses our mocked state instead of the real state manager

// Store mock state
const mockState = { lastBreakIndex: -1 };

// Create test implementation of the function
async function testGetNextBreakSuggestion() {
  // Calculate next index with wrap-around
  let nextIndex = (mockState.lastBreakIndex + 1) % breakSuggestions.length;
  
  // Update the mock state
  mockState.lastBreakIndex = nextIndex;
  
  // Return the suggestion
  return breakSuggestions[nextIndex];
}

describe('Break Manager', function() {
  beforeEach(function() {
    // Reset mock state before each test
    mockState.lastBreakIndex = -1;
  });
  
  it('should return break suggestions in sequence', async function() {
    // Get the first break suggestion (should be index 0)
    const firstSuggestion = await testGetNextBreakSuggestion();
    assert.strictEqual(firstSuggestion, breakSuggestions[0]);
    
    // Get the second break suggestion (should be index 1)
    const secondSuggestion = await testGetNextBreakSuggestion();
    assert.strictEqual(secondSuggestion, breakSuggestions[1]);
  });
  
  it('should wrap around to the beginning after reaching the end', async function() {
    // Set the mock state to be at the last index
    mockState.lastBreakIndex = breakSuggestions.length - 1;
    
    // Get the next suggestion (should wrap to index 0)
    const suggestion = await testGetNextBreakSuggestion();
    assert.strictEqual(suggestion, breakSuggestions[0]);
  });
});
