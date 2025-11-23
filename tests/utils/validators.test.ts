import { validateBranchName, validateGitHubToken, parseGitHubUrl } from '../../src/utils/validators.js';
import { ValidationError } from '../../src/utils/errors';

describe('validators', () => {
  describe('validateBranchName', () => {
    it('should accept valid branch names', () => {
      expect(() => validateBranchName('feature/my-feature')).not.toThrow();
      expect(() => validateBranchName('bugfix/issue-123')).not.toThrow();
      expect(() => validateBranchName('my-branch')).not.toThrow();
    });

    it('should reject empty branch names', () => {
      expect(() => validateBranchName('')).toThrow('Branch name cannot be empty');
      expect(() => validateBranchName('   ')).toThrow('Branch name cannot be empty');
    });

    it('should reject invalid characters', () => {
      expect(() => validateBranchName('branch with spaces')).toThrow('Invalid branch name');
      expect(() => validateBranchName('branch~with~tilde')).toThrow('Invalid branch name');
      expect(() => validateBranchName('branch^with^caret')).toThrow('Invalid branch name');
    });

    it('should reject invalid patterns', () => {
      expect(() => validateBranchName('../relative-path')).toThrow('Invalid branch name');
      expect(() => validateBranchName('.hidden')).toThrow('Invalid branch name');
      expect(() => validateBranchName('ends-with-slash/')).toThrow('Invalid branch name');
    });
  });

  describe('validateGitHubToken', () => {
    it('should accept valid tokens', () => {
      expect(() => validateGitHubToken('ghp_1234567890abcdefghijklmnop')).not.toThrow();
    });

    it('should reject empty tokens', () => {
      expect(() => validateGitHubToken('')).toThrow('GitHub token cannot be empty');
      expect(() => validateGitHubToken('   ')).toThrow('GitHub token cannot be empty');
    });

    it('should reject short tokens', () => {
      expect(() => validateGitHubToken('short')).toThrow('Invalid GitHub token format');
    });
  });

  describe('parseGitHubUrl', () => {
    it('should parse HTTPS URLs', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse HTTPS URLs without .git', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse SSH URLs', () => {
      const result = parseGitHubUrl('git@github.com:owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return null for invalid URLs', () => {
      expect(parseGitHubUrl('not-a-github-url')).toBeNull();
      expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
    });
  });
});
