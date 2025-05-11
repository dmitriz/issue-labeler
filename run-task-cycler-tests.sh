#!/bin/bash
echo "Running Task Cycler E2E Tests"
echo ""
echo "Test 1: should start in break mode if no state file exists"
rm -f session-state.json
TEST_REPO=true node src/task-cycler.js
echo ""
echo "Test 2: should toggle from work to break mode"
echo "{ \"mode\": \"work\", \"lastBreakIndex\": -1 }" > session-state.json
TEST_REPO=true node src/task-cycler.js
echo ""
echo "Test 3: should toggle from break to work mode"
echo "{ \"mode\": \"break\", \"lastBreakIndex\": 0 }" > session-state.json  
TEST_REPO=true node src/task-cycler.js
echo ""
echo "Test 4: should cycle through break suggestions"
echo "{ \"mode\": \"work\", \"lastBreakIndex\": 4 }" > session-state.json
TEST_REPO=true node src/task-cycler.js

