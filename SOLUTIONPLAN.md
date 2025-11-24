# Graphite CLI Clone - Solution Plan

## Executive Summary
This document outlines the technical design and implementation approach for building a Graphite CLI clone. The solution will use Node.js/TypeScript with the GitHub GraphQL API to provide core stacked PR workflow capabilities.

## Technology Stack

### Primary Language: TypeScript/Node.js
**Rationale**: 
- Excellent tooling for CLI applications (Commander.js)
- Strong GraphQL client libraries (graphql-request, @octokit/graphql)
- Native async/await support for API calls
- Large ecosystem and community support
- Good cross-platform compatibility

### Core Dependencies
- **CLI Framework**: Commander.js - robust CLI argument parsing
- **GitHub API**: @octokit/graphql - official GitHub GraphQL client
- **Git Operations**: simple-git - Node.js git wrapper
- **Configuration**: conf - secure config storage
- **Logging**: chalk - colored terminal output

### Development Tools
- **Build**: TypeScript compiler, esbuild
- **Testing**: Jest for unit tests
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐
│   CLI Entry     │
│   (gt command)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Command Router │
│  (Commander.js) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Command Handlers             │
│  ┌──────┬──────┬──────┬──────────┐  │
│  │ Auth │Create│Submit│  Sync    │  │
│  └──────┴──────┴──────┴──────────┘  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Service Layer                │
│  ┌──────────┬──────────┬──────────┐ │
│  │   Git    │  GitHub  │  Config  │ │
│  │ Service  │ Service  │ Service  │ │
│  └──────────┴──────────┴──────────┘ │
└─────────────────────────────────────┘
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│   Git CLI    │  │  GitHub API  │
│              │  │   (GraphQL)  │
└──────────────┘  └──────────────┘
```

## Module Structure

### Directory Layout
```
graphite-cli/
├── src/
│   ├── commands/          # Command implementations
│   │   ├── auth.ts
│   │   ├── init.ts
│   │   ├── create.ts
│   │   ├── submit.ts
│   │   ├── stack.ts
│   │   ├── sync.ts
│   │   └── checkout.ts
│   ├── services/          # Business logic
│   │   ├── git.service.ts
│   │   ├── github.service.ts
│   │   ├── config.service.ts
│   │   └── stack.service.ts
│   ├── models/            # Data structures
│   │   ├── branch.ts
│   │   ├── stack.ts
│   │   └── pr.ts
│   ├── utils/             # Utilities
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── validators.ts
│   ├── graphql/           # GraphQL queries/mutations
│   │   ├── queries.ts
│   │   └── mutations.ts
│   └── index.ts           # CLI entry point
├── tests/
│   ├── commands/
│   ├── services/
│   └── integration/
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Core Components Design

### 1. CLI Entry Point (index.ts)
```typescript
// Main entry point
// - Parse arguments using Commander.js
// - Route to appropriate command handler
// - Handle global options (--help, --version, --verbose)
// - Set up error handling and logging
```

### 2. Command Handlers (commands/)
Each command is a separate module:
- **auth.ts**: Handle GitHub authentication
- **init.ts**: Initialize Graphite in repository
- **create.ts**: Create new branch in stack
- **submit.ts**: Create PR from branch
- **stack.ts**: Display stack visualization
- **sync.ts**: Synchronize branches with remote
- **checkout.ts**: Switch between branches

### 3. Service Layer

#### Git Service (git.service.ts)
```typescript
class GitService {
  // Branch operations
  async getCurrentBranch(): Promise<string>
  async createBranch(name: string, parent?: string): Promise<void>
  async checkoutBranch(name: string): Promise<void>
  async getBranches(): Promise<string[]>
  
  // Repository operations
  async isGitRepository(): Promise<boolean>
  async getRemoteUrl(): Promise<string>
  async isClean(): Promise<boolean>
  
  // Commit operations
  async commit(message: string): Promise<void>
  async push(branch: string): Promise<void>
  async pull(branch: string): Promise<void>
}
```

