/**
 * End-to-end test for select-next workflow
 * Tests the issue selection logic with oldest updated issue prioritization
 */
const assert = require('assert');
const api = require('../src/github-api');

describe('Select Next Issue E2E', function() {
  // Increase timeout for E2E tests
  this.timeout(10000);
  
  // Store original functions
  let originalGetAllOpenIssues;
  let originalGetIssuesWithLabel;
  
  // Mock data for testing
  const mockIssues = [
    {
      number: 101,
      title: 'Oldest updated issue',
      html_url: 'https://github.com/example/repo/issues/101',
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2023-05-01T10:00:00Z', // Oldest update date
      labels: []
    },
    {
      number: 102,
      title: 'Important issue',
      html_url: 'https://github.com/example/repo/issues/102',
      created_at: '2023-02-01T10:00:00Z',
      updated_at: '2023-07-01T10:00:00Z',
      labels: [{ name: 'important' }]
    },
    {
      number: 103,
      title: 'Urgent issue',
      html_url: 'https://github.com/example/repo/issues/103',
      created_at: '2023-03-01T10:00:00Z',
      updated_at: '2023-06-01T10:00:00Z',
      labels: [{ name: 'urgent' }]
    },
    {
      number: 104,
      title: 'Most recently updated issue',
      html_url: 'https://github.com/example/repo/issues/104',
      created_at: '2023-04-01T10:00:00Z',
      updated_at: '2023-08-01T10:00:00Z', // Most recent update date
      labels: []
    }
  ];
  
  // Capture and restore original functions
  before(function() {
    // Save original functions
    originalGetAllOpenIssues = api.getAllOpenIssues;
    originalGetIssuesWithLabel = api.getIssuesWithLabel;
    
    // Mock console.log for assertions
    this.consoleOutput = [];
    this.originalConsoleLog = console.log;
    console.log = (...args) => {
      this.consoleOutput.push(args.join(' '));
      this.originalConsoleLog(...args);
    };
  });
  
  after(function() {
    // Restore original functions
    api.getAllOpenIssues = originalGetAllOpenIssues;
    api.getIssuesWithLabel = originalGetIssuesWithLabel;
    
    // Restore console.log
    console.log = this.originalConsoleLog;
  });
  
  beforeEach(function() {
    // Reset mock output before each test
    this.consoleOutput = [];
  });

  it('should select the oldest updated issue when no priority labels are present', async function() {
    // Skip this test in CI environments
    if (process.env.CI) {
      this.skip();
      return;
    }
    
    // Setup mocks
    api.getAllOpenIssues = async () => [mockIssues[0], mockIssues[3]]; // Oldest and most recent issues
    api.getIssuesWithLabel = (issues, label) => []; // No labeled issues
    
    // Execute the select-next module
    try {
      // Clear cache to ensure fresh module loading
      delete require.cache[require.resolve('../src/select-next')];
      
      // Execute the module
      await require('../src/select-next');
      
      // Assert the output shows the oldest updated issue was selected
      const selectedIssueOutput = this.consoleOutput.join('\n');
      assert(selectedIssueOutput.includes('Selected issue (oldest updated):'), 
        'Output should indicate selecting the oldest updated issue');
      assert(selectedIssueOutput.includes('#101: Oldest updated issue'), 
        'Output should show the oldest updated issue (#101)');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });

  it('should prioritize urgent issues and select the oldest urgent issue', async function() {
    // Skip this test in CI environments
    if (process.env.CI) {
      this.skip();
      return;
    }
    
    // Setup mocks - include an urgent issue
    api.getAllOpenIssues = async () => [mockIssues[0], mockIssues[2], mockIssues[3]]; // Oldest, urgent, and recent
    
    // Original getIssuesWithLabel implementation
    const originalGetIssuesWithLabel = api.getIssuesWithLabel;
    
    // Mock getIssuesWithLabel to return urgent issues when asked for 'urgent'
    api.getIssuesWithLabel = (issues, label) => {
      if (label === 'urgent') {
        return issues.filter(issue => 
          issue.labels && issue.labels.some(l => l.name === 'urgent')
        );
      }
      return [];
    };
    
    try {
      // Clear cache to ensure fresh module loading
      delete require.cache[require.resolve('../src/select-next')];
      
      // Execute the module
      await require('../src/select-next');
      
      // Assert the output shows the oldest updated urgent issue was selected
      const selectedIssueOutput = this.consoleOutput.join('\n');
      assert(selectedIssueOutput.includes('Selected issue (oldest updated):'), 
        'Output should indicate selecting the oldest updated issue');
      assert(selectedIssueOutput.includes('#103: Urgent issue'), 
        'Output should show the urgent issue (#103)');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });

  it('should prioritize important issues when no urgent issues are found', async function() {
    // Skip this test in CI environments
    if (process.env.CI) {
      this.skip();
      return;
    }
    
    // Setup mocks - include an important issue but no urgent issues
    api.getAllOpenIssues = async () => [mockIssues[0], mockIssues[1], mockIssues[3]]; // Oldest, important, and recent
    
    // Mock getIssuesWithLabel to handle both urgent and important filtering
    api.getIssuesWithLabel = (issues, label) => {
      if (label === 'urgent') {
        return []; // No urgent issues
      } else if (label === 'important') {
        return issues.filter(issue => 
          issue.labels && issue.labels.some(l => l.name === 'important')
        );
      }
      return [];
    };
    
    try {
      // Clear cache to ensure fresh module loading
      delete require.cache[require.resolve('../src/select-next')];
      
      // Execute the module
      await require('../src/select-next');
      
      // Assert the output shows the oldest updated important issue was selected
      const selectedIssueOutput = this.consoleOutput.join('\n');
      assert(selectedIssueOutput.includes('Selected issue (oldest updated):'), 
        'Output should indicate selecting the oldest updated issue');
      assert(selectedIssueOutput.includes('#102: Important issue'), 
        'Output should show the important issue (#102)');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});
