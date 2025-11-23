import Conf from 'conf';
import { GraphiteConfig, BranchMetadata } from '../models/index.js';
import { ConfigError } from '../utils/errors.js';

interface AuthConfig {
  token?: string;
}

export class ConfigService {
  private config: Conf<AuthConfig>;
  private localConfig: Conf<GraphiteConfig>;

  constructor() {
    // Global config for auth token
    this.config = new Conf<AuthConfig>({
      projectName: 'graphite-cli-clone',
      encryptionKey: 'graphite-cli-secure-key-2024',
    });

    // Local config for repository-specific settings
    this.localConfig = new Conf({
      projectName: 'graphite-cli-clone',
      cwd: process.cwd(),
      configName: '.graphite/config',
    });
  }

  // Authentication methods
  async getToken(): Promise<string | null> {
    return this.config.get('token') || null;
  }

  async setToken(token: string): Promise<void> {
    this.config.set('token', token);
  }

  async clearToken(): Promise<void> {
    this.config.delete('token');
  }

  // Repository configuration
  async getRepoConfig(): Promise<GraphiteConfig['repository'] | undefined> {
    return this.localConfig.get('repository');
  }

  async setRepoConfig(
    owner: string,
    name: string,
    defaultBranch: string
  ): Promise<void> {
    this.localConfig.set('repository', {
      owner,
      name,
      defaultBranch,
    });
  }

  async initializeRepo(owner: string, name: string, defaultBranch: string): Promise<void> {
    const config: GraphiteConfig = {
      version: '1.0.0',
      repository: {
        owner,
        name,
        defaultBranch,
      },
      stacks: {},
    };

    this.localConfig.set(config);
  }

  async isInitialized(): Promise<boolean> {
    return this.localConfig.has('version');
  }

  // Stack metadata
  async getStackMetadata(): Promise<Record<string, BranchMetadata>> {
    return this.localConfig.get('stacks', {}) as Record<string, BranchMetadata>;
  }

  async getBranchMetadata(branchName: string): Promise<BranchMetadata | null> {
    const stacks = await this.getStackMetadata();
    return stacks[branchName] || null;
  }

  async saveBranchMetadata(branchName: string, metadata: BranchMetadata): Promise<void> {
    const stacks = await this.getStackMetadata();
    stacks[branchName] = metadata;
    this.localConfig.set('stacks', stacks);
  }

  async removeBranchMetadata(branchName: string): Promise<void> {
    const stacks = await this.getStackMetadata();
    delete stacks[branchName];
    this.localConfig.set('stacks', stacks);
  }

  async updateBranchPR(branchName: string, prNumber: number, prUrl: string): Promise<void> {
    const metadata = await this.getBranchMetadata(branchName);
    if (!metadata) {
      throw new ConfigError(`No metadata found for branch: ${branchName}`);
    }

    metadata.pr = prNumber;
    metadata.prUrl = prUrl;
    metadata.lastSynced = new Date().toISOString();

    await this.saveBranchMetadata(branchName, metadata);
  }
}
