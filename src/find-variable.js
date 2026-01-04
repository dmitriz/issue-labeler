#!/usr/bin/env node
/**
 * Utility to find variable, function, or property declarations in the codebase
 * Usage: node src/find-variable.js <variable-name>
 */

const fs = require('fs');
const path = require('path');

/**
 * Escapes special regex characters in a string
 * @param {string} string - The string to escape
 * @returns {string} The escaped string safe for use in regex
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Search for a specific variable name in JavaScript files
 * @param {string} varName - The variable name to search for
 * @param {string} searchDir - The directory to search in
 * @returns {Array} Array of objects with file path and line information
 */
function findVariable(varName, searchDir = '.') {
  const results = [];
  const jsFiles = findJavaScriptFiles(searchDir);
  
  // Escape special regex characters in the variable name
  const escapedVarName = escapeRegex(varName);
  
  // Create regex patterns to match various declaration types
  const patterns = [
    new RegExp(`^\\s*(const|let|var)\\s+${escapedVarName}\\s*[=;]`, 'm'),  // Variable declarations
    new RegExp(`^\\s*function\\s+${escapedVarName}\\s*\\(`, 'm'),          // Function declarations
    new RegExp(`\\b${escapedVarName}\\s*:\\s*`, 'm'),                       // Object property
    new RegExp(`^\\s*class\\s+${escapedVarName}\\s*`, 'm'),                 // Class declarations
  ];
  
  for (const filePath of jsFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim(),
              type: getDeclarationType(line)
            });
            break;
          }
        }
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Determine the type of declaration from the line content
 * @param {string} line - The line of code
 * @returns {string} The type of declaration
 */
function getDeclarationType(line) {
  if (line.match(/^\s*(const|let|var)/)) return 'variable';
  if (line.match(/^\s*function/)) return 'function';
  if (line.match(/^\s*class/)) return 'class';
  if (line.match(/\w+\s*:/)) return 'property';
  return 'unknown';
}

/**
 * Recursively find all JavaScript files in a directory
 * @param {string} dir - Directory to search
 * @param {Array} fileList - Accumulator for file paths
 * @returns {Array} Array of JavaScript file paths
 */
function findJavaScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip common directories
      if (!['node_modules', '.git', 'dist', 'build', '.secrets'].includes(file)) {
        findJavaScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Format and display search results
 * @param {Array} results - Search results to display
 * @param {string} varName - The variable name that was searched
 */
function displayResults(results, varName) {
  if (results.length === 0) {
    console.log(`No declarations found for variable '${varName}'`);
    return;
  }
  
  console.log(`\nFound ${results.length} declaration(s) for '${varName}':\n`);
  results.forEach(result => {
    console.log(`${result.file}:${result.line} [${result.type}]`);
    console.log(`  ${result.content}`);
    console.log();
  });
}

// CLI execution
if (require.main === module) {
  const varName = process.argv[2];
  
  if (!varName) {
    console.error('Usage: node src/find-variable.js <variable-name>');
    console.error('Example: node src/find-variable.js myVariable');
    process.exit(1);
  }
  
  console.log(`Searching for variable '${varName}' in the codebase...`);
  const results = findVariable(varName, process.cwd());
  displayResults(results, varName);
}

module.exports = { findVariable, findJavaScriptFiles, displayResults, escapeRegex };
