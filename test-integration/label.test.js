const { addLabelsToIssue } = require('../src/github-api');

console.log('==== LABEL TEST STARTED ====');

// Check for GitHub credentials first
try {
  require('../.secrets/github');
} catch (error) {
  console.log('Skipping test: GitHub credentials not found. Create .secrets/github.js to run this test.');
  process.exit(0); // Exit gracefully
}

// Make the async function and call it immediately
(async function() {
  try {
    // Use command-line arguments or environment variables for flexibility
    const issue_number = parseInt(process.env.TEST_ISSUE_NUMBER || process.argv[2] || 2);
    console.log(`Attempting to add label to issue #${issue_number}...`);

    const result = await addLabelsToIssue({
      issue_number,
      labels: [process.env.TEST_LABEL || process.argv[3] || 'test-label']
    });
    
    console.log('Success! Label added:', result);
    console.log('==== TEST COMPLETED SUCCESSFULLY ====');
  } catch (error) {
    console.error('==== TEST FAILED ====');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
})();