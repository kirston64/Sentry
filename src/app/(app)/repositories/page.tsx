import { GitBranch, GitCommit, GitPullRequest, Star } from "lucide-react";

const MOCK_REPOS = [
  {
    name: "fivem-core",
    language: "Lua",
    stars: 12,
    isPrivate: true,
    pulls: [
      { number: 42, title: "Fix vehicle sync desync on high load", author: "admin" },
      { number: 41, title: "Add new inventory UI", author: "developer" },
    ],
    commits: [
      { sha: "a1b2c3d", message: "fix: vehicle desync on 64+ players", author: "admin" },
      { sha: "e4f5g6h", message: "feat: new drug dealer NPC logic", author: "developer" },
      { sha: "i7j8k9l", message: "chore: update dependencies", author: "owner" },
    ],
  },
  {
    name: "server-config",
    language: "JSON",
    stars: 3,
    isPrivate: true,
    pulls: [],
    commits: [
      { sha: "m1n2o3p", message: "Update server limits for 128 slots", author: "owner" },
      { sha: "q4r5s6t", message: "Add new whitelist entries", author: "admin" },
    ],
  },
  {
    name: "inventory-system",
    language: "TypeScript",
    stars: 8,
    isPrivate: true,
    pulls: [
      { number: 15, title: "Drag and drop item reorder", author: "developer" },
    ],
    commits: [
      { sha: "u7v8w9x", message: "feat: item weight system", author: "developer" },
      { sha: "y1z2a3b", message: "fix: stack overflow on large inventories", author: "admin" },
    ],
  },
];

export default function RepositoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Repositories</h1>
        <span className="ml-2 text-xs text-text-muted">rp-project</span>
      </div>

      <div className="space-y-4">
        {MOCK_REPOS.map((repo) => (
          <div key={repo.name} className="rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">{repo.name}</span>
                {repo.isPrivate && (
                  <span className="rounded bg-error/20 px-1.5 py-0.5 text-[10px] text-error">private</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" /> {repo.stars}
                </span>
                <span className="flex items-center gap-1">
                  <GitPullRequest className="h-3 w-3 text-success" /> {repo.pulls.length} open
                </span>
                <span className="text-accent">{repo.language}</span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {repo.commits.map((commit) => (
                <div key={commit.sha} className="flex items-center gap-3 px-4 py-2 text-xs">
                  <GitCommit className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  <span className="font-mono text-warning">{commit.sha}</span>
                  <span className="truncate text-text-secondary">{commit.message}</span>
                  <span className="ml-auto shrink-0 text-text-muted">{commit.author}</span>
                </div>
              ))}
            </div>

            {repo.pulls.length > 0 && (
              <div className="border-t border-border">
                <div className="px-4 py-2 text-xs text-text-muted">Open Pull Requests:</div>
                {repo.pulls.map((pr) => (
                  <div key={pr.number} className="flex items-center gap-3 px-4 py-1.5 text-xs">
                    <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-success" />
                    <span className="truncate text-text-secondary">#{pr.number} {pr.title}</span>
                    <span className="ml-auto shrink-0 text-accent">{pr.author}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
