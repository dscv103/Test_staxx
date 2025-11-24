import { Command } from 'commander';
import { GitService } from '../services/git.service.js';
import { ConfigService } from '../services/config.service.js';
import { StackService } from '../services/stack.service.js';
import { Logger } from '../utils/logger.js';
import { ConfigError } from '../utils/errors.js';

export function createStackCommand(
  gitService: GitService,
  configService: ConfigService,
  stackService: StackService
): Command {
  const command = new Command('stack');

  command
    .description('Display the current branch stack')
    .option('-b, --branch <branch>', 'Show stack for a specific branch')
    .action(async (options) => {
      try {
        // Check if initialized
        if (!(await configService.isInitialized())) {
          throw new ConfigError('Repository not initialized. Run "stax init" first.');
        }

        // Get branch to visualize
        const branch = options.branch || (await gitService.getCurrentBranch());

        // Generate and display visualization
        const visualization = await stackService.visualizeStack(branch);

        if (visualization) {
          Logger.log('\nBranch Stack:');
          Logger.log(visualization);
          Logger.log('');
        } else {
          Logger.info('No stack found for this branch.');
        }
      } catch (error) {
        Logger.error((error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
