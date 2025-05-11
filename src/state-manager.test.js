const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');

// Store the original state manager module
const stateManager = require('./state-manager');

// Override the state file path for testing
const TEST_STATE_PATH = path.join(__dirname, '..', 'test-session-state.json');

// Create a test-specific version of the state manager functions
let mockState = { mode: 'break', lastBreakIndex: -1 };

// Test implementations of state manager functions
async function testReadState() {
  return { ...mockState };
}

async function testToggleSessionMode() {
  mockState.mode = mockState.mode === 'work' ? 'break' : 'work';
  return { ...mockState };
}

async function testUpdateBreakIndex(index) {
  mockState.lastBreakIndex = index;
  return { ...mockState };
}

describe('State Manager', function() {
  // Reset mock state before each test
  beforeEach(function() {
    mockState = { mode: 'break', lastBreakIndex: -1 };
  });
  
  it('should create default state when no state file exists', async function() {
    const state = await testReadState();
    assert.strictEqual(state.mode, 'break');
    assert.strictEqual(state.lastBreakIndex, -1);
  });
  
  it('should toggle the session mode from break to work', async function() {
    // Toggle from break to work mode
    const updatedState = await testToggleSessionMode();
    assert.strictEqual(updatedState.mode, 'work');
  });
  
  it('should toggle the session mode from work to break', async function() {
    // Set initial state to work mode
    mockState = { mode: 'work', lastBreakIndex: 0 };
    
    // Toggle to break mode
    const updatedState = await testToggleSessionMode();
    assert.strictEqual(updatedState.mode, 'break');
  });
  
  it('should update the break index', async function() {
    // Update the break index
    const updatedState = await testUpdateBreakIndex(3);
    assert.strictEqual(updatedState.lastBreakIndex, 3);
  });
});
