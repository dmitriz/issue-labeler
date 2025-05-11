#!/bin/bash
# filepath: /home/z/repos/issue-labeler/debug-task-cycler.sh

# This script helps debug the task cycler by running it with extra output

echo "------- Starting debugging run -------"
echo "Current state file contents:"
if [ -f "session-state.json" ]; then
  cat session-state.json
else 
  echo "No state file exists yet"
fi

echo ""
echo "Running task cycler..."
node src/task-cycler.js

echo ""
echo "New state file contents:"
if [ -f "session-state.json" ]; then
  cat session-state.json
else
  echo "State file was not created"
fi

echo ""
echo "------- Debugging run complete -------"
