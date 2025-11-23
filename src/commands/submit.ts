import { Command } from 'commander';
import { GitService } from '../services/git.service.js';
import { ConfigService } from '../services/config.service.js';
import { GitHubService } from '../services/github.service.js';
import { Logger } from '../utils/logger.js';
import { ConfigError } from '../utils/errors.js';

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
          throw new ConfigError('Repository not initialized. Run "gt init" first.');
        }

        // Get authentication token
        const token = await configService.getToken();
        if (!token) {
          throw new ConfigError('Not authenticated. Run "gt auth" first.');
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

        // Check if branch has changes to push
        try {
          await gitService.push(currentBranch, true);
          Logger.info(`Pushed ${currentBranch} to remote`);
        } catch (error) {
          // Branch might already be pushed or no changes
          const errorMsg = (error as Error).message;
          if (errorMsg.includes('up-to-date') || errorMsg.includes('nothing to commit')) {
            Logger.verbose(`Branch already up-to-date`, true);
          } else {
            // Re-throw if it's a different error
            throw error;
          }
        }

        // Create GitHub service
        const githubService = new GitHubService(token);

        // Get repository details
        const repository = await githubService.getRepository(
          repoConfig.owner,
          repoConfig.name
        );

        // Prepare PR title and body
        const title = options.title || `[${currentBranch}] Feature implementation`;
        const body =
          options.body ||
          `## Changes\n\nThis PR contains changes from the \`${currentBranch}\` branch.\n\n` +
            `**Base branch:** ${baseBranch}`;

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
