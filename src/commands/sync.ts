import { Command } from 'commander';
import { GitService } from '../services/git.service.js';
import { ConfigService } from '../services/config.service.js';
import { StackService } from '../services/stack.service.js';
import { Logger } from '../utils/logger.js';
import { ConfigError } from '../utils/errors.js';

export function createSyncCommand(
  gitService: GitService,
  configService: ConfigService,
  stackService: StackService
): Command {
  const command = new Command('sync');

  command
    .description('Synchronize the current branch and its stack with remote')
    .action(async () => {
      try {
        // Check if initialized
        if (!(await configService.isInitialized())) {
          throw new ConfigError('Repository not initialized. Run "gt init" first.');
        }

        // Check if working directory is clean
        if (!(await gitService.isClean())) {
          throw new ConfigError(
            'Working directory has uncommitted changes. Please commit or stash them first.'
          );
        }

        const currentBranch = await gitService.getCurrentBranch();

        Logger.info('Fetching latest changes...');
        await gitService.fetch();

        // Get all branches in the stack
        const upstream = await stackService.getUpstreamBranches(currentBranch);
        const downstream = await stackService.getDownstreamBranches(currentBranch);
        const allBranches = [...upstream, currentBranch, ...downstream];

        Logger.info(`Syncing ${allBranches.length} branch(es) in stack...`);

        const failedBranches: string[] = [];
        let checkoutFailed = false;
        try {
          for (const branch of allBranches) {
            try {
              await gitService.checkoutBranch(branch);
              await gitService.pull(branch);
              Logger.success(`Synced: ${branch}`);
            } catch (error) {
              failedBranches.push(branch);
              Logger.warn(`Failed to sync ${branch}: ${(error as Error).message}`);
            }
          }
        } finally {
          // Always attempt to return to original branch
          try {
            await gitService.checkoutBranch(currentBranch);
          } catch (checkoutError) {
            checkoutFailed = true;
            Logger.error(
              `Failed to return to original branch ${currentBranch}: ${(checkoutError as Error).message}`
            );
          }
        }

        // If checkout back to original branch failed, get current branch and exit
        if (checkoutFailed) {
          try {
            const actualBranch = await gitService.getCurrentBranch();
            Logger.error(
              `Critical error: Unable to return to branch ${currentBranch}. ` +
              `Currently on branch: ${actualBranch}`
            );
          } catch {
            Logger.error(
              `Critical error: Unable to return to branch ${currentBranch} and cannot determine current branch.`
            );
          }
          process.exit(1);
        }

        // Report final status based on sync results
        if (failedBranches.length === 0) {
          Logger.success('Stack synchronized successfully!');
        } else if (failedBranches.length === allBranches.length) {
          Logger.error(`Failed to sync all ${allBranches.length} branch(es) in stack.`);
          process.exit(1);
        } else {
          Logger.warn(
            `Stack synchronized with ${failedBranches.length} warning(s). ` +
              `Failed branches: ${failedBranches.join(', ')}`
          );
          process.exit(2);
        }
      } catch (error) {
        Logger.error((error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
