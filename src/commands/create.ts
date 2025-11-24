import { Command } from 'commander';
import { GitService } from '../services/git.service.js';
import { ConfigService } from '../services/config.service.js';
import { StackService } from '../services/stack.service.js';
import { Logger } from '../utils/logger.js';
import { validateBranchName } from '../utils/validators.js';
import { ValidationError, ConfigError } from '../utils/errors.js';

export function createCreateCommand(
  gitService: GitService,
  configService: ConfigService,
  stackService: StackService
): Command {
  const command = new Command('create');

  command
    .description('Create a new branch in the stack')
    .argument('<branch-name>', 'Name of the new branch')
    .option('-p, --parent <branch>', 'Parent branch (defaults to current branch)')
    .action(async (branchName: string, options) => {
      try {
        // Check if initialized
        if (!(await configService.isInitialized())) {
          throw new ConfigError('Repository not initialized. Run "stax init" first.');
        }

        // Validate branch name
        validateBranchName(branchName);

        // Check if branch already exists
        if (await gitService.branchExists(branchName)) {
          throw new ValidationError(`Branch "${branchName}" already exists`);
        }

        // Check if working directory is clean
        if (!(await gitService.isClean())) {
          throw new ValidationError(
            'Working directory has uncommitted changes. Please commit or stash them first.'
          );
        }

        // Get parent branch
        const parentBranch = options.parent || (await gitService.getCurrentBranch());

        // Verify parent exists
        if (!(await gitService.branchExists(parentBranch))) {
          throw new ValidationError(`Parent branch "${parentBranch}" does not exist`);
        }

        // Create the branch
        await gitService.createBranch(branchName, parentBranch);

        // Add to stack
        await stackService.addToStack(branchName, parentBranch);

        Logger.success(`Created branch: ${branchName}`);
        Logger.info(`Parent: ${parentBranch}`);
        Logger.info(`Checked out to: ${branchName}`);
      } catch (error) {
        Logger.error((error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
