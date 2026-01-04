/**
 * GitHub Repository Search Script
 * This script searches GitHub repositories based on keywords and topics
 * Useful for finding repositories related to specific areas like trading, finance, etc.
 */
const { searchRepositories } = require('./github-api');
const configLoader = require('./config-loader');

/**
 * Searches for repositories related to a specific topic or keyword
 * @param {Object} options - Search options
 * @param {string} options.query - The search query
 * @param {string} [options.username] - Optional GitHub username to filter by owner
 * @param {number} [options.limit] - Maximum number of results to display (default: 10)
 * @param {string} [options.sort] - Sort field: 'stars', 'forks', 'updated' (default: 'stars')
 * @returns {Promise<Array>} Array of repository objects
 */
async function searchRepos({ query, username, limit = 10, sort = 'stars' }) {
  if (!query) {
    throw new Error('Search query is required');
  }

  // Build the search query
  let searchQuery = query;
  
  // Add user filter if username is provided
  if (username) {
    searchQuery = `${query} user:${username}`;
  }

  try {
    // Search repositories
    const results = await searchRepositories({
      query: searchQuery,
      sort,
      order: 'desc',
      per_page: Math.min(limit, 100)
    });

    return results.items.slice(0, limit);
  } catch (error) {
    console.error(`Error searching repositories: ${error.message}`);
    throw error;
  }
}

/**
 * Formats and displays repository search results
 * @param {Array} repositories - Array of repository objects
 */
function displayResults(repositories) {
  if (!repositories || repositories.length === 0) {
    console.log('\nNo repositories found matching the search criteria.');
    return;
  }

  console.log(`\nFound ${repositories.length} repositories:\n`);
  console.log('='.repeat(80));

  repositories.forEach((repo, index) => {
    console.log(`\n${index + 1}. ${repo.full_name}`);
    console.log(`   Description: ${repo.description || 'No description'}`);
    console.log(`   URL: ${repo.html_url}`);
    console.log(`   Language: ${repo.language || 'N/A'}`);
    console.log(`   Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count} | Issues: ${repo.open_issues_count}`);
    
    if (repo.topics && repo.topics.length > 0) {
      console.log(`   Topics: ${repo.topics.join(', ')}`);
    }
    
    console.log(`   Last updated: ${new Date(repo.updated_at).toLocaleDateString()}`);
  });

  console.log('\n' + '='.repeat(80));
}

/**
 * Main function to execute repository search
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Default search parameters
  let query = 'trading';
  let username = null;
  let limit = 10;
  let sort = 'stars';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--query' || arg === '-q') {
      query = args[++i];
    } else if (arg === '--user' || arg === '-u') {
      username = args[++i];
    } else if (arg === '--limit' || arg === '-l') {
      limit = parseInt(args[++i], 10);
      if (isNaN(limit) || limit < 1) {
        console.error('Error: --limit must be a positive number');
        process.exit(1);
      }
    } else if (arg === '--sort' || arg === '-s') {
      sort = args[++i];
      if (!['stars', 'forks', 'updated'].includes(sort)) {
        console.error('Error: --sort must be one of: stars, forks, updated');
        process.exit(1);
      }
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node src/search-repos.js [options]

Options:
  -q, --query <text>     Search query (default: "trading")
  -u, --user <username>  Filter by GitHub username
  -l, --limit <number>   Maximum number of results (default: 10)
  -s, --sort <field>     Sort by: stars, forks, updated (default: stars)
  -h, --help            Show this help message

Examples:
  node src/search-repos.js
  node src/search-repos.js --query "trading bot"
  node src/search-repos.js --query trading --user dmitriz
  node src/search-repos.js --query finance --limit 20 --sort forks
      `);
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      // Treat as query if no flag is provided
      query = arg;
    }
  }

  console.log(`Searching for repositories...`);
  console.log(`Query: "${query}"`);
  if (username) {
    console.log(`User: ${username}`);
  }
  console.log(`Limit: ${limit}`);
  console.log(`Sort by: ${sort}`);

  try {
    const repositories = await searchRepos({ query, username, limit, sort });
    displayResults(repositories);
  } catch (error) {
    console.error(`\nFailed to search repositories: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = { searchRepos, displayResults };