#### GitHub Service (github.service.ts)
```typescript
class GitHubService {
  // Authentication
  async validateToken(token: string): Promise<boolean>
  async getAuthenticatedUser(): Promise<User>
  
  // Repository operations
  async getRepository(owner: string, name: string): Promise<Repository>
  
  // PR operations
  async createPullRequest(params: CreatePRParams): Promise<PullRequest>
  async updatePullRequest(id: string, params: UpdatePRParams): Promise<void>
  async getPullRequest(number: number): Promise<PullRequest>
  async listPullRequests(filters: PRFilters): Promise<PullRequest[]>
  
  // GraphQL queries
  private async query<T>(query: string, variables: any): Promise<T>
}
```

#### Config Service (config.service.ts)
```typescript
class ConfigService {
  // Authentication
  async getToken(): Promise<string | null>
  async setToken(token: string): Promise<void>
  
  // Stack metadata
  async getStackMetadata(): Promise<StackMetadata>
  async saveStackMetadata(metadata: StackMetadata): Promise<void>
  
  // Repository configuration
  async getRepoConfig(): Promise<RepoConfig>
  async initializeRepo(): Promise<void>
}
```

#### Stack Service (stack.service.ts)
```typescript
class StackService {
  // Stack management
  async getStack(branch: string): Promise<Stack>
  async addToStack(branch: string, parent: string): Promise<void>
  async removeFromStack(branch: string): Promise<void>
  
  // Stack visualization
  async visualizeStack(): Promise<string>
  
  // Stack operations
  async syncStack(branch: string): Promise<void>
  async rebaseStack(branch: string): Promise<void>
}
```

## Data Models

### Branch Model
```typescript
interface Branch {
  name: string;
  parent: string | null;
  children: string[];
  prNumber: number | null;
  prUrl: string | null;
  lastSynced: Date;
}
```

### Stack Model
```typescript
interface Stack {
  root: string;
  branches: Branch[];
  currentBranch: string;
}
```

### Pull Request Model
```typescript
interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  url: string;
  headRef: string;
  baseRef: string;
}
```

## GitHub GraphQL Integration

### Key Queries

#### 1. Get Repository Info
```graphql
query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    name
    owner {
      login
    }
    defaultBranchRef {
      name
    }
  }
}
```

#### 2. List Pull Requests
```graphql
query ListPullRequests($owner: String!, $name: String!, $first: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: $first, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes {
        number
        title
        state
        headRefName
        baseRefName
        url
      }
    }
  }
}
```

### Key Mutations

#### 1. Create Pull Request
```graphql
mutation CreatePullRequest($input: CreatePullRequestInput!) {
  createPullRequest(input: $input) {
    pullRequest {
      number
      url
      title
    }
  }
}
```

#### 2. Update Pull Request
```graphql
mutation UpdatePullRequest($input: UpdatePullRequestInput!) {
  updatePullRequest(input: $input) {
    pullRequest {
      id
      title
      body
    }
  }
}
```

## Configuration Storage

### Local Configuration (.graphite/config.json)
```json
{
  "version": "1.0.0",
  "repository": {
    "owner": "username",
    "name": "repo-name",
    "defaultBranch": "main"
  },
  "stacks": {
    "branch-name": {
      "parent": "main",
      "children": ["child-branch-1"],
      "pr": 123
    }
  }
}
```

### Authentication Storage
- Use `conf` package with encryption
- Store in OS-specific config directory
- Never commit tokens to git

## Command Implementation Details

### gt init
1. Verify current directory is a git repository
2. Verify remote is GitHub
3. Parse owner/repo from remote URL
4. Create `.graphite` directory
5. Initialize config file
6. Validate GitHub access (if token exists)

### gt auth
1. Prompt for GitHub personal access token
2. Validate token with GitHub API
3. Store encrypted token in config
4. Display authenticated user info

### gt create <branch-name>
1. Verify repository is initialized
2. Get current branch as parent
3. Create new git branch
4. Update stack metadata
5. Checkout new branch
6. Display success message

### gt submit [--title] [--body]
1. Verify current branch
2. Check for uncommitted changes
3. Push branch to remote
4. Get repository ID from GitHub
5. Create PR using GraphQL mutation
6. Update local stack metadata with PR number
7. Display PR URL

### gt stack
1. Get current branch
2. Load stack metadata
3. Build tree structure
4. Render visual tree to terminal
5. Highlight current branch
6. Show PR status for each branch

### gt sync
1. Get current branch and stack
2. Fetch latest from remote
3. Rebase each branch in stack order
4. Push updated branches
5. Update PR base branches if needed
6. Display sync results

