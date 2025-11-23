export interface Branch {
  name: string;
  parent: string | null;
  children: string[];
  prNumber: number | null;
  prUrl: string | null;
  lastSynced: Date;
}

export interface Stack {
  root: string;
  branches: Map<string, Branch>;
  currentBranch: string;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  url: string;
  headRef: string;
  baseRef: string;
  id: string;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  defaultBranch: string;
}

export interface User {
  login: string;
  name: string;
  email: string;
}

export interface GraphiteConfig {
  version: string;
  repository?: {
    owner: string;
    name: string;
    defaultBranch: string;
  };
  stacks: Record<string, BranchMetadata>;
}

export interface BranchMetadata {
  parent: string | null;
  children: string[];
  pr?: number;
  prUrl?: string;
  lastSynced?: string;
}
