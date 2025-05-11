/**
 * Task Cycler - Alternates between work and break sessions
 * Uses a persistent state file to track the current mode
 * Pulls work tasks from GitHub issues
 * Cycles through break suggestions from a local list
 */

const { toggleSessionMode, readState } = require('./state-manager');
const { getNextBreakSuggestion } = require('./break-manager');
const { getAllOpenIssues, getIssuesWithLabel } = require('./github-api');
const config = require('../config');

// Check if we're in test mode (using TEST_REPO environment variable)
const isTestMode = process.env.TEST_REPO === 'true';

/**
 * Selects the next GitHub issue based on priority rules
 * This is adapted from the existing select-next.js logic
 * @returns {Promise<Object>} The selected issue
 */
async function selectNextIssue() {
  // Get all open issues
  let issues = await getAllOpenIssues();
  
  if (!issues.length) {
    return null;
  }

  // Filter by urgent label if available
  const urgentIssues = getIssuesWithLabel(issues, 'urgent');
  if (urgentIssues.length) {
    issues = urgentIssues;
  }
  
  // Further filter by important label if available
  const importantIssues = getIssuesWithLabel(issues, 'important');
  if (importantIssues.length) {
    issues = importantIssues;
  }
  
  // Select the issue with the oldest update date
  return issues.sort((a, b) => 
    new Date(a.updated_at) - new Date(b.updated_at)
  )[0];
}

/**
 * Handles a work session, transitioning to a break
 * @returns {Promise<void>}
 */
async function handleWorkSession() {
  console.log("Work session complete. Time for a break!");
  
  // Get the next break suggestion
  const breakSuggestion = await getNextBreakSuggestion();
  console.log(`Try this break activity: ${breakSuggestion}`);
}

/**
 * Handles a break session, transitioning to work
 * @returns {Promise<void>}
 */
async function handleBreakSession() {
  console.log("Break over. Time to work!");
  
  // Get the next work task
  const issue = await selectNextIssue();
  
  if (!issue) {
    console.log("No open issues available. Enjoy some free time!");
    return;
  }
  
  console.log(`Your next task: ${issue.title} — ${issue.html_url}`);
}

/**
 * Main function that runs the task cycler
 * @returns {Promise<void>}
 */
async function runTaskCycler() {
  try {
    // Toggle the session mode
    const updatedState = await toggleSessionMode();
    
    // Handle the appropriate session based on the new mode
    if (updatedState.mode === 'work') {
      await handleBreakSession(); // Coming from break, going to work
    } else {
      await handleWorkSession(); // Coming from work, going to break
    }
  } catch (error) {
    console.error("Error in task cycler:", error.message);
  }
}

// Run the task cycler if this file is executed directly
if (require.main === module) {
  runTaskCycler();
}

module.exports = {
  runTaskCycler,
  handleWorkSession,
  handleBreakSession,
  selectNextIssue
};
