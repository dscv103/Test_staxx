import { Branch, Stack, BranchMetadata } from '../models/index.js';
import { ConfigService } from './config.service.js';
import { GitService } from './git.service.js';
import { GraphiteError } from '../utils/errors.js';
import chalk from 'chalk';

export class StackService {
  constructor(
    private configService: ConfigService,
    private gitService: GitService
  ) {}

  async getStack(branchName?: string): Promise<Stack> {
    const currentBranch = branchName || (await this.gitService.getCurrentBranch());
    const stacks = await this.configService.getStackMetadata();

    const branches = new Map<string, Branch>();

    // Build branch map from metadata
    for (const [name, metadata] of Object.entries(stacks)) {
      branches.set(name, {
        name,
        parent: metadata.parent,
        children: metadata.children,
        prNumber: metadata.pr || null,
        prUrl: metadata.prUrl || null,
        lastSynced: metadata.lastSynced ? new Date(metadata.lastSynced) : new Date(),
      });
    }

    // Find root of current stack
    let root = currentBranch;
    const visited = new Set<string>();

    while (branches.has(root) && branches.get(root)!.parent) {
      if (visited.has(root)) {
        throw new GraphiteError('Circular dependency detected in stack');
      }
      visited.add(root);
      root = branches.get(root)!.parent!;
    }

    return {
      root,
      branches,
      currentBranch,
    };
  }

  async addToStack(branchName: string, parentBranch: string): Promise<void> {
    const metadata: BranchMetadata = {
      parent: parentBranch,
      children: [],
      lastSynced: new Date().toISOString(),
    };

    await this.configService.saveBranchMetadata(branchName, metadata);

    // Update parent's children list
    const parentMetadata = await this.configService.getBranchMetadata(parentBranch);
    if (parentMetadata) {
      if (!parentMetadata.children.includes(branchName)) {
        parentMetadata.children.push(branchName);
        await this.configService.saveBranchMetadata(parentBranch, parentMetadata);
      }
    }
  }

  async removeFromStack(branchName: string): Promise<void> {
    const metadata = await this.configService.getBranchMetadata(branchName);
    if (!metadata) return;

    // Remove from parent's children list
    if (metadata.parent) {
      const parentMetadata = await this.configService.getBranchMetadata(metadata.parent);
      if (parentMetadata) {
        parentMetadata.children = parentMetadata.children.filter((c) => c !== branchName);
        await this.configService.saveBranchMetadata(metadata.parent, parentMetadata);
      }
    }

    await this.configService.removeBranchMetadata(branchName);
  }

  async visualizeStack(branchName?: string): Promise<string> {
    const stack = await this.getStack(branchName);
    const lines: string[] = [];

    const buildTree = (branch: string, prefix: string = '', isLast: boolean = true): void => {
      const branchData = stack.branches.get(branch);
      const isCurrent = branch === stack.currentBranch;
      const connector = isLast ? '└─' : '├─';
      const extension = isLast ? '  ' : '│ ';

      let line = prefix + connector + ' ';

      if (isCurrent) {
        line += chalk.green.bold(`${branch} (current)`);
      } else {
        line += chalk.cyan(branch);
      }

      if (branchData?.prNumber) {
        line += chalk.gray(` [PR #${branchData.prNumber}]`);
      }

      lines.push(line);

      // Process children
      const children = branchData?.children || [];
      children.forEach((child, index) => {
        buildTree(child, prefix + extension, index === children.length - 1);
      });
    };

    buildTree(stack.root);
    return lines.join('\n');
  }

  async getUpstreamBranches(branchName: string): Promise<string[]> {
    const stack = await this.getStack(branchName);
    const upstream: string[] = [];

    let current = branchName;
    while (stack.branches.has(current) && stack.branches.get(current)!.parent) {
      const parent = stack.branches.get(current)!.parent!;
      upstream.push(parent);
      current = parent;
    }

    return upstream.reverse(); // Return from root to branch
  }

  async getDownstreamBranches(branchName: string): Promise<string[]> {
    const stack = await this.getStack(branchName);
    const downstream: string[] = [];

    const traverse = (branch: string): void => {
      const branchData = stack.branches.get(branch);
      if (!branchData) return;

      for (const child of branchData.children) {
        downstream.push(child);
        traverse(child);
      }
    };

    traverse(branchName);
    return downstream;
  }
}
