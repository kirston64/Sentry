import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_ORG = process.env.GITHUB_ORG;

const owner = GITHUB_ORG || GITHUB_USER;

async function ghFetch(url: string) {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`);
  return res.json();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!GITHUB_TOKEN || !owner) {
    return NextResponse.json({ error: "GitHub not configured" }, { status: 400 });
  }

  const { name } = await params;
  const base = `https://api.github.com/repos/${owner}/${name}`;

  try {
    const [repo, branches, pulls, contributors] = await Promise.all([
      ghFetch(base),
      ghFetch(`${base}/branches?per_page=30`),
      ghFetch(`${base}/pulls?state=all&per_page=20`),
      ghFetch(`${base}/contributors?per_page=10`).catch(() => []),
    ]);

    // Fetch commits for each branch (top 5 branches)
    const topBranches = branches.slice(0, 10);
    const branchesWithCommits = await Promise.all(
      topBranches.map(async (b: { name: string; commit: { sha: string } }) => {
        const commits = await ghFetch(
          `${base}/commits?sha=${b.name}&per_page=5`
        ).catch(() => []);
        return {
          name: b.name,
          sha: b.commit.sha.slice(0, 7),
          isDefault: b.name === repo.default_branch,
          commits: commits.map((c: {
            sha: string;
            commit: { message: string; author: { name: string; date: string } };
            author: { login: string } | null;
          }) => ({
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0],
            author: c.author?.login ?? c.commit.author.name,
            date: c.commit.author.date,
          })),
        };
      })
    );

    return NextResponse.json({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      isPrivate: repo.private,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      branches: branchesWithCommits,
      pulls: pulls.map((p: {
        number: number;
        title: string;
        state: string;
        user: { login: string };
        head: { ref: string };
        base: { ref: string };
        html_url: string;
        created_at: string;
        merged_at: string | null;
      }) => ({
        number: p.number,
        title: p.title,
        state: p.state,
        merged: !!p.merged_at,
        author: p.user.login,
        branch: p.head.ref,
        baseBranch: p.base.ref,
        url: p.html_url,
        createdAt: p.created_at,
      })),
      contributors: contributors.map((c: {
        login: string;
        avatar_url: string;
        contributions: number;
        html_url: string;
      }) => ({
        login: c.login,
        avatar: c.avatar_url,
        contributions: c.contributions,
        url: c.html_url,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
