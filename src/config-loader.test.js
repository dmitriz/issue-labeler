/**
 * Unit tests for config-loader.js
 * Tests configuration loading functionality in isolation
 */
const assert = require('assert');
const configLoader = require('./config-loader');

describe('Config Loader', () => {
  describe('getActiveEnvironment', () => {
    it('should return an object with the active environment', () => {
      const env = configLoader.getActiveEnvironment();
      
      assert.ok(env, 'Should return an environment object');
      assert.ok(env.name, 'Environment should have a name');
      assert.ok(env.repository, 'Environment should have repository settings');
      assert.ok(typeof env.repository.owner === 'string', 'Repository should have an owner');
      assert.ok(typeof env.repository.repo === 'string', 'Repository should have a repo name');
    });
  });
  
  describe('getRepositoryConfig', () => {
    it('should return repository configuration', () => {
      const repoConfig = configLoader.getRepositoryConfig();
      
      assert.ok(repoConfig, 'Should return repository config');
      assert.ok(typeof repoConfig.owner === 'string', 'Should have owner property');
      assert.ok(typeof repoConfig.repo === 'string', 'Should have repo property');
    });
  });
  
  describe('getLabelConfig', () => {
    it('should return label configuration', () => {
      const labelConfig = configLoader.getLabelConfig();
      
      assert.ok(labelConfig, 'Should return label config');
      assert.ok(Array.isArray(labelConfig.allowedLabels), 'Should have allowedLabels array');
      // Check that the config contains the urgent and important labels
      assert.ok(labelConfig.allowedLabels.includes('urgent'), 'Should include urgent label');
      assert.ok(labelConfig.allowedLabels.includes('important'), 'Should include important label');
    });
    
    it('should normalize allowed labels to lowercase', () => {
      // Create a mock config object for testing
      const mockConfig = {
        labels: { allowedLabels: ['URGENT', 'Important', 'critical'] },
        legacy: { emptyConfigMeansAllowAll: false }
      };
      
      // Call getLabelConfig with the mock config in the this context
      const labelConfig = configLoader.getLabelConfig.call({ config: mockConfig });
      
      // All labels should be lowercase
      assert.deepStrictEqual(
        labelConfig.allowedLabels,
        ['urgent', 'important', 'critical'],
        'All labels should be normalized to lowercase'
      );
      
      // Test case sensitivity matching
      assert.ok(labelConfig.allowedLabels.includes('urgent'), 'Should match lowercase');
      assert.ok(labelConfig.allowedLabels.includes('important'), 'Should match lowercase');
      assert.ok(labelConfig.allowedLabels.includes('critical'), 'Should match lowercase');
    });
    
    it('should handle empty configuration with legacy mode', () => {
      // Create a mock config object for testing legacy mode
      const mockConfig = {
        legacy: { emptyConfigMeansAllowAll: true }
      };
      
      // Call getLabelConfig with the mock config in the this context
      const labelConfig = configLoader.getLabelConfig.call({ config: mockConfig });
      
      // Should return empty array in legacy mode
      assert.ok(Array.isArray(labelConfig.allowedLabels), 'Should return an array');
      assert.strictEqual(labelConfig.allowedLabels.length, 0, 'Array should be empty in legacy mode');
      assert.strictEqual(labelConfig.isLegacyMode, true, 'Should set isLegacyMode flag');
    });
    
    it('should default to urgent/important labels for empty allowedLabels without legacy mode', () => {
      // Create a mock config object with empty allowedLabels but no legacy mode
      const mockConfig = {
        labels: { allowedLabels: [] }, // Empty array but no legacy mode
        legacy: { emptyConfigMeansAllowAll: false }
      };
      
      // Call getLabelConfig with the mock config in the this context
      const labelConfig = configLoader.getLabelConfig.call({ config: mockConfig });
      
      // Should default to standard labels
      assert.deepStrictEqual(
        labelConfig.allowedLabels, 
        ['urgent', 'important'],
        'Should default to standard labels'
      );
    });
  });
  
  describe('getConfig', () => {
    it('should return the complete configuration', () => {
      const config = configLoader.getConfig();
      
      assert.ok(config, 'Should return config object');
      assert.ok(config.environments, 'Config should have environments section');
      assert.ok(typeof config.environments === 'object', 'Environments should be an object');
    });
  });
  
  describe('handling of mixed label types', () => {
    it('should handle non-string values in allowedLabels array', () => {
      // Create a mock config object with mixed data types
      const mockConfig = {
        // Mock with mixed types (should never happen but testing robustness)
        labels: { allowedLabels: ['urgent', 123, null, undefined, { name: 'critical' }] },
        legacy: { emptyConfigMeansAllowAll: false }
      };
      
      // Call getLabelConfig with the mock config in the this context
      const labelConfig = configLoader.getLabelConfig.call({ config: mockConfig });
      
      // Should handle non-string values gracefully
      assert.ok(Array.isArray(labelConfig.allowedLabels), 'Should return an array');
      
      // Only string values should remain and be lowercase
      assert.ok(labelConfig.allowedLabels.includes('urgent'), 'Should include string values');
      
      // Non-string values should be filtered out or converted properly
      assert.strictEqual(
        labelConfig.allowedLabels.every(label => typeof label === 'string'),
        true,
        'All labels should be strings'
      );
    });
    
    it('should differentiate between empty configs with and without legacy mode', () => {
      // Test 1: Empty config with legacy mode ON
      const mockLegacyConfig = {
        labels: { allowedLabels: [] },
        legacy: { emptyConfigMeansAllowAll: true }
      };
      
      const legacyResult = configLoader.getLabelConfig.call({ config: mockLegacyConfig });
      
      // In legacy mode with empty allowedLabels, we should get:
      // 1. Empty array (allowing any label from model)
      // 2. The isLegacyMode flag set to true
      assert.strictEqual(legacyResult.allowedLabels.length, 0, 
        'With legacy mode, empty allowedLabels should stay empty (allow all labels)');
      assert.strictEqual(legacyResult.isLegacyMode, true, 
        'With legacy mode, isLegacyMode flag should be true');
      
      // Test 2: Empty config with legacy mode OFF
      const mockStandardConfig = {
        labels: { allowedLabels: [] },
        legacy: { emptyConfigMeansAllowAll: false } 
      };
      
      const standardResult = configLoader.getLabelConfig.call({ config: mockStandardConfig });
      
      // In standard mode with empty allowedLabels, we should get:
      // The default labels (urgent, important) added to the array
      assert.strictEqual(standardResult.allowedLabels.length, 2,
        'Without legacy mode, empty allowedLabels should be populated with defaults');
      assert.ok(standardResult.allowedLabels.includes('urgent') && 
        standardResult.allowedLabels.includes('important'),
        'Without legacy mode, empty allowedLabels should get urgent and important');
      assert.strictEqual(standardResult.isLegacyMode, undefined,
        'Without legacy mode, isLegacyMode flag should be undefined');
    });
  });
});