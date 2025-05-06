const { fetchIssues, addLabelsToIssue, commentOnIssue } = require('./scripts/github-api');
const { token, owner, repo } = require('./.secrets/github');

// Set up process error handling
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  // Optionally, perform cleanup or retry logic here
  process.exit(1);
});
});

(async () => {
  console.log('===== TEST SCRIPT STARTED =====');
  // For production, remove or use a secure logging approach
  console.log('Config loaded successfully');
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
    // Add a uniquely identifiable test label
    const testLabel = `test-label-${Date.now()}`;
    await addLabelsToIssue({ issue_number: targetIssue.number, labels: [testLabel] });
    
    console.log(`Adding comment to issue #${targetIssue.number}...`);
    await commentOnIssue({ 
      issue_number: targetIssue.number, 
      body: `Label ${testLabel} added via API test ✅ [${new Date().toISOString()}]` 
    });
    
    // TODO: Add cleanup for test labels if GitHub API supports removing labels
    // (would require implementing a removeLabelsFromIssue function in the API wrapper)

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