import { graphql } from '@octokit/graphql';
import { User, Repository, PullRequest } from '../models/index.js';
import { GitHubError } from '../utils/errors.js';
import {
  GET_VIEWER,
  GET_REPOSITORY,
  GET_PULL_REQUEST,
  LIST_PULL_REQUESTS,
  CREATE_PULL_REQUEST,
  UPDATE_PULL_REQUEST,
} from '../graphql/queries.js';

export class GitHubService {
  private graphqlClient: typeof graphql;

  constructor(token: string) {
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });
  }

  // Authentication
  async validateToken(): Promise<boolean> {
    try {
      await this.getAuthenticatedUser();
      return true;
    } catch {
      return false;
    }
  }

  async getAuthenticatedUser(): Promise<User> {
    try {
      const result: any = await this.graphqlClient(GET_VIEWER);
      return {
        login: result.viewer.login,
        name: result.viewer.name || result.viewer.login,
        email: result.viewer.email || '',
      };
    } catch (error) {
      throw new GitHubError(`Failed to authenticate: ${(error as Error).message}`);
    }
  }

  // Repository operations
  async getRepository(owner: string, name: string): Promise<Repository> {
    try {
      const result: any = await this.graphqlClient(GET_REPOSITORY, {
        owner,
        name,
      });

      const repo = result.repository;
      return {
        id: repo.id,
        name: repo.name,
        owner: repo.owner.login,
        defaultBranch: repo.defaultBranchRef?.name || 'main',
      };
    } catch (error) {
      throw new GitHubError(
        `Failed to get repository ${owner}/${name}: ${(error as Error).message}`
      );
    }
  }

  // Pull request operations
  async createPullRequest(params: {
    repositoryId: string;
    title: string;
    body: string;
    headRefName: string;
    baseRefName: string;
  }): Promise<PullRequest> {
    try {
      const result: any = await this.graphqlClient(CREATE_PULL_REQUEST, {
        input: {
          repositoryId: params.repositoryId,
          title: params.title,
          body: params.body,
          headRefName: params.headRefName,
          baseRefName: params.baseRefName,
        },
      });

      const pr = result.createPullRequest.pullRequest;
      return {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: params.body,
        state: 'OPEN',
        url: pr.url,
        headRef: params.headRefName,
        baseRef: params.baseRefName,
      };
    } catch (error) {
      throw new GitHubError(`Failed to create pull request: ${(error as Error).message}`);
    }
  }

  async getPullRequest(owner: string, name: string, number: number): Promise<PullRequest> {
    try {
      const result: any = await this.graphqlClient(GET_PULL_REQUEST, {
        owner,
        name,
        number,
      });

      const pr = result.repository.pullRequest;
      return {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        state: pr.state,
        url: pr.url,
        headRef: pr.headRefName,
        baseRef: pr.baseRefName,
      };
    } catch (error) {
      throw new GitHubError(`Failed to get pull request: ${(error as Error).message}`);
    }
  }

  async listPullRequests(
    owner: string,
    name: string,
    first: number = 10
  ): Promise<PullRequest[]> {
    try {
      const result: any = await this.graphqlClient(LIST_PULL_REQUESTS, {
        owner,
        name,
        first,
        after: null,
      });

      const prs = result.repository.pullRequests.nodes;
      return prs.map((pr: any) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        state: pr.state,
        url: pr.url,
        headRef: pr.headRefName,
        baseRef: pr.baseRefName,
      }));
    } catch (error) {
      throw new GitHubError(`Failed to list pull requests: ${(error as Error).message}`);
    }
  }

  async updatePullRequest(params: {
    pullRequestId: string;
    title?: string;
    body?: string;
    baseRefName?: string;
  }): Promise<void> {
    try {
      await this.graphqlClient(UPDATE_PULL_REQUEST, {
        input: params,
      });
    } catch (error) {
      throw new GitHubError(`Failed to update pull request: ${(error as Error).message}`);
    }
  }
}
