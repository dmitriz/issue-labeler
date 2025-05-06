const { addLabelsToIssue } = require('./scripts/github-api');

console.log('==== LABEL TEST STARTED ====');

// Make the async function and call it immediately
(async function() {
  try {
    const issue_number = 2; // The "Configure Renovate" issue we found
    console.log(`Attempting to add label to issue #${issue_number}...`);
    
    const result = await addLabelsToIssue({ 
      issue_number, 
      labels: ['test-label'] 
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