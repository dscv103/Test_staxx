import { Command } from 'commander';
import { ConfigService } from '../services/config.service.js';
import { GitHubService } from '../services/github.service.js';
import { Logger } from '../utils/logger.js';
import { validateGitHubToken } from '../utils/validators.js';
import { ValidationError, GitHubError } from '../utils/errors.js';

export function createAuthCommand(configService: ConfigService): Command {
  const command = new Command('auth');

  command
    .description('Authenticate with GitHub')
    .option('-t, --token <token>', 'GitHub personal access token')
    .option('--logout', 'Remove stored authentication token')
    .action(async (options) => {
      try {
        // Handle logout
        if (options.logout) {
          await configService.clearToken();
          Logger.success('Successfully logged out. Token removed.');
          return;
        }

        // Get token
        const token = options.token;

        if (!token) {
          // Check if already authenticated
          const existingToken = await configService.getToken();
          if (existingToken) {
            // Validate existing token
            try {
              const githubService = new GitHubService(existingToken);
              const user = await githubService.getAuthenticatedUser();
              Logger.success(`Already authenticated as: ${user.login} (${user.name})`);
              return;
            } catch {
              Logger.warn('Existing token is invalid. Please provide a new token.');
            }
          }

          throw new ValidationError(
            'Please provide a GitHub token using: gt auth --token YOUR_TOKEN\n' +
              'Create a token at: https://github.com/settings/tokens'
          );
        }

        // Validate token format
        validateGitHubToken(token);

        // Test token with GitHub API
        const githubService = new GitHubService(token);
        const user = await githubService.getAuthenticatedUser();

        // Store token
        await configService.setToken(token);

        Logger.success(`Successfully authenticated as: ${user.login} (${user.name})`);
        Logger.info('Token stored securely.');
      } catch (error) {
        if (error instanceof ValidationError || error instanceof GitHubError) {
          Logger.error(error.message);
        } else {
          Logger.error(`Authentication failed: ${(error as Error).message}`);
        }
        process.exit(1);
      }
    });

  return command;
}
