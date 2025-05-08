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
  
  describe('getConfig', () => {
    it('should return the complete configuration', () => {
      const config = configLoader.getConfig();
      
      assert.ok(config, 'Should return config object');
      assert.ok(config.environments, 'Config should have environments section');
      assert.ok(typeof config.environments === 'object', 'Environments should be an object');
    });
  });
});