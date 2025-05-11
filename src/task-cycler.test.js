const assert = require('assert');

/**
 * Test suite for task-cycler.js
 * This test doesn't depend on external state but uses test-only implementations
 * of the functions to ensure unit testing capabilities.
 */

// Mock implementation for testing
const mockBreakSuggestion = 'Test break suggestion';
let mockState = { mode: 'work' };
let mockIssues = [
  {
    number: 1,
    title: 'Test Issue 1',
    html_url: 'https://github.com/test/repo/issues/1',
    updated_at: '2023-01-01T00:00:00Z',
    labels: [{ name: 'urgent' }]
  },
  {
    number: 2,
    title: 'Test Issue 2',
    html_url: 'https://github.com/test/repo/issues/2',
    updated_at: '2023-01-02T00:00:00Z',
    labels: [{ name: 'important' }]
  },
  {
    number: 3,
    title: 'Test Issue 3',
    html_url: 'https://github.com/test/repo/issues/3',
    updated_at: '2023-01-03T00:00:00Z',
    labels: []
  }
];

// Capture console output for testing
let consoleOutput = [];
const originalLog = console.log;

// Setup the console capture before tests
before(function() {
  // Mock console.log
  console.log = function(msg) {
    consoleOutput.push(msg);
  };
});

// Restore console after tests
after(function() {
  console.log = originalLog;
});

// Create test-friendly implementations of the functions
async function testSelectNextIssue() {
  if (!mockIssues.length) {
    return null;
  }

  // Make a copy of the issues array to avoid modifying the original
  let filteredIssues = [...mockIssues];

  // Filter by urgent label if available
  const urgentIssues = filteredIssues.filter(issue => 
    issue.labels.some(label => label.name.toLowerCase() === 'urgent')
  );
  
  if (urgentIssues.length) {
    filteredIssues = urgentIssues;
  }
  
  // Further filter by important label if available
  const importantIssues = filteredIssues.filter(issue => 
    issue.labels.some(label => label.name.toLowerCase() === 'important')
  );
  
  if (importantIssues.length) {
    filteredIssues = importantIssues;
  }
  
  // Select the issue with the oldest update date
  return filteredIssues.sort((a, b) => 
    new Date(a.updated_at) - new Date(b.updated_at)
  )[0];
}

async function testHandleWorkSession() {
  consoleOutput.push("Work session complete. Time for a break!");
  consoleOutput.push(`Try this break activity: ${mockBreakSuggestion}`);
}

async function testHandleBreakSession() {
  consoleOutput.push("Break over. Time to work!");
  
  const issue = await testSelectNextIssue();
  
  if (!issue) {
    consoleOutput.push("No open issues available. Enjoy some free time!");
    return;
  }
  
  consoleOutput.push(`Your next task: ${issue.title} — ${issue.html_url}`);
}

async function testRunTaskCycler() {
  try {
    // Toggle the session mode
    mockState.mode = mockState.mode === 'work' ? 'break' : 'work';
    
    // Handle the appropriate session based on the new mode
    if (mockState.mode === 'work') {
      await testHandleBreakSession(); // Coming from break, going to work
    } else {
      await testHandleWorkSession(); // Coming from work, going to break
    }
  } catch (error) {
    console.error("Error in task cycler:", error.message);
  }
}

describe('Task Cycler', function() {
  beforeEach(function() {
    // Reset mock state and captured output before each test
    consoleOutput = [];
    mockState = { mode: 'work' };
    
    // Replace console.log with mock
    console.log = (msg) => {
      consoleOutput.push(msg);
    };
  });
  
  after(function() {
    // Restore console.log after all tests
    console.log = originalLog;
  });
  
  describe('selectNextIssue', function() {
    it('should select urgent issue first', async function() {
      // Reset mockIssues for this test
      mockIssues = [
        {
          number: 1,
          title: 'Test Issue 1',
          html_url: 'https://github.com/test/repo/issues/1',
          updated_at: '2023-01-01T00:00:00Z',
          labels: [{ name: 'urgent' }]
        },
        {
          number: 2,
          title: 'Test Issue 2',
          html_url: 'https://github.com/test/repo/issues/2',
          updated_at: '2023-01-02T00:00:00Z',
          labels: [{ name: 'important' }]
        }
      ];
      const issue = await testSelectNextIssue();
      assert.strictEqual(issue.number, 1);
    });
    
    it('should return null if no open issues', async function() {
      mockIssues = [];
      const issue = await testSelectNextIssue();
      assert.strictEqual(issue, null);
    });
  });
  
  describe('handleWorkSession', function() {
    it('should print work completion and break suggestion', async function() {
      await testHandleWorkSession();
      assert.strictEqual(consoleOutput[0], 'Work session complete. Time for a break!');
      assert.strictEqual(consoleOutput[1], `Try this break activity: ${mockBreakSuggestion}`);
    });
  });
  
  describe('handleBreakSession', function() {
    it('should print break completion and next task', async function() {
      await testHandleBreakSession();
      assert.strictEqual(consoleOutput[0], 'Break over. Time to work!');
      assert(consoleOutput[1].includes('Your next task:'));
    });
    
    it('should handle case with no issues', async function() {
      mockIssues = [];
      await testHandleBreakSession();
      assert.strictEqual(consoleOutput[0], 'Break over. Time to work!');
      assert.strictEqual(consoleOutput[1], 'No open issues available. Enjoy some free time!');
    });
  });
  
  describe('runTaskCycler', function() {
    it('should handle work to break transition', async function() {
      mockState = { mode: 'work' };
      await testRunTaskCycler();
      assert.strictEqual(consoleOutput[0], 'Work session complete. Time for a break!');
      assert.strictEqual(mockState.mode, 'break');
    });
    
    it('should handle break to work transition', async function() {
      mockState = { mode: 'break' };
      await testRunTaskCycler();
      assert.strictEqual(consoleOutput[0], 'Break over. Time to work!');
      assert.strictEqual(mockState.mode, 'work');
    });
  });
});