## Error Handling Strategy

### Error Categories
1. **Git Errors**: Repository not found, uncommitted changes
2. **GitHub API Errors**: Authentication, rate limiting, not found
3. **Configuration Errors**: Missing config, invalid format
4. **User Errors**: Invalid input, missing required parameters

### Error Handling Pattern
```typescript
class GraphiteError extends Error {
  code: string;
  recoverable: boolean;
}

// Usage
try {
  await operation();
} catch (error) {
  if (error instanceof GraphiteError) {
    logger.error(error.message);
    if (error.recoverable) {
      // Suggest recovery action
    }
  }
  process.exit(1);
}
```

## Testing Strategy

### Unit Tests
- Test each service independently
- Mock external dependencies (git, GitHub API)
- Achieve >70% code coverage
- Use Jest for test framework

### Integration Tests
- Test complete command flows
- Use temporary git repositories
- Mock GitHub API responses
- Test error scenarios

### Example Test Structure
```typescript
describe('GitService', () => {
  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      // Test implementation
    });
    
    it('should throw error when not in git repo', async () => {
      // Test implementation
    });
  });
});
```

## Security Considerations

### 1. Token Storage
- Store tokens encrypted using `conf` package
- Never log or display full tokens
- Clear tokens on logout command

### 2. Input Validation
- Sanitize all user inputs
- Validate branch names
- Validate PR titles and descriptions

### 3. API Rate Limiting
- Implement exponential backoff
- Cache API responses where appropriate
- Display rate limit warnings

### 4. Permissions
- Validate GitHub token has required scopes
- Check repository permissions before operations
- Handle permission errors gracefully

## Performance Optimization

### 1. Caching
- Cache repository metadata
- Cache branch relationships
- Invalidate on sync operations

### 2. Batch Operations
- Batch GraphQL queries where possible
- Minimize API calls
- Use GraphQL fragments for reusability

### 3. Async Operations
- Use async/await throughout
- Parallel operations where possible
- Show progress indicators for long operations

## Build and Deployment

### Build Process
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run tests
npm test

# Lint
npm run lint
```

### Distribution
- Publish to npm registry
- Binary distribution via pkg or similar
- Support global installation: `npm install -g graphite-cli-clone`

### CLI Installation
```bash
npm install -g graphite-cli-clone
gt --version
```

## Development Workflow

### Phase 1: Setup (Complete)
- [x] Requirements defined
- [x] Solution plan created

### Phase 2: Core Infrastructure
- [ ] Set up TypeScript project structure
- [ ] Implement Git service
- [ ] Implement Config service
- [ ] Set up testing framework

### Phase 3: GitHub Integration
- [ ] Implement GitHub service
- [ ] Create GraphQL queries/mutations
- [ ] Test API integration

### Phase 4: Command Implementation
- [ ] Implement gt init
- [ ] Implement gt auth
- [ ] Implement gt create
- [ ] Implement gt submit
- [ ] Implement gt stack
- [ ] Implement gt sync

### Phase 5: Stack Management
- [ ] Implement Stack service
- [ ] Branch relationship tracking
- [ ] Stack visualization
- [ ] Stack synchronization

### Phase 6: Polish and Documentation
- [ ] Error handling and messages
- [ ] Help documentation
- [ ] README and examples
- [ ] Testing and validation

## Risks and Mitigations

### Risk 1: Complex Git Operations
**Mitigation**: Use well-tested `simple-git` library, extensive testing

### Risk 2: GitHub API Changes
**Mitigation**: Use official Octokit library, version pin dependencies

### Risk 3: Cross-Platform Compatibility
**Mitigation**: Test on Linux, macOS, Windows; use path.join for paths

### Risk 4: Token Security
**Mitigation**: Use encrypted storage, never log tokens, clear documentation

## Success Criteria

### MVP Completion
- All core commands implemented and working
- Tests passing with >70% coverage
- Documentation complete
- Successful end-to-end workflow demonstration

### Quality Gates
- Linting passes
- Security scan passes
- No critical bugs
- Performance benchmarks met

## Next Steps

1. Review and approve solution plan
2. Create ADR for technology choices
3. Set up project structure
4. Begin Phase 2 implementation
5. Update handoff log when moving to implementation phase
