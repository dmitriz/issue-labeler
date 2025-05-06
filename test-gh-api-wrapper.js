const { fetchIssues, addLabelsToIssue, commentOnIssue } = require('./scripts/github-api');
const { token, owner, repo } = require('./.secrets/github');

// Set up process error handling
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

(async () => {
  console.log('===== TEST SCRIPT STARTED =====');
  try {
    // Log configuration to verify it's loaded correctly
    console.log('Config check:', { 
      owner: owner || 'missing', 
      repo: repo || 'missing',
      tokenLength: token ? token.length : 'missing'
    });
    
    console.log('Fetching issues...');
    const issues = await fetchIssues({});
    console.log('Open issues:', issues.map(i => `#${i.number}: ${i.title}`));

    const targetIssue = issues[0];
    if (!targetIssue) {
      console.log('No issues found.');
      return;
    }

    console.log(`Adding label to issue #${targetIssue.number}...`);
    await addLabelsToIssue({ issue_number: targetIssue.number, labels: ['test-label'] });
    
    console.log(`Adding comment to issue #${targetIssue.number}...`);
    await commentOnIssue({ issue_number: targetIssue.number, body: 'Label added via API test ✅' });

    console.log('Label and comment added.');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
  } finally {
    console.log('===== TEST SCRIPT COMPLETED =====');
  }
})();