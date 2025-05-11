console.log('Debug script starting...');

// Try to require other files to check for syntax errors
try {
  console.log('Trying to load break-manager.js...');
  require('./break-manager');
  console.log('break-manager.js loaded successfully');
} catch (error) {
  console.error('Error loading break-manager.js:', error.message);
}

try {
  console.log('Trying to load break-manager.test.js...');
  require('./break-manager.test');
  console.log('break-manager.test.js loaded successfully');
} catch (error) {
  console.error('Error loading break-manager.test.js:', error.message);
}

try {
  console.log('Trying to load task-cycler.js...');
  require('./task-cycler');
  console.log('task-cycler.js loaded successfully');
} catch (error) {
  console.error('Error loading task-cycler.js:', error.message);
}

try {
  console.log('Trying to load task-cycler.test.js...');
  require('./task-cycler.test');
  console.log('task-cycler.test.js loaded successfully');
} catch (error) {
  console.error('Error loading task-cycler.test.js:', error.message);
}

console.log('Debug script completed');
