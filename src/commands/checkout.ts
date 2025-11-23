import { Command } from 'commander';
import { GitService } from '../services/git.service.js';
import { ConfigService } from '../services/config.service.js';
import { Logger } from '../utils/logger.js';
import { ConfigError, ValidationError } from '../utils/errors.js';

export function createCheckoutCommand(
  gitService: GitService,
  configService: ConfigService
): Command {
  const command = new Command('checkout');

  command
    .description('Switch to a different branch')
    .argument('<branch-name>', 'Name of the branch to checkout')
    .alias('co')
    .action(async (branchName: string) => {
      try {
        // Check if initialized
        if (!(await configService.isInitialized())) {
          throw new ConfigError('Repository not initialized. Run "gt init" first.');
        }

        // Check if branch exists
        if (!(await gitService.branchExists(branchName))) {
          throw new ValidationError(`Branch "${branchName}" does not exist`);
        }

        // Checkout the branch
        await gitService.checkoutBranch(branchName);

        Logger.success(`Switched to branch: ${branchName}`);
      } catch (error) {
        Logger.error((error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
