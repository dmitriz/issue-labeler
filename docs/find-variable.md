# Find Variable Utility

A command-line tool to search for variable, function, class, and property declarations in JavaScript codebases.

## Purpose

This utility helps developers quickly locate where specific identifiers are declared in their codebase. It searches through JavaScript files and reports all declarations matching the specified name, including:

- Variable declarations (`const`, `let`, `var`)
- Function declarations
- Class declarations
- Object properties

## Usage

### Command Line

```bash
# Using npm script
npm run find-var <variable-name>

# Direct execution
node src/find-variable.js <variable-name>
```

### Example

```bash
npm run find-var myVariable
```

Output:
```
Searching for variable 'myVariable' in the codebase...

Found 3 declaration(s) for 'myVariable':

src/example.js:10 [variable]
  const myVariable = 42;

src/utils.js:25 [function]
  function myVariable() { ... }

src/config.js:15 [property]
  config: { myVariable: 'value' }
```

## Features

- **Multiple declaration types**: Finds variables, functions, classes, and properties
- **Recursive search**: Searches through all subdirectories (excluding `node_modules`, `.git`, etc.)
- **Line numbers**: Reports exact file location and line number
- **Code context**: Shows the actual line of code where the declaration occurs
- **Smart filtering**: Automatically skips build artifacts and dependencies

## Programmatic Usage

You can also use this utility programmatically in your Node.js code:

```javascript
const { findVariable } = require('./src/find-variable');

// Search for a variable
const results = findVariable('myVar', './src');

// results is an array of objects:
// [
//   {
//     file: 'src/example.js',
//     line: 10,
//     content: 'const myVar = 42;',
//     type: 'variable'
//   },
//   ...
// ]
```

## Testing

The utility includes comprehensive tests:

```bash
npm run test:unit
```

## Limitations

- Only searches JavaScript (`.js`) files
- Does not analyze import/export statements
- Does not follow dynamic property access patterns
- Case-sensitive search only

## Example Use Case

Finding where "r" is declared in the issue-labeler codebase:

```bash
npm run find-var r
```

This was the original purpose - to find the user-defined variable 'r' anywhere in the codebase!
