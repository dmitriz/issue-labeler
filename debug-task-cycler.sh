#!/bin/bash
# Debug script for the task cycler

# This script helps debug the task cycler by running it with extra output

echo "------- Starting debugging run -------"
echo "Current state file contents:"
STATE_FILE="session-state.json"
if [ -f "$STATE_FILE" ]; then
  cat "$STATE_FILE"
else 
  echo "No state file exists yet"
fi

echo ""
echo "Running task cycler..."
# Define script location as a variable, potentially from an environment variable
TASK_CYCLER_SCRIPT="${TASK_CYCLER_PATH:-src/task-cycler.js}"

# Use the variable
echo "Using script: $TASK_CYCLER_SCRIPT"
node "$TASK_CYCLER_SCRIPT"
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
