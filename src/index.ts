#!/usr/bin/env node

import { Command } from 'commander';
import { GitService } from './services/git.service.js';
import { ConfigService } from './services/config.service.js';
import { StackService } from './services/stack.service.js';
import { createInitCommand } from './commands/init.js';
import { createAuthCommand } from './commands/auth.js';
import { createCreateCommand } from './commands/create.js';
import { createSubmitCommand } from './commands/submit.js';
import { createStackCommand } from './commands/stack.js';
import { createSyncCommand } from './commands/sync.js';
import { createCheckoutCommand } from './commands/checkout.js';
import { Logger } from './utils/logger.js';

async function main() {
  const program = new Command();

  // Initialize services
  const gitService = new GitService();
  const configService = new ConfigService();
  const stackService = new StackService(configService, gitService);

  // Configure CLI
  program
    .name('gt')
    .description('Graphite CLI Clone - Manage stacked pull requests with ease')
    .version('1.0.0');

  // Add commands
  program.addCommand(createInitCommand(gitService, configService));
  program.addCommand(createAuthCommand(configService));
  program.addCommand(createCreateCommand(gitService, configService, stackService));
  program.addCommand(createSubmitCommand(gitService, configService));
  program.addCommand(createStackCommand(gitService, configService, stackService));
  program.addCommand(createSyncCommand(gitService, configService, stackService));
  program.addCommand(createCheckoutCommand(gitService, configService));

  // Handle unknown commands
  program.on('command:*', () => {
    Logger.error(`Unknown command: ${program.args.join(' ')}`);
    Logger.info('Run "gt --help" for available commands.');
    process.exit(1);
  });

  // Parse arguments
  await program.parseAsync(process.argv);
}

// Run CLI
main().catch((error) => {
  Logger.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
