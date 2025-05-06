/**
 * Example usage of the GitHub Issues API wrapper
 */

const githubIssues = require('./utils/github-issues');

async function main() {
  // Configuration for the target repository
  const owner = 'dmitriz';
  const repo = 'issue-labeler';

  try {
    console.log('Fetching open issues...');
    const issues = await githubIssues.listIssues({
      owner,
      repo,
      state: 'open'
    });
    
    console.log(`Found ${issues.length} open issues`);
    
    // If we have issues, show details of the first one
    if (issues.length > 0) {
      const firstIssue = issues[0];
      console.log('\nFirst issue details:');
      console.log(`#${firstIssue.number || 'unknown'}: ${firstIssue.title || 'No title'}`);
      console.log(`Labels: ${firstIssue.labels ? firstIssue.labels.map(l => l.name || 'unknown').join(', ') : 'None'}`);
      console.log(`Created by: ${firstIssue.user?.login || 'unknown user'}`);
      // Fetch comments for this issue
      console.log('\nFetching comments for this issue...');
      const comments = await githubIssues.listComments({
        owner,
        repo,
        issue_number: firstIssue.number
      });
      
      console.log(`This issue has ${comments.length} comments`);
    }
    
    // Example of creating a new issue (commented out to prevent accidental creation)
    /*
    console.log('\nCreating a new issue...');
    const newIssue = await githubIssues.createIssue({
      owner,
      repo,
      title: 'Test issue from GitHub Issues API wrapper',
      body: 'This is a test issue created using our new GitHub Issues wrapper.',
      labels: ['test']
    });
    
    console.log(`Created issue #${newIssue.number}: ${newIssue.title}`);
    
    // Add a comment to the new issue
    console.log('\nAdding a comment to the new issue...');
    await githubIssues.commentOnIssue({
      owner,
      repo,
      issue_number: newIssue.number,
      body: 'This is a test comment added using our GitHub Issues wrapper.'
    });
    
    console.log('Comment added successfully');
    */

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();