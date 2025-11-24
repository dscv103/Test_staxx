import { Command } from 'commander';
import { GitService } from '../services/git.service.js';
import { ConfigService } from '../services/config.service.js';
import { GitHubService } from '../services/github.service.js';
import { Logger } from '../utils/logger.js';
import { ConfigError, ValidationError } from '../utils/errors.js';

export function createSubmitCommand(
  gitService: GitService,
  configService: ConfigService
): Command {
  const command = new Command('submit');

  command
    .description('Create a pull request for the current branch')
    .option('-t, --title <title>', 'PR title')
    .option('-b, --body <body>', 'PR description')
    .option('--base <branch>', 'Base branch for the PR')
    .action(async (options) => {
      try {
        // Check if initialized
        if (!(await configService.isInitialized())) {
          throw new ConfigError('Repository not initialized. Run "stax init" first.');
        }

        // Get authentication token
        const token = await configService.getToken();
        if (!token) {
          throw new ConfigError('Not authenticated. Run "stax auth" first.');
        }

        // Get current branch
        const currentBranch = await gitService.getCurrentBranch();

        // Get repository config
        const repoConfig = await configService.getRepoConfig();
        if (!repoConfig) {
          throw new ConfigError('Repository configuration not found.');
        }

        // Get branch metadata to determine base branch
        const branchMetadata = await configService.getBranchMetadata(currentBranch);
        const baseBranch =
          options.base || branchMetadata?.parent || repoConfig.defaultBranch;

        // Validate that head and base branch are different
        if (currentBranch === baseBranch) {
          throw new ValidationError(
            `Cannot create PR: head branch "${currentBranch}" is the same as base branch "${baseBranch}"`
          );
        }

        // Check if branch has changes to push
        try {
          await gitService.push(currentBranch, true);
          Logger.info(`Pushed ${currentBranch} to remote`);
        } catch (error) {
          // Accept push failures for up-to-date branches as normal flow
          Logger.verbose(`Push failed: ${(error as Error).message}`, true);
        }

        // Create GitHub service
        const githubService = new GitHubService(token);

        // Get repository details
        const repository = await githubService.getRepository(
          repoConfig.owner,
          repoConfig.name
        );

        // Prepare PR title and body
        const rawTitle = options.title || `[${currentBranch}] Feature implementation`;
        const rawBody =
          options.body ||
          `## Changes\n\nThis PR contains changes from the \`${currentBranch}\` branch.\n\n` +
            `**Base branch:** ${baseBranch}`;

        // Sanitize and validate PR title and body
        const title = rawTitle.trim();
        const body = rawBody.trim();
        const MAX_TITLE_LENGTH = 256; // GitHub PR title limit
        const MAX_BODY_LENGTH = 65536; // GitHub PR body limit
        if (!title) {
          throw new ValidationError('PR title cannot be empty. Please provide a non-empty title.');
        }
        if (title.length > MAX_TITLE_LENGTH) {
          throw new ValidationError(`PR title exceeds ${MAX_TITLE_LENGTH} characters. Please shorten your title.`);
        }
        if (body.length > MAX_BODY_LENGTH) {
          throw new ValidationError(`PR body exceeds ${MAX_BODY_LENGTH} characters. Please shorten your description.`);
        }
        // Create pull request
        Logger.info('Creating pull request...');
        const pr = await githubService.createPullRequest({
          repositoryId: repository.id,
          title,
          body,
          headRefName: currentBranch,
          baseRefName: baseBranch,
        });

        // Update branch metadata with PR info
        await configService.updateBranchPR(currentBranch, pr.number, pr.url);

        Logger.success(`Pull request created: #${pr.number}`);
        Logger.info(`URL: ${pr.url}`);
        Logger.info(`Base: ${baseBranch} ← Head: ${currentBranch}`);
      } catch (error) {
        Logger.error((error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
