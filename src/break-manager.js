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
  let nextIndex = (state.lastBreakIndex + 1) % breakSuggestions.length;
  
  // Update the state with the new index
  await updateBreakIndex(nextIndex);
  
  // Return the selected break suggestion
  return breakSuggestions[nextIndex];
}

module.exports = {
  getNextBreakSuggestion
};
