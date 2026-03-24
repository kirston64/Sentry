import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ORG = process.env.GITHUB_ORG;
const GITHUB_USER = process.env.GITHUB_USER;

interface GHRepo {
  name: string;
  full_name: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  description: string | null;
  updated_at: string;
  default_branch: string;
}

interface GHCommit {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  author: { login: string } | null;
}

interface GHPull {
  number: number;
  title: string;
  user: { login: string };
  state: string;
  html_url: string;
  created_at: string;
  head: { ref: string };
}

async function ghFetch(url: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  return res.json();
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If no token configured, return demo data
  if (!GITHUB_TOKEN || (!GITHUB_ORG && !GITHUB_USER)) {
    return NextResponse.json({
      configured: false,
      repos: getDemoRepos(),
    });
  }

  try {
    const endpoint = GITHUB_ORG
      ? `https://api.github.com/orgs/${GITHUB_ORG}/repos?sort=updated&per_page=10`
      : `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=10&type=owner`;

    const repos: GHRepo[] = await ghFetch(endpoint);

    const reposWithDetails = await Promise.all(
      repos.slice(0, 6).map(async (repo) => {
        const [commits, pulls] = await Promise.all([
          ghFetch(`https://api.github.com/repos/${repo.full_name}/commits?per_page=5`) as Promise<GHCommit[]>,
          ghFetch(`https://api.github.com/repos/${repo.full_name}/pulls?state=open&per_page=5`) as Promise<GHPull[]>,
        ]);

        return {
          name: repo.name,
          fullName: repo.full_name,
          isPrivate: repo.private,
          language: repo.language,
          stars: repo.stargazers_count,
          url: repo.html_url,
          description: repo.description,
          updatedAt: repo.updated_at,
          defaultBranch: repo.default_branch,
          commits: commits.map((c) => ({
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0],
            author: c.author?.login ?? c.commit.author.name,
            date: c.commit.author.date,
          })),
          pulls: pulls.map((p) => ({
            number: p.number,
            title: p.title,
            author: p.user.login,
            branch: p.head.ref,
            url: p.html_url,
            createdAt: p.created_at,
          })),
        };
      })
    );

    return NextResponse.json({ configured: true, repos: reposWithDetails });
  } catch (e) {
    console.error("GitHub API error:", e);
    return NextResponse.json({
      configured: true,
      error: "Failed to fetch from GitHub",
      repos: [],
    });
  }
}

function getDemoRepos() {
  return [
    {
      name: "ragemp-gamemode",
      fullName: "sentry-rp/ragemp-gamemode",
      isPrivate: true,
      language: "JavaScript",
      stars: 12,
      url: "#",
      description: "Main RAGE:MP gamemode — roleplay server core",
      updatedAt: "2026-03-22T14:00:00Z",
      defaultBranch: "main",
      commits: [
        { sha: "a1b2c3d", message: "fix: vehicle sync desync on high player count", author: "darkside-dev", date: "2026-03-22T14:00:00Z" },
        { sha: "e4f5g6h", message: "feat: new drug dealer NPC logic", author: "shadowlua-scripts", date: "2026-03-22T12:00:00Z" },
        { sha: "i7j8k9l", message: "chore: update dependencies", author: "darkside-dev", date: "2026-03-21T18:00:00Z" },
        { sha: "m1n2o3p", message: "feat: property purchase system", author: "codeviper-sql", date: "2026-03-21T15:00:00Z" },
        { sha: "q4r5s6t", message: "fix: NPC pathfinding stuck on stairs", author: "shadowlua-scripts", date: "2026-03-21T12:00:00Z" },
      ],
      pulls: [
        { number: 42, title: "Fix vehicle sync desync on high load", author: "nightwolf-sync", branch: "fix/vehicle-desync", url: "#", createdAt: "2026-03-22T10:00:00Z" },
        { number: 41, title: "Add new inventory UI with drag-and-drop", author: "pixelcraft-nui", branch: "feat/inventory-ui", url: "#", createdAt: "2026-03-21T14:00:00Z" },
      ],
    },
    {
      name: "ragemp-cef",
      fullName: "sentry-rp/ragemp-cef",
      isPrivate: true,
      language: "TypeScript",
      stars: 8,
      url: "#",
      description: "CEF (Chromium Embedded) UI — HUD, menus, inventory",
      updatedAt: "2026-03-21T18:00:00Z",
      defaultBranch: "main",
      commits: [
        { sha: "u7v8w9x", message: "feat: item weight system in inventory", author: "pixelcraft-nui", date: "2026-03-21T18:00:00Z" },
        { sha: "y1z2a3b", message: "fix: stack overflow on large inventories", author: "nightwolf-sync", date: "2026-03-21T15:00:00Z" },
        { sha: "c3d4e5f", message: "style: redesign health/armor HUD", author: "pixelcraft-nui", date: "2026-03-20T20:00:00Z" },
      ],
      pulls: [
        { number: 15, title: "Drag and drop item reorder", author: "pixelcraft-nui", branch: "feat/dnd-reorder", url: "#", createdAt: "2026-03-21T10:00:00Z" },
      ],
    },
    {
      name: "server-config",
      fullName: "sentry-rp/server-config",
      isPrivate: true,
      language: "JSON",
      stars: 3,
      url: "#",
      description: "Server configuration files and environment settings",
      updatedAt: "2026-03-20T14:00:00Z",
      defaultBranch: "main",
      commits: [
        { sha: "g7h8i9j", message: "Update server limits for 128 slots", author: "darkside-dev", date: "2026-03-20T14:00:00Z" },
        { sha: "k1l2m3n", message: "Add new whitelist entries", author: "netrunner-infra", date: "2026-03-19T12:00:00Z" },
      ],
      pulls: [],
    },
  ];
}
