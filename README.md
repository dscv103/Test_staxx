# Graphite CLI Clone

A command-line tool for managing stacked pull requests using GitHub's GraphQL API. This is a clone of the popular Graphite CLI that streamlines GitHub workflows by enabling efficient branch stacking and PR management.

## Features

- 🌳 **Stacked PRs**: Create and manage dependent branches with ease
- 🔄 **Smart Sync**: Synchronize entire branch stacks with remote repositories
- 🎯 **GitHub Integration**: Native GitHub GraphQL API integration for fast PR operations
- 📊 **Visual Stack Display**: See your branch dependencies at a glance
- 🔐 **Secure Authentication**: Encrypted token storage for GitHub access
- ⚡ **Fast Operations**: Optimized for quick command execution

## Installation

```bash
npm install -g graphite-cli-clone
```

Or run from source:

```bash
git clone <repository-url>
cd graphite-cli-clone
npm install
npm run build
npm link
```

## Quick Start

1. **Initialize Graphite in your repository:**
   ```bash
   cd your-repository
   gt init
   ```

2. **Authenticate with GitHub:**
   ```bash
   gt auth --token YOUR_GITHUB_TOKEN
   ```
   
   Create a GitHub Personal Access Token at: https://github.com/settings/tokens
   
   Required scopes: `repo`, `read:org`

3. **Create a branch:**
   ```bash
   gt create feature/my-feature
   ```

4. **Submit a PR:**
   ```bash
   gt submit --title "My Feature" --body "Description of changes"
   ```

5. **View your stack:**
   ```bash
   gt stack
   ```

## Commands

### `gt init`
Initialize Graphite in the current Git repository.

```bash
gt init
```

### `gt auth`
Authenticate with GitHub using a personal access token.

```bash
# Login
gt auth --token YOUR_TOKEN

# Check authentication status
gt auth

# Logout
gt auth --logout
```

### `gt create <branch-name>`
Create a new branch in the stack.

```bash
# Create branch from current branch
gt create feature/my-feature

# Create branch from specific parent
gt create feature/child-feature --parent feature/my-feature
```

### `gt submit`
Create a pull request for the current branch.

```bash
# Submit with auto-generated title
gt submit

# Submit with custom title and description
gt submit --title "Feature: Add login" --body "Implements user login functionality"

# Submit with custom base branch
gt submit --base main
```

### `gt stack`
Display the current branch stack as a visual tree.

```bash
# Show stack for current branch
gt stack

# Show stack for specific branch
gt stack --branch feature/my-feature
```

Example output:
```
Branch Stack:
└─ main
   ├─ feature/authentication [PR #123]
   │  └─ feature/login-page (current) [PR #124]
   └─ feature/database
```

### `gt sync`
Synchronize the current branch stack with the remote repository.

```bash
gt sync
```

This command:
- Fetches latest changes from remote
- Pulls updates for all branches in the stack
- Returns to the original branch

### `gt checkout <branch-name>`
Switch to a different branch.

```bash
gt checkout feature/my-feature

# Using alias
gt co feature/my-feature
```

## Workflow Example

Here's a typical workflow for building a feature with stacked PRs:

```bash
# 1. Start from main branch
git checkout main

# 2. Initialize Graphite (first time only)
gt init

# 3. Authenticate (first time only)
gt auth --token ghp_your_token_here

# 4. Create first branch for database changes
gt create feature/database-schema
# ... make changes ...
git add .
git commit -m "Add database schema"
gt submit --title "Database Schema" --body "Initial database structure"

# 5. Create second branch for API (depends on database)
gt create feature/api-endpoints
# ... make changes ...
git add .
git commit -m "Add API endpoints"
gt submit --title "API Endpoints" --body "RESTful API implementation"

# 6. Create third branch for UI (depends on API)
gt create feature/ui-components
# ... make changes ...
git add .
git commit -m "Add UI components"
gt submit --title "UI Components" --body "User interface implementation"

# 7. View the entire stack
gt stack
# Output:
# └─ main
#    └─ feature/database-schema [PR #101]
#       └─ feature/api-endpoints [PR #102]
#          └─ feature/ui-components (current) [PR #103]

# 8. Synchronize all branches
gt sync
```

## Configuration

Graphite stores configuration in two locations:

### Global Config
Location: OS-specific config directory (managed by `conf` package)
- Authentication tokens (encrypted)
- User preferences

### Local Config
Location: `.graphite/config.json` in your repository
- Repository information
- Branch stack metadata
- PR associations

**Note:** Add `.graphite/` to your `.gitignore` to avoid committing local configuration.

## Architecture

The CLI is built with:
- **Language:** TypeScript/Node.js
- **CLI Framework:** Commander.js
- **GitHub API:** @octokit/graphql (GitHub GraphQL API v4)
- **Git Operations:** simple-git
- **Config Storage:** conf (with encryption)

### Project Structure
```
src/
├── commands/       # Command implementations
├── services/       # Business logic
│   ├── git.service.ts
│   ├── github.service.ts
│   ├── config.service.ts
│   └── stack.service.ts
├── models/         # Data structures
├── utils/          # Utilities
├── graphql/        # GraphQL queries/mutations
└── index.ts        # CLI entry point
```

## Development

### Setup
```bash
npm install
```

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev    # Watch mode
```

### Testing
```bash
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Linting
```bash
npm run lint            # Check for issues
npm run lint:fix        # Auto-fix issues
```

### Format
```bash
npm run format
```

## Requirements

- Node.js >= 18.0.0
- Git >= 2.0.0
- GitHub account with repository access
- Internet connectivity

## Troubleshooting

### "Not authenticated" error
Make sure you've run `gt auth --token YOUR_TOKEN` with a valid GitHub personal access token.

### "Not a git repository" error
Run `git init` to initialize a Git repository first, or navigate to an existing Git repository.

### "Not initialized" error
Run `gt init` to initialize Graphite in the repository.

### "Remote not found" error
Make sure your repository has a GitHub remote configured:
```bash
git remote add origin https://github.com/username/repo.git
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Related Projects

- [Graphite CLI](https://graphite.dev) - The original Graphite CLI
- [GitHub CLI](https://cli.github.com) - Official GitHub CLI
- [git-town](https://www.git-town.com) - Generic Git workflow tool

## Acknowledgments

This project is inspired by the excellent [Graphite CLI](https://graphite.dev) and serves as an educational implementation of stacked PR workflows using GitHub's GraphQL API.
