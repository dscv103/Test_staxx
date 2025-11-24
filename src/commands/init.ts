import { Command } from 'commander';
import { GitService } from '../services/git.service.js';
import { ConfigService } from '../services/config.service.js';
import { Logger } from '../utils/logger.js';
import { GitError } from '../utils/errors.js';

export function createInitCommand(
  gitService: GitService,
  configService: ConfigService
): Command {
  const command = new Command('init');

  command
    .description('Initialize Graphite in the current repository')
    .action(async () => {
      try {
        // Check if this is a git repository
        if (!(await gitService.isGitRepository())) {
          throw new GitError('Not a git repository. Please run "git init" first.');
        }

        // Check if already initialized
        if (await configService.isInitialized()) {
          Logger.warn('Graphite is already initialized in this repository.');
          return;
        }

        // Check if this is a GitHub repository
        if (!(await gitService.isGitHubRepository())) {
          throw new GitError(
            'This repository does not have a GitHub remote. Please add one first.'
          );
        }

        // Get repository info
        const repoInfo = await gitService.getGitHubRepoInfo();
        if (!repoInfo) {
          throw new GitError('Could not parse GitHub repository information from remote URL.');
        }

        // Get default branch
        const defaultBranch = await gitService.getDefaultBranch();

        // Initialize configuration
        await configService.initializeRepo(repoInfo.owner, repoInfo.repo, defaultBranch);

        Logger.success('Graphite initialized successfully!');
        Logger.info(`Repository: ${repoInfo.owner}/${repoInfo.repo}`);
        Logger.info(`Default branch: ${defaultBranch}`);
      } catch (error) {
        Logger.error((error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
