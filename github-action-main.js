#!/usr/bin/env node

const core = require('@actions/core');
const github = require('@actions/github');
const { labelIssue } = require('./src/label-issue');
const { evaluateCustomGPT } = require('./src/custom-gpt-evaluator');

async function run() {
  try {
    const token = core.getInput('github-token');
    const customGptMode = core.getInput('custom-gpt-mode') === 'true';
    const threshold = parseInt(core.getInput('evaluation-threshold'));
    
    const context = github.context;
    const issueNumber = context.payload.issue?.number;
    
    if (!issueNumber) {
      core.setFailed('No issue number found in context');
      return;
    }

    // Enhanced AI labeling with custom GPT evaluation
    const result = await labelIssue(issueNumber, {
      token,
      customGptMode,
      evaluationThreshold: threshold,
      repository: {
        owner: context.repo.owner,
        repo: context.repo.repo
      }
    });

    if (customGptMode) {
      // Apply custom GPT evaluation framework
      const evaluation = await evaluateCustomGPT(result);
      core.setOutput('evaluation-score', evaluation.score);
      core.setOutput('quality-metrics', JSON.stringify(evaluation.metrics));
    }

    core.setOutput('labels-applied', result.labels.join(','));
    core.setOutput('confidence', result.confidence);
    
    console.log(`✅ Issue #${issueNumber} labeled with: ${result.labels.join(', ')}`);
    
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
