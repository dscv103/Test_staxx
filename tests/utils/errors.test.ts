import { GraphiteError, GitError, GitHubError, ConfigError, ValidationError } from '../../src/utils/errors.js';

describe('errors', () => {
  describe('GraphiteError', () => {
    it('should create error with message and code', () => {
      const error = new GraphiteError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.recoverable).toBe(false);
    });

    it('should support recoverable flag', () => {
      const error = new GraphiteError('Recoverable error', 'TEST', true);
      expect(error.recoverable).toBe(true);
    });
  });

  describe('GitError', () => {
    it('should be instance of GraphiteError', () => {
      const error = new GitError('Git error');
      expect(error).toBeInstanceOf(GraphiteError);
      expect(error.code).toBe('GIT_ERROR');
    });
  });

  describe('GitHubError', () => {
    it('should be instance of GraphiteError', () => {
      const error = new GitHubError('GitHub error');
      expect(error).toBeInstanceOf(GraphiteError);
      expect(error.code).toBe('GITHUB_ERROR');
    });
  });

  describe('ConfigError', () => {
    it('should be instance of GraphiteError', () => {
      const error = new ConfigError('Config error');
      expect(error).toBeInstanceOf(GraphiteError);
      expect(error.code).toBe('CONFIG_ERROR');
    });
  });

  describe('ValidationError', () => {
    it('should be instance of GraphiteError', () => {
      const error = new ValidationError('Validation error');
      expect(error).toBeInstanceOf(GraphiteError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.recoverable).toBe(true);
    });
  });
});
