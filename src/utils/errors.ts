export class GraphiteError extends Error {
  code: string;
  recoverable: boolean;

  constructor(message: string, code: string = 'UNKNOWN', recoverable: boolean = false) {
    super(message);
    this.name = 'GraphiteError';
    this.code = code;
    this.recoverable = recoverable;
    Object.setPrototypeOf(this, GraphiteError.prototype);
  }
}

export class GitError extends GraphiteError {
  constructor(message: string, recoverable: boolean = false) {
    super(message, 'GIT_ERROR', recoverable);
    this.name = 'GitError';
  }
}

export class GitHubError extends GraphiteError {
  constructor(message: string, recoverable: boolean = false) {
    super(message, 'GITHUB_ERROR', recoverable);
    this.name = 'GitHubError';
  }
}

export class ConfigError extends GraphiteError {
  constructor(message: string, recoverable: boolean = false) {
    super(message, 'CONFIG_ERROR', recoverable);
    this.name = 'ConfigError';
  }
}

export class ValidationError extends GraphiteError {
  constructor(message: string, recoverable: boolean = true) {
    super(message, 'VALIDATION_ERROR', recoverable);
    this.name = 'ValidationError';
  }
}
