"use client";

import { useState, useEffect } from "react";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Star,
  Lock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock,
} from "lucide-react";
import { clsx } from "clsx";

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

interface Pull {
  number: number;
  title: string;
  author: string;
  branch: string;
  url: string;
  createdAt: string;
}

interface Repo {
  name: string;
  fullName: string;
  isPrivate: boolean;
  language: string | null;
  stars: number;
  url: string;
  description: string | null;
  updatedAt: string;
  defaultBranch: string;
  commits: Commit[];
  pulls: Pull[];
}

const LANG_COLORS: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-400",
  Lua: "bg-indigo-400",
  JSON: "bg-neutral-400",
  "C#": "bg-green-500",
  Python: "bg-green-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured ?? false);
        setRepos(data.repos ?? []);
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Repositories</h1>
          <span className="ml-2 text-xs text-text-muted">{repos.length} repos</span>
        </div>
        {!configured && (
          <div className="flex items-center gap-1.5 rounded bg-warning/10 px-2.5 py-1 text-[10px] text-warning">
            <AlertCircle className="h-3 w-3" />
            Demo mode — set GITHUB_TOKEN & GITHUB_ORG in .env
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-xs text-error">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {repos.map((repo) => {
          const expanded = expandedRepo === repo.name;
          return (
            <div key={repo.name} className="rounded-lg border border-border bg-surface">
              {/* Header */}
              <button
                onClick={() => setExpandedRepo(expanded ? null : repo.name)}
                className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-hover"
              >
                <div className="flex items-center gap-2">
                  {repo.language && (
                    <span className={`h-2.5 w-2.5 rounded-full ${LANG_COLORS[repo.language] ?? "bg-neutral-500"}`} />
                  )}
                  <span className="text-sm font-medium text-primary">{repo.name}</span>
                  {repo.isPrivate && (
                    <span className="flex items-center gap-0.5 rounded bg-text-muted/10 px-1.5 py-0.5 text-[10px] text-text-muted">
                      <Lock className="h-2.5 w-2.5" /> private
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeAgo(repo.updatedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" /> {repo.stars}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitPullRequest className="h-3 w-3 text-success" /> {repo.pulls.length} open
                  </span>
                  {repo.language && (
                    <span className="text-accent">{repo.language}</span>
                  )}
                </div>
              </button>

              {/* Description */}
              {repo.description && (
                <p className="px-4 pt-2 text-xs text-text-muted">{repo.description}</p>
              )}

              {/* Recent Commits */}
              <div className="divide-y divide-border">
                {(expanded ? repo.commits : repo.commits.slice(0, 3)).map((commit) => (
                  <div key={commit.sha} className="flex items-center gap-3 px-4 py-2 text-xs">
                    <GitCommit className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <span className="font-mono text-warning">{commit.sha}</span>
                    <span className="truncate text-text-secondary">{commit.message}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-2 text-text-muted">
                      <span>{commit.author}</span>
                      <span className="text-text-muted/50">{timeAgo(commit.date)}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Pull Requests */}
              {repo.pulls.length > 0 && (
                <div className="border-t border-border">
                  <div className="px-4 py-2 text-xs text-text-muted">Open Pull Requests:</div>
                  {repo.pulls.map((pr) => (
                    <div key={pr.number} className="flex items-center gap-3 px-4 py-1.5 text-xs">
                      <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-success" />
                      <span className="truncate text-text-secondary">
                        #{pr.number} {pr.title}
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-2">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                          {pr.branch}
                        </span>
                        <span className="text-accent">{pr.author}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              {expanded && repo.url !== "#" && (
                <div className="border-t border-border px-4 py-2">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open on GitHub
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
