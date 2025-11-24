import { ValidationError } from './errors.js';

export function validateBranchName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Branch name cannot be empty');
  }

  // Git branch name restrictions
  const invalidPatterns = [
    /\.\./,           // Cannot contain '..'
    /^[./]/,          // Cannot start with . or /
    /\/$/,            // Cannot end with /
    /\.lock$/,        // Cannot end with .lock
    /@\{/,            // Cannot contain @{
    // eslint-disable-next-line no-control-regex
    /[\x00-\x1f\x7f]/, // No control characters
    /[~^:?*[\\\]]/,    // No special characters
    /\s/,             // No whitespace
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(name)) {
      throw new ValidationError(`Invalid branch name: "${name}"`);
    }
  }
}

export function validateGitHubToken(token: string): void {
  if (!token || token.trim().length === 0) {
    throw new ValidationError('GitHub token cannot be empty');
  }

  // Basic format validation
  if (token.length < 20) {
    throw new ValidationError('Invalid GitHub token format');
  }
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Support HTTPS and SSH formats
  // HTTPS: https://github.com/owner/repo or https://github.com/owner/repo.git
  // SSH: git@github.com:owner/repo or git@github.com:owner/repo.git
  const httpsPattern = /github\.com\/([^/]+)\/([^/.]+)(\.git)?$/;
  const sshPattern = /github\.com:([^/]+)\/([^/.]+)(\.git)?$/;
  
  let match = url.match(httpsPattern);
  if (!match) {
    match = url.match(sshPattern);
  }

  if (match) {
    return {
      owner: match[1],
      repo: match[2],
    };
  }

  return null;
}
