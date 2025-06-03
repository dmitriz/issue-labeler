// Custom GPT Evaluation Framework Integration for Issue Labeler
// Integrates professional evaluation standards with AI-powered issue labeling

const { evaluateInstructionAdherence, calculateQualityMetrics } = require('./evaluation-utils');

/**
 * Evaluates AI labeling using custom GPT framework standards
 * Based on custom-gpts professional evaluation methodology
 */
async function evaluateCustomGPT(labelingResult) {
  const startTime = Date.now();
  
  try {
    // Apply 2025 performance benchmarks
    const evaluation = {
      score: 0,
      metrics: {
        instructionAdherence: 0,
        technicalAccuracy: 0,
        responseQuality: 0,
        consistency: 0
      },
      decision: 'REJECT',
      costAnalysis: {
        tokensUsed: labelingResult.tokensUsed || 0,
        estimatedCost: 0
      }
    };

    // 1. Instruction Adherence (25% weight) - >90% threshold
    evaluation.metrics.instructionAdherence = await evaluateInstructionAdherence(
      labelingResult.prompt,
      labelingResult.response,
      labelingResult.expectedFormat
    );

    // 2. Technical Accuracy (30% weight) - Domain specialization standards
    evaluation.metrics.technicalAccuracy = await evaluateTechnicalAccuracy(
      labelingResult.labels,
      labelingResult.issueContent
    );

    // 3. Response Quality (25% weight) - Professional standards
    evaluation.metrics.responseQuality = await evaluateResponseQuality(
      labelingResult.response,
      labelingResult.context
    );

    // 4. Consistency (20% weight) - ±10-15% variance tolerance
    evaluation.metrics.consistency = await evaluateConsistency(
      labelingResult.labels,
      labelingResult.previousResults
    );

    // Calculate composite score
    evaluation.score = (
      evaluation.metrics.instructionAdherence * 0.25 +
      evaluation.metrics.technicalAccuracy * 0.30 +
      evaluation.metrics.responseQuality * 0.25 +
      evaluation.metrics.consistency * 0.20
    );

    // Apply decision framework
    if (evaluation.score >= 90) {
      evaluation.decision = 'DEPLOY';
    } else if (evaluation.score >= 70) {
      evaluation.decision = 'OPTIMIZE';
    } else {
      evaluation.decision = 'REJECT';
    }

    // Cost analysis (2025 pricing)
    evaluation.costAnalysis.estimatedCost = calculateCost(
      labelingResult.tokensUsed,
      labelingResult.modelType || 'gpt-4o'
    );

    const processingTime = Date.now() - startTime;
    evaluation.processingTime = processingTime;

    return evaluation;

  } catch (error) {
    console.error('Custom GPT evaluation failed:', error);
    return {
      score: 0,
      decision: 'ERROR',
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

async function evaluateInstructionAdherence(prompt, response, expectedFormat) {
  // Check if response follows expected JSON format
  let formatScore = 0;
  try {
    const parsed = JSON.parse(response);
    if (parsed.urgency && parsed.importance && parsed.labels) {
      formatScore = 100;
    } else {
      formatScore = 50;
    }
  } catch {
    formatScore = 0;
  }

  // Check if all required fields are present
  const requiredFields = ['urgency', 'importance', 'labels'];
  const fieldsPresent = requiredFields.filter(field => 
    response.toLowerCase().includes(field)
  ).length;
  
  const completenessScore = (fieldsPresent / requiredFields.length) * 100;
  
  return Math.round((formatScore + completenessScore) / 2);
}

async function evaluateTechnicalAccuracy(labels, issueContent) {
  // Validate label relevance to issue content
  const urgencyKeywords = {
    high: ['urgent', 'critical', 'blocking', 'production', 'security'],
    medium: ['important', 'feature', 'enhancement', 'improvement'],
    low: ['minor', 'documentation', 'cleanup', 'refactor']
  };

  let accuracyScore = 70; // Base score
  
  // Check for keyword alignment
  const contentLower = issueContent.toLowerCase();
  for (const [level, keywords] of Object.entries(urgencyKeywords)) {
    const hasKeywords = keywords.some(keyword => contentLower.includes(keyword));
    if (hasKeywords && labels.some(label => label.includes(level))) {
      accuracyScore += 15;
      break;
    }
  }

  return Math.min(accuracyScore, 100);
}

async function evaluateResponseQuality(response, context) {
  // Evaluate clarity, completeness, and professionalism
  let qualityScore = 60; // Base score

  // Check response length (not too short, not too verbose)
  if (response.length > 50 && response.length < 500) {
    qualityScore += 20;
  }

  // Check for proper JSON structure
  try {
    const parsed = JSON.parse(response);
    if (typeof parsed === 'object' && parsed !== null) {
      qualityScore += 20;
    }
  } catch {
    qualityScore -= 10;
  }

  return Math.min(qualityScore, 100);
}

async function evaluateConsistency(labels, previousResults = []) {
  if (previousResults.length === 0) return 85; // Default for first evaluation

  // Calculate variance in labeling decisions
  const currentUrgency = extractUrgencyLevel(labels);
  const previousUrgencies = previousResults.map(r => extractUrgencyLevel(r.labels));
  
  const variance = calculateVariance(previousUrgencies, currentUrgency);
  
  // Good consistency: variance <= 15%
  if (variance <= 15) return 95;
  if (variance <= 25) return 80;
  return 60;
}

function extractUrgencyLevel(labels) {
  if (labels.some(l => l.includes('high') || l.includes('urgent'))) return 3;
  if (labels.some(l => l.includes('medium'))) return 2;
  return 1;
}

function calculateVariance(previousValues, currentValue) {
  if (previousValues.length === 0) return 0;
  
  const mean = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length;
  const deviation = Math.abs(currentValue - mean) / mean * 100;
  
  return Math.round(deviation);
}

function calculateCost(tokensUsed, modelType) {
  const pricing = {
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4.1': { input: 0.03, output: 0.12 },
    'o1-mini': { reasoning: 3.00 }
  };

  const model = pricing[modelType] || pricing['gpt-4o'];
  const inputTokens = Math.floor(tokensUsed * 0.7); // Estimate
  const outputTokens = Math.floor(tokensUsed * 0.3);

  return (inputTokens * model.input + outputTokens * model.output) / 1000;
}

module.exports = {
  evaluateCustomGPT,
  evaluateInstructionAdherence,
  evaluateTechnicalAccuracy,
  evaluateResponseQuality,
  evaluateConsistency,
  calculateCost
};
