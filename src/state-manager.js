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
    // First check if we have a backup in memory from a previous failed write
    if (global.__stateBackup) {
      console.log('Using in-memory state backup');
      return global.__stateBackup;
    }
    
    const fileContent = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If file doesn't exist or has invalid JSON, create a default state
    const writeSucceeded = await writeState(DEFAULT_STATE);
    if (!writeSucceeded) {
      console.warn('Could not write default state file, using in-memory state');
      global.__stateBackup = DEFAULT_STATE;
    }
    return DEFAULT_STATE;
  }
}
/**
 * Writes the current state to the state file
 * @param {Object} state The state to write
 * @returns {Promise<boolean>} Returns true if write was successful, false otherwise
 */
async function writeState(state) {
  try {
    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`State updated successfully: ${JSON.stringify(state)}`);
    return true;
  } catch (error) {
    console.error('Error writing state file:', error.message);
    if (error.code === 'ENOENT') {
      console.warn('Directory does not exist, attempting to create backup in memory');
      // Store state in memory as fallback
      global.__stateBackup = state;
    } else if (error.code === 'EACCES') {
      console.warn('Permission denied when writing state file');
    } else {
      console.warn(`File system error (${error.code}): ${error.message}`);
    }
    return false;
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
  
  // Write the updated state back to the file (continue even if write fails)
  const writeSucceeded = await writeState(state);
  if (!writeSucceeded) {
    console.warn('Failed to persist state change to disk, continuing with in-memory state');
    // Ensure we have an in-memory backup
    global.__stateBackup = state;
  }
  
  return state;
}

/**
 * Updates the last break index in the state
 * @param {number} index The new index
 * @returns {Promise<Object>} The updated state
 */
async function updateBreakIndex(index) {
  if (typeof index !== 'number' || index < -1) {
    throw new Error('Invalid break index value');
  }
  
  const state = await readState();
  state.lastBreakIndex = index;
  
  // Write state but continue even if writing fails
  const writeSucceeded = await writeState(state);
  if (!writeSucceeded) {
    console.warn('Failed to persist break index to disk, continuing with in-memory state');
    // Ensure we have an in-memory backup
    global.__stateBackup = state;
  }
  
  return state;
}

module.exports = {
  readState,
  writeState,
  toggleSessionMode,
  updateBreakIndex
};
