import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import { GitError } from '../utils/errors.js';
import { parseGitHubUrl } from '../utils/validators.js';

export class GitService {
  private git: SimpleGit;

  constructor(baseDir: string = process.cwd()) {
    const options: Partial<SimpleGitOptions> = {
      baseDir,
      binary: 'git',
      maxConcurrentProcesses: 6,
    };
    this.git = simpleGit(options);
  }

  // Repository checks
  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async isClean(): Promise<boolean> {
    const status = await this.git.status();
    return status.isClean();
  }

  async getRemoteUrl(remote: string = 'origin'): Promise<string> {
    try {
      const remotes = await this.git.getRemotes(true);
      const originRemote = remotes.find((r) => r.name === remote);
      
      if (!originRemote) {
        throw new GitError(`Remote "${remote}" not found`);
      }

      return originRemote.refs.fetch || originRemote.refs.push || '';
    } catch (error) {
      throw new GitError(`Failed to get remote URL: ${(error as Error).message}`);
    }
  }

  async isGitHubRepository(): Promise<boolean> {
    try {
      const url = await this.getRemoteUrl();
      return url.includes('github.com');
    } catch {
      return false;
    }
  }

  async getGitHubRepoInfo(): Promise<{ owner: string; repo: string } | null> {
    try {
      const url = await this.getRemoteUrl();
      return parseGitHubUrl(url);
    } catch {
      return null;
    }
  }

  // Branch operations
  async getCurrentBranch(): Promise<string> {
    try {
      const status = await this.git.status();
      return status.current || '';
    } catch (error) {
      throw new GitError(`Failed to get current branch: ${(error as Error).message}`);
    }
  }

  async getBranches(): Promise<string[]> {
    try {
      const result = await this.git.branch();
      return result.all;
    } catch (error) {
      throw new GitError(`Failed to get branches: ${(error as Error).message}`);
    }
  }

  async branchExists(branchName: string): Promise<boolean> {
    const branches = await this.getBranches();
    return branches.includes(branchName);
  }

  async createBranch(name: string, startPoint?: string): Promise<void> {
    try {
      if (startPoint) {
        await this.git.checkoutBranch(name, startPoint);
      } else {
        await this.git.checkoutLocalBranch(name);
      }
    } catch (error) {
      throw new GitError(`Failed to create branch: ${(error as Error).message}`);
    }
  }

  async checkoutBranch(name: string): Promise<void> {
    try {
      await this.git.checkout(name);
    } catch (error) {
      throw new GitError(`Failed to checkout branch: ${(error as Error).message}`);
    }
  }

  async deleteBranch(name: string, force: boolean = false): Promise<void> {
    try {
      await this.git.deleteLocalBranch(name, force);
    } catch (error) {
      throw new GitError(`Failed to delete branch: ${(error as Error).message}`);
    }
  }

  // Remote operations
  async fetch(remote: string = 'origin'): Promise<void> {
    try {
      await this.git.fetch(remote);
    } catch (error) {
      throw new GitError(`Failed to fetch: ${(error as Error).message}`);
    }
  }

  async pull(branch?: string): Promise<void> {
    try {
      if (branch) {
        await this.git.pull('origin', branch);
      } else {
        await this.git.pull();
      }
    } catch (error) {
      throw new GitError(`Failed to pull: ${(error as Error).message}`);
    }
  }

  async push(branch?: string, setUpstream: boolean = false): Promise<void> {
    try {
      if (setUpstream && branch) {
        await this.git.push(['-u', 'origin', branch]);
      } else if (branch) {
        await this.git.push('origin', branch);
      } else {
        await this.git.push();
      }
    } catch (error) {
      throw new GitError(`Failed to push: ${(error as Error).message}`);
    }
  }

  // Commit operations
  async getDefaultBranch(): Promise<string> {
    try {
      // Try to get the default branch from remote
      await this.fetch();
      const result = await this.git.raw(['symbolic-ref', 'refs/remotes/origin/HEAD']);
      const match = result.match(/refs\/remotes\/origin\/(.+)/);
      return match ? match[1].trim() : 'main';
    } catch {
      // Fallback to common default branch names
      const branches = await this.getBranches();
      if (branches.includes('main')) return 'main';
      if (branches.includes('master')) return 'master';
      return 'main';
    }
  }

  async getCommitHash(ref: string = 'HEAD'): Promise<string> {
    try {
      const result = await this.git.revparse([ref]);
      return result.trim();
    } catch (error) {
      throw new GitError(`Failed to get commit hash: ${(error as Error).message}`);
    }
  }
}
