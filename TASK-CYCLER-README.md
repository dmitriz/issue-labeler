# Task Cycler User Guide

The Task Cycler is a simple command-line tool that helps you alternate between focused work sessions and short breaks. It integrates with GitHub issues to provide you with tasks from your repository.

## How It Works

1. Run the task cycler with `npm start` or `npm run cycle`
2. The script alternates between two modes:
   - **Work Mode**: Shows you the next GitHub issue to work on
   - **Break Mode**: Suggests a break activity to refresh your mind

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/USERNAME/issue-labeler.git

# Install dependencies
npm install
```

### Configuration

The task cycler uses the `config.js` file to determine which GitHub repository to pull issues from. Make sure you have configured your GitHub repository correctly.

### Using the Task Cycler

Run the task cycler:

```bash
npm start
```

Each time you run the command, it will:
1. End the current session (work or break)
2. Start the opposite session
3. Show either a GitHub issue (for work) or a break suggestion

### Test Mode

For testing or demonstration purposes, use:

```bash
npm run test-mode
```

This will pull issues from the test repository instead of your main one.

## Enhancing Your Workflow

For the best experience:

1. **Set a timer** for your work/break sessions (e.g., 25 minutes for work, 5 minutes for break)
2. When the timer ends, run `npm start` to switch modes
3. Gradually build a rhythm of focused work and refreshing breaks

## Customizing Break Suggestions

Edit the `break-suggestions.js` file to add your own break ideas. The script will rotate through these suggestions in sequence.

## Feedback and Improvements

This is an MVP (Minimum Viable Product) version of the Task Cycler. If you have suggestions for improvements, please create an issue on the repository.
