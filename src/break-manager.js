const breakSuggestions = require('../break-suggestions');
const { readState, updateBreakIndex } = require('./state-manager');

/**
 * Gets the next break suggestion in rotation
 * Advances the index and wraps around when reaching the end
 * @returns {Promise<string>} The next break suggestion
 */
async function getNextBreakSuggestion() {
  const state = await readState();
  
  // Calculate the next index (with wrap-around)
  // Ensure we have a valid index to start with
  const currentIndex = typeof state.lastBreakIndex === 'number' ? state.lastBreakIndex : -1;
  
  // Handle empty break suggestions array
  if (breakSuggestions.length === 0) {
    return "No break suggestions available";
  }
  
  let nextIndex = (currentIndex + 1) % breakSuggestions.length;
  
  // Update the state with the new index
  await updateBreakIndex(nextIndex);
  
  // Return the selected break suggestion
  return breakSuggestions[nextIndex];
}

module.exports = {
  getNextBreakSuggestion
};
