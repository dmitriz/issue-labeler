/**
 * Tests for find-variable utility
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { findVariable, findJavaScriptFiles } = require('./find-variable');

describe('findVariable', () => {
  const testDir = path.join(__dirname, '..', 'test-fixtures', 'find-variable-test');
  
  before(() => {
    // Create test directory and files
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create test file with various declarations
    fs.writeFileSync(
      path.join(testDir, 'test-file.js'),
      `const r = 42;
let r = 'hello';
var r = true;
function r() {}
class r {}
const obj = { r: 10 };
`
    );
  });
  
  after(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  it('should find variable declarations', () => {
    const results = findVariable('r', testDir);
    assert.ok(results.length > 0, 'Should find at least one declaration');
  });
  
  it('should find function declarations', () => {
    const results = findVariable('r', testDir);
    const functionDecl = results.find(r => r.type === 'function');
    assert.ok(functionDecl, 'Should find function declaration');
  });
  
  it('should find class declarations', () => {
    const results = findVariable('r', testDir);
    const classDecl = results.find(r => r.type === 'class');
    assert.ok(classDecl, 'Should find class declaration');
  });
  
  it('should return empty array for non-existent variable', () => {
    const results = findVariable('nonExistentVar', testDir);
    assert.strictEqual(results.length, 0, 'Should return empty array');
  });
});

describe('findJavaScriptFiles', () => {
  it('should find JavaScript files in src directory', () => {
    const files = findJavaScriptFiles(path.join(__dirname, '..', 'src'));
    assert.ok(files.length > 0, 'Should find JavaScript files');
    assert.ok(files.every(f => f.endsWith('.js')), 'All files should have .js extension');
  });
  
  it('should skip node_modules directory', () => {
    const files = findJavaScriptFiles(path.join(__dirname, '..'));
    const hasNodeModules = files.some(f => f.includes('node_modules'));
    assert.ok(!hasNodeModules, 'Should not include files from node_modules');
  });
});
