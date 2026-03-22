import { Octokit } from "octokit";

export function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

export async function getOrgRepos(org: string) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.listForOrg({
    org,
    sort: "updated",
    per_page: 20,
  });
  return data;
}

export async function getRepoCommits(owner: string, repo: string) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: 10,
  });
  return data;
}

export async function getRepoPulls(owner: string, repo: string) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 10,
  });
  return data;
}

export async function getRepoIssues(owner: string, repo: string) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 20,
  });
  return data.filter((issue) => !issue.pull_request);
}
