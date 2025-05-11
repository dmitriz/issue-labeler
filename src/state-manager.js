const fs = require('fs').promises;
const path = require('path');

// Define the path to the state file
const STATE_FILE_PATH = path.join(__dirname, '..', 'session-state.json');

// Default state if no state file exists
const DEFAULT_STATE = {
  mode: 'break', // Start in break mode so first run gives a work task
  lastBreakIndex: -1 // Start at -1 so first break is index 0
};

/**
 * Reads the current session state from file
 * Creates a default state file if none exists
 * @returns {Promise<Object>} The current state
 */
async function readState() {
  try {
    const fileContent = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If file doesn't exist or has invalid JSON, create a default state
    await writeState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }
}

/**
 * Writes the current state to the state file
 * @param {Object} state The state to write
 * @returns {Promise<void>}
 */
async function writeState(state) {
  try {
    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`State updated successfully: ${JSON.stringify(state)}`);
  } catch (error) {
    console.error('Error writing state file:', error.message);
    throw error;
  }
}

/**
 * Toggles the session state between work and break
 * @returns {Promise<Object>} The updated state
 */
async function toggleSessionMode() {
  const state = await readState();
  
  // Toggle the mode
  state.mode = state.mode === 'work' ? 'break' : 'work';
  
  // Write the updated state back to the file
  await writeState(state);
  
  return state;
}

/**
 * Updates the last break index in the state
 * @param {number} index The new index
 * @returns {Promise<Object>} The updated state
 */
async function updateBreakIndex(index) {
  const state = await readState();
  state.lastBreakIndex = index;
  await writeState(state);
  return state;
}

module.exports = {
  readState,
  writeState,
  toggleSessionMode,
  updateBreakIndex
};
