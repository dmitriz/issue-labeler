const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STATE_FILE_PATH = path.join(__dirname, '..', 'session-state.json');
const BACKUP_STATE_PATH = path.join(__dirname, '..', 'session-state.backup.json');

// These tests will run the actual task-cycler script in test mode
describe('Task Cycler E2E', function() {
  // Preserve any existing state file
  before(function() {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        fs.copyFileSync(STATE_FILE_PATH, BACKUP_STATE_PATH);
      }
    } catch (error) {
      console.error('Error backing up state file:', error);
      this.skip(); // Skip tests if setup fails
    }
  });
  
  // Restore the original state file
  after(function() {
    try {
      // Remove the test state file
      if (fs.existsSync(STATE_FILE_PATH)) {
        fs.unlinkSync(STATE_FILE_PATH);
      }
      
      // Restore the backup if it exists
      if (fs.existsSync(BACKUP_STATE_PATH)) {
        fs.copyFileSync(BACKUP_STATE_PATH, STATE_FILE_PATH);
        fs.unlinkSync(BACKUP_STATE_PATH);
      }
    } catch (error) {
      console.error('Error restoring state file:', error);
    }
  });
  
  beforeEach(function() {
    // Remove any existing state file before each test
    if (fs.existsSync(STATE_FILE_PATH)) {
      fs.unlinkSync(STATE_FILE_PATH);
    }
  });
  
  it('should start in break mode if no state file exists', function() {
    // Expect the first run to switch to work mode
    const output = execSync('npm run test-mode', { encoding: 'utf8' });
    
    assert(output.includes('Break over. Time to work!'), 'Should show work message');
    assert(fs.existsSync(STATE_FILE_PATH), 'Should create a state file');
    
    const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
    assert.strictEqual(state.mode, 'work', 'Should set state to work');
  });
  
  it('should toggle from work to break mode', function() {
    // Create a state file in work mode
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify({ mode: 'work', lastBreakIndex: -1 }));
    
    // Run the task cycler
    const output = execSync('npm run test-mode', { encoding: 'utf8' });
    
    assert(output.includes('Work session complete. Time for a break!'), 'Should show break message');
    assert(output.includes('Try this break activity:'), 'Should show a break suggestion');
    
    const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
    assert.strictEqual(state.mode, 'break', 'Should set state to break');
    assert(state.lastBreakIndex >= 0, 'Should update the break index');
  });
  
  it('should toggle from break to work mode', function() {
    // Create a state file in break mode
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify({ mode: 'break', lastBreakIndex: 0 }));
    
    // Run the task cycler
    const output = execSync('npm run test-mode', { encoding: 'utf8' });
    
    assert(output.includes('Break over. Time to work!'), 'Should show work message');
    assert(output.includes('Your next task:') || output.includes('No open issues'), 'Should show task info or no issues message');
    
    const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
    assert.strictEqual(state.mode, 'work', 'Should set state to work');
  });
  
  it('should cycle through break suggestions', function() {
    // Use test-specific break suggestions to ensure consistent test data
    const breakSuggestions = require('./test-break-suggestions');
    
    // Ensure we have enough test suggestions
    if (breakSuggestions.length <= 1) {
      console.log('Not enough test break suggestions available');
      this.fail('Test break suggestions file must contain at least 2 suggestions');
      return;
    }
    
    // Get the total number of break suggestions
    const totalSuggestions = breakSuggestions.length;
    
    // Create a state file in work mode with lastBreakIndex at the end
    // This ensures we'll wrap around to the first suggestion
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify({ 
      mode: 'work', 
      lastBreakIndex: totalSuggestions - 1 
    }));
    
    // Run the task cycler once - this should get the first suggestion after wraparound
    const output1 = execSync('npm run test-mode', { encoding: 'utf8' });
    assert(output1.includes('Try this break activity:'), 'Should show a break suggestion');
    
    // Get the first break suggestion
    const breakSuggestion1 = output1.split('Try this break activity: ')[1].split('\n')[0];
    
    // Verify we got the expected suggestion from the array
    assert.strictEqual(breakSuggestion1, breakSuggestions[0], 
      'Should show the first break suggestion after wrapping around');
    
    // Set back to work mode and use the first index
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify({ mode: 'work', lastBreakIndex: 0 }));
    
    // Run again
    const output2 = execSync('npm run test-mode', { encoding: 'utf8' });
    
    // Get the second break suggestion
    const breakSuggestion2 = output2.split('Try this break activity: ')[1].split('\n')[0];
    
    // Verify we got the expected second suggestion
    assert.strictEqual(breakSuggestion2, breakSuggestions[1],
      'Should show the second break suggestion');
    
    // Verify the suggestions are different
    assert.notStrictEqual(breakSuggestion1, breakSuggestion2, 
      'Should show different break suggestions');
  });
});
