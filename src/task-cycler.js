const fs = require('fs');
const path = require('path');
/**
 * Gets GitHub issues using the github-client module
 * @module task-cycler
 * @requires ./github-client
 */
const { getIssues } = require('./github-client');

/**
 * Task Cycler - Manages work-break cycles to maintain productivity
 * Enforces regular breaks and structured work sessions by:
 * - Using a persistent state file to track session modes
 * - Prioritizing work from GitHub issues
 * - Suggesting varied break activities
 * 
 * Uses a persistent state file to track the current mode
 * Pulls work tasks from GitHub issues
 * Cycles through break suggestions from a local list
 */
  // Configuration
  const STATE_FILE = path.join(__dirname, '../.task-state.json');
  const WORK_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds
  const BREAK_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const isTestMode = process.env.TEST_REPO === 'true';

  // Break activities to suggest
  const breakActivities = [
    'Take a short walk',
    'Do some stretching',
    'Practice deep breathing',
    'Get some water',
    'Rest your eyes',
    'Tidy up your workspace'
  ];

  // Priority configuration for issue selection
  const PRIORITY_RULES = [
    { label: 'urgent', weight: 100 },
    { label: 'important', weight: 50 },
    { label: 'bug', weight: 40 },
    { label: 'enhancement', weight: 30 },
    { label: 'documentation', weight: 20 }
  ];

  /**
   * Get the current state from the state file or create default
   * @returns {Object} The current state
   */
  function getState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch (error) {
      console.warn('Error reading state file:', error.message);
    }
    
    return {
      mode: 'work', // 'work' or 'break'
      currentIssueNumber: null,
      lastBreakActivity: -1,
      startTime: Date.now()
    };
  }

  /**
   * Save the current state to the state file
   * @param {Object} state The state to save
   */
  function saveState(state) {
    if (!isTestMode) {
      try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      } catch (error) {
        console.error('Error saving state:', error.message);
      }
    } else {
      console.log('Test mode: State would be saved as:', state);
    }
  }

  /**
   * Handle a work session
   * @returns {Object} Information about the current work session
   */
  async function handleWorkSession() {
    const state = getState();
    state.mode = 'work';
    state.startTime = Date.now();
    
    // Get the next issue to work on if none is selected
    if (!state.currentIssueNumber) {
      const nextIssue = await selectNextIssue();
      state.currentIssueNumber = nextIssue ? nextIssue.number : null;
    }
    
    saveState(state);
    
    try {
      // Get next issue information
      const issueDetails = state.currentIssueNumber ? 
      await selectNextIssue() : null;
      
      return {
      mode: 'work',
      timeRemaining: WORK_DURATION,
      currentIssue: state.currentIssueNumber,
      issueDetails: issueDetails
      };
    } catch (error) {
      console.error('Error in work session:', error.message);
      console.error(error.stack);
      
      // Attempt to recover by resetting state
      try {
      const freshState = getState();
      console.log('Current system state:', freshState);
      return {
        mode: 'work',
        timeRemaining: WORK_DURATION,
        currentIssue: null,
        error: true,
        recoveryAttempted: true
      };
      } catch (stateError) {
      console.error('System state cannot be determined:', stateError.message);
      throw new Error('Critical failure in task cycle management');
      }
    }
  }

  /**
   * Handle a break session
   * @returns {Object} Information about the break session
   */
  function handleBreakSession() {
    const state = getState();
    state.mode = 'break';
    state.startTime = Date.now();
    
    // Select next break activity
    state.lastBreakActivity = (state.lastBreakActivity + 1) % breakActivities.length;
    const activity = breakActivities[state.lastBreakActivity];
    
    saveState(state);
    
    return {
      mode: 'break',
      timeRemaining: BREAK_DURATION,
      suggestion: activity
    };
  }

  /**
   * Select the next issue to work on
   * @returns {Object|null} The next issue or null if no issues
   */
  async function selectNextIssue() {
    try {
      if (isTestMode) {
        console.log('Test mode: Would fetch issues from GitHub');
        return { number: 123, title: 'Test issue' };
      }
      
      const issues = await getIssues();
      if (issues && issues.length > 0) {
        // Simple algorithm: just take the first open issue
        return issues[0];
      }
      return null;
    } catch (error) {
      console.error('Error selecting next issue:', error.message);
      return null;
    }
  }

  module.exports = {
    handleWorkSession,
    handleBreakSession,
    selectNextIssue
};
