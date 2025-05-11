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
    // Create a state file in work mode with lastBreakIndex 0
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify({ mode: 'work', lastBreakIndex: 0 }));
    
    // Run the task cycler once
    const output1 = execSync('npm run test-mode', { encoding: 'utf8' });
    assert(output1.includes('Try this break activity:'), 'Should show a break suggestion');
    
    // Get the first break suggestion
    const breakSuggestion1 = output1.split('Try this break activity: ')[1].split('\n')[0];
    
    // Set back to work mode
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify({ mode: 'work', lastBreakIndex: 1 }));
    
    // Run again
    const output2 = execSync('npm run test-mode', { encoding: 'utf8' });
    
    // Get the second break suggestion
    const breakSuggestion2 = output2.split('Try this break activity: ')[1].split('\n')[0];
    
    assert.notStrictEqual(breakSuggestion1, breakSuggestion2, 'Should show different break suggestions');
  });
});
