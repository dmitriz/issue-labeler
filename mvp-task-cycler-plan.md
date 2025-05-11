# MVP TASK CYCLER: COMPLETE SYSTEM AND VALIDATION PLAN

## 📌 Purpose
The purpose of this MVP is to build a minimal but functional task cycler that alternates between focused work sessions and short breaks. It automatically fetches tasks from a real GitHub repository and rotates through a predefined list of break suggestions.

## 🧱 Core Features
Alternating Work ↔ Break loop

Each run of the script:

- Ends the current session (work or break)
- Starts the opposite session
- Prints a new task or break suggestion
- Uses a persistent state file (e.g. state.json) to track the current mode and last suggestion used

Works with:

- Real GitHub issues
- A local break suggestions list

## 🔁 Session Modes
There are only two valid states for the app at any time:

- `work`: You're currently focused on a task
- `break`: You're currently in a rest mode

Each session alternates with the other when the script is run.

## 🧠 State Structure
The state file stores:

```json
{
  "mode": "work" | "break"
}
```

Optional internal (invisible) metadata:

- Last used break suggestion index (for cycling)
- Last used task ID (optional; we typically fetch the next automatically)

## 🔄 Session Loop Logic (High-Level)
### ✅ When in work mode:
- End the work session
- Start a break session
- Pick the next break suggestion (cycled from a local list)
- Print:
  - "Work session complete. Time for a break!"
  - "Try this break activity: [suggestion]"

### ✅ When in break mode:
- End the break
- Start a new work session
- Fetch the next task from GitHub issues, using the following logic:
  - First, look for issues marked as urgent (label urgent) and assigned to the user
  - If none, check for important tasks (label important)
  - Otherwise, fall back to the oldest available task
- Print:
  - "Break over. Time to work!"
  - "Your next task: [task title] — [link to issue]"

## 🔗 GitHub Task Logic
Uses GitHub API (or existing helper functions) to fetch open issues

Filters by labels in this order:
1. urgent + assigned
2. important 
3. fallback: oldest unclosed issue

Outputs only one task per session (keeps it minimal)

Issues are not marked automatically (you act on them manually for now)

## 🧘 Break Suggestion Logic
Stored locally in a simple file or embedded in code:

```json
["Stretch for 2 minutes", "Drink water", "Look away from screen", "Do 10 squats"]
```

- Rotated in fixed order (not random) to reduce decision fatigue
- Index automatically advances with each new break
- Wraps around when the list ends

## 🧪 Running Locally
### Install & Setup:
```bash
npm install
```

### Run in production mode:
```bash
npm start
```

### Optional test mode:
```bash
npm run test-mode
```
- Uses mock data to simulate GitHub tasks and break logic
- Helpful for debugging and demo without touching real repo

## 📁 File Structure Overview
```
/
├── state.json             # Tracks current session state
├── break-suggestions.json # List of break ideas
├── src/
│   ├── index.js           # Main loop controller
│   ├── github.js          # Task-fetching logic from issues
│   └── utils.js           # State and logging helpers
├── package.json
├── README.md
```

## ✅ Final Manual Validation Steps
Use this checklist each time you update the system or want to test the MVP flow:

### 🔹 Local Preparation
- [ ] Switch to the correct branch
- [ ] Pull latest changes
- [ ] Run npm install if needed

### 🔹 Run & Observe
- [ ] Execute with npm start
- [ ] Confirm correct session switch (break ↔ work)
- [ ] Confirm correct output of either:
  - Break suggestion (from cycle)
  - Task pulled from GitHub

### 🔹 Final Review
- [ ] Test mode runs correctly (npm run test-mode)
- [ ] No crashes or undefined behavior
- [ ] GitHub tasks appear as expected
- [ ] Break suggestion rotates predictably

## 🧾 Optional: Production-Ready Enhancements (Post-MVP)
These are outside MVP scope but useful to track:

- Timer integration (setTimeout or CLI countdown)
- Auto-advance to next state
- In-app commit or issue status update (e.g. close issue on completion)
- Web-based UI wrapper
- User configuration file

## 🧩 Final Notes
- This system is fully usable via CLI.
- It enables a lightweight Pomodoro-like workflow with GitHub integration.
- Designed for rapid iteration, minimal distraction, and high signal-to-noise.
