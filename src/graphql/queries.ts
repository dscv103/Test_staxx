export const GET_VIEWER = `
  query {
    viewer {
      login
      name
      email
    }
  }
`;

export const GET_REPOSITORY = `
  query GetRepository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      name
      owner {
        login
      }
      defaultBranchRef {
        name
      }
    }
  }
`;

export const GET_PULL_REQUEST = `
  query GetPullRequest($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        id
        number
        title
        body
        state
        url
        headRefName
        baseRefName
      }
    }
  }
`;

export const LIST_PULL_REQUESTS = `
  query ListPullRequests($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: $first, after: $after, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          id
          number
          title
          body
          state
          url
          headRefName
          baseRefName
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const CREATE_PULL_REQUEST = `
  mutation CreatePullRequest($input: CreatePullRequestInput!) {
    createPullRequest(input: $input) {
      pullRequest {
        id
        number
        url
        title
      }
    }
  }
`;

export const UPDATE_PULL_REQUEST = `
  mutation UpdatePullRequest($input: UpdatePullRequestInput!) {
    updatePullRequest(input: $input) {
      pullRequest {
        id
        title
        body
      }
    }
  }
`;
